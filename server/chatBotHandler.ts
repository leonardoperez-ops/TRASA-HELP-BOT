/**
 * server/chatBotHandler.ts
 * 
 * Controlador de eventos para el webhook de Google Chat.
 * Valida autenticación con google-auth-library, gestiona hilos de conversación
 * e invoca el motor de diagnóstico de Infraestructura de TRASA HelpBot.
 */

import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { chatThreadStore } from './chatThreadStore.js';
import { KNOWLEDGE_BASE } from '../src/data/knowledgeBase.js';

const authClient = new OAuth2Client();

// Correo de la cuenta de servicio oficial que firma los tokens de eventos de Google Chat
const CHAT_ISSUER_SERVICE_ACCOUNT = 'chat@system.gserviceaccount.com';

export interface ChatEngineDependencies {
  systemInstruction: string;
  generateContent: (params: {
    contents: any;
    systemInstruction: string;
    responseMimeType?: string;
    responseSchema?: any;
  }) => Promise<string>;
  getFallbackReply: (userText: string) => string;
}

/**
 * Valida el ID Token de Google Chat presente en el header Authorization.
 * Verifica la firma criptográfica de Google, el emisor legítimo y el audience (Project Number).
 */
export async function verifyGoogleChatAuth(req: Request): Promise<{ isValid: boolean; error?: string }> {
  const authHeader = req.headers.authorization;
  const projectNumber = process.env.GOOGLE_CHAT_APP_PROJECT_NUMBER?.trim();

  // Si no hay header de autorización
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: 'Encabezado de autorización ausente o con formato inválido (se requiere Bearer token)',
    };
  }

  const token = authHeader.substring(7).trim();

  // Soporte para entornos de desarrollo local / pruebas sin token real de GCP
  const isDev = process.env.NODE_ENV !== 'production';
  if (!projectNumber) {
    if (isDev && (token === 'dev-token' || token === 'test-token' || token.length > 10)) {
      console.warn('[Google Chat Auth] ADVERTENCIA: GOOGLE_CHAT_APP_PROJECT_NUMBER no configurado. Token aceptado solo en modo desarrollo.');
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'GOOGLE_CHAT_APP_PROJECT_NUMBER no configurado en el servidor para validar el webhook de Google Chat.',
    };
  }

  try {
    const ticket = await authClient.verifyIdToken({
      idToken: token,
      audience: projectNumber,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { isValid: false, error: 'Token no contiene un payload válido.' };
    }

    // Validar emisor
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return { isValid: false, error: `Emisor de token no autorizado: ${payload.iss}` };
    }

    // Validar cuenta de servicio de Google Chat
    if (payload.email !== CHAT_ISSUER_SERVICE_ACCOUNT) {
      return { isValid: false, error: `Emisor de servicio no autorizado: ${payload.email}` };
    }

    return { isValid: true };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Error de verificación criptográfica de Google Chat: ${err.message || err}`,
    };
  }
}

/**
 * Limpia la mención del bot del texto enviado por el usuario.
 * Por ejemplo: "@TRASA HelpBot no me anda la VPN" -> "no me anda la VPN"
 */
export function cleanBotMention(rawText: string, annotations?: any[]): string {
  if (!rawText) return '';

  let cleaned = rawText;

  // Si Google Chat envió anotaciones de mención de usuario
  if (Array.isArray(annotations)) {
    for (const ann of annotations) {
      if (ann.type === 'USER_MENTION' && ann.userMention?.user?.type === 'BOT') {
        // Remover el nombre o formato de mención
        if (ann.userMention?.displayName) {
          cleaned = cleaned.replace(new RegExp(`@?${escapeRegex(ann.userMention.displayName)}`, 'gi'), '');
        }
      }
    }
  }

  // Limpieza genérica adicional de nombres típicos del bot
  cleaned = cleaned
    .replace(/@TRASA\s*HelpBot/gi, '')
    .replace(/@HelpBot/gi, '')
    .replace(/<users\/[^>]+>/g, '') // Formato interno de mención en Google Chat (<users/12345>)
    .trim();

  return cleaned;
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Genera el contexto ampliado de Infraestructura inyectando la Base de Conocimientos oficial.
 */
function buildEnhancedSystemInstruction(baseInstruction: string, userName?: string, userEmail?: string): string {
  let instruction = baseInstruction;

  if (userName || userEmail) {
    instruction += `\n\n==================================================\nDATOS DEL USUARIO ACTUAL (GOOGLE CHAT):\n- Nombre: ${userName || 'Usuario TRASA'}\n- Correo: ${userEmail || 'usuario@trasa.com.ar'}\n==================================================\n`;
  }

  instruction += `\n\n==================================================\nBASE DE CONOCIMIENTOS DE INFRAESTRUCTURA (GUÍAS TÉCNICAS):\n`;
  for (const art of KNOWLEDGE_BASE) {
    instruction += `\n[TEMA: ${art.title} (Categoría: ${art.category})]\nResumen: ${art.summary}\nPasos técnicos recomendados: ${art.steps.join(' -> ')}\nDestino de escalamiento: ${art.escalationTarget}\n`;
  }
  instruction += `\n==================================================\n`;

  return instruction;
}

/**
 * Orquestador principal de eventos de Google Chat.
 */
export async function handleGoogleChatEvent(
  req: Request,
  res: Response,
  engine: ChatEngineDependencies
): Promise<void> {
  const startTime = Date.now();
  const event = req.body;

  if (!event || typeof event !== 'object') {
    res.status(400).json({ error: 'Payload de evento de Google Chat no válido o vacío.' });
    return;
  }

  const eventType: string = event.type || event.eventType || 'UNKNOWN';
  const spaceName: string = event.space?.name || 'unknown-space';
  const spaceType: string = event.space?.type || 'SPACE';
  const threadName: string = event.message?.thread?.name || `${spaceName}/threads/default`;
  const user = event.user || {};
  const userDisplayName: string = user.displayName || user.name || 'Colaborador TRASA';
  const userEmail: string = user.email || '';

  // Log estructurado y sanitizado (nunca exponer credenciales ni tokens)
  console.log(`[Google Chat Webhook] Evento recibido: ${eventType} | Espacio: ${spaceName} (${spaceType}) | Usuario: ${userDisplayName} <${userEmail || 'sin email'}>`);

  try {
    // -------------------------------------------------------------
    // 1. EVENTO: ADDED_TO_SPACE (El bot fue agregado a un espacio o DM)
    // -------------------------------------------------------------
    if (eventType === 'ADDED_TO_SPACE') {
      const welcomeText =
        `👋 *¡Hola ${userDisplayName}! Soy TRASA HelpBot*\n\n` +
        `Asistente virtual de *Soporte Técnico de Infraestructura* de TRASA.\n\n` +
        `🛠️ *Temas de infraestructura que atiendo:*\n` +
        `• *Hardware y Periféricos*: Notebooks, PCs, monitores, cargadores, docking stations.\n` +
        `• *Conectividad y Redes*: Wi-Fi corporativo (TRASA_CORP), cable de red, lentitud o caída de Internet.\n` +
        `• *VPN*: Problemas de conexión y acceso seguro remoto desde tu casa.\n` +
        `• *Windows y Sistema*: Errores de inicio, pantallas azules (BSOD), actualizaciones.\n` +
        `• *Impresoras de red*: Equipos fuera de línea o documentos trabados.\n` +
        `• *Recursos y Dominio*: Carpetas compartidas, unidades de red (Z:, Y:) y Active Directory.\n\n` +
        `📌 *¿Cómo usarme?*\n` +
        `Escribime detallando el inconveniente. Haremos pruebas paso a paso para intentar resolverlo y, si es necesario, prepararemos la derivación directa a *tickets@trasa.com.ar*.\n\n` +
        `_¿Qué problema técnico estás experimentando hoy?_`;

      res.status(200).json({ text: welcomeText });
      return;
    }

    // -------------------------------------------------------------
    // 2. EVENTO: REMOVED_FROM_SPACE (El bot fue quitado de un espacio)
    // -------------------------------------------------------------
    if (eventType === 'REMOVED_FROM_SPACE') {
      console.log(`[Google Chat Webhook] El bot fue removido del espacio: ${spaceName}`);
      // Limpiar sesiones del hilo si correspondiese
      await chatThreadStore.deleteSession(threadName);
      res.status(200).json({});
      return;
    }

    // -------------------------------------------------------------
    // 3. EVENTO: CARD_CLICKED (Clic en botón de tarjeta interactiva)
    // -------------------------------------------------------------
    if (eventType === 'CARD_CLICKED') {
      const actionName = event.action?.actionMethodName || 'unknown_action';
      console.log(`[Google Chat Webhook] Acción de tarjeta ejecutada: ${actionName} en hilo ${threadName}`);

      res.status(200).json({
        text: `Acción recibida: ${actionName}. Procesando tu solicitud de infraestructura...`,
      });
      return;
    }

    // -------------------------------------------------------------
    // 4. EVENTO: MESSAGE (Mensaje recibido por DM o mención en espacio)
    // -------------------------------------------------------------
    if (eventType === 'MESSAGE') {
      const rawText: string = event.message?.argumentText || event.message?.text || '';
      const annotations = event.message?.annotations;
      const cleanedMessage = cleanBotMention(rawText, annotations);

      // Si el mensaje quedó vacío tras limpiar la mención (ej: el usuario solo escribió "@TRASA HelpBot")
      if (!cleanedMessage) {
        res.status(200).json({
          text: `¡Hola ${userDisplayName}! Estoy aquí para ayudarte con problemas de infraestructura, redes, VPN, Windows o tu equipo. ¿Qué inconveniente estás teniendo?`,
        });
        return;
      }

      console.log(`[Google Chat Webhook] Mensaje del usuario: "${cleanedMessage.slice(0, 100)}..." (Hilo: ${threadName})`);

      // 4.1 Recuperar el historial aislado de la conversación de este thread específico
      const existingSession = await chatThreadStore.getSession(threadName);
      const conversationHistory = existingSession?.messages || [];

      // 4.2 Construir la lista de contenidos para Gemini
      const contents: any[] = [];

      for (const m of conversationHistory) {
        contents.push({
          role: m.role,
          parts: [{ text: m.content }],
        });
      }

      // Agregar el nuevo mensaje del usuario
      contents.push({
        role: 'user',
        parts: [{ text: cleanedMessage }],
      });

      // 4.3 Generar respuesta utilizando el motor de diagnóstico unificado
      const enhancedInstruction = buildEnhancedSystemInstruction(
        engine.systemInstruction,
        userDisplayName,
        userEmail
      );

      let botReply: string;
      try {
        // Timeout de seguridad de 8.5s para garantizar respuesta rápida a Google Chat
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_GEMINI')), 8500)
        );

        botReply = await Promise.race([
          engine.generateContent({
            contents,
            systemInstruction: enhancedInstruction,
          }),
          timeoutPromise,
        ]);
      } catch (geminiError: any) {
        console.warn(`[Google Chat Webhook] Error en llamada a Gemini (${geminiError.message || geminiError}). Aplicando fallback de infraestructura...`);
        botReply = engine.getFallbackReply(cleanedMessage);
      }

      // 4.4 Guardar el turno en la memoria del thread
      await chatThreadStore.addMessages(threadName, cleanedMessage, botReply, {
        spaceId: spaceName,
        userId: user.name || 'unknown-user',
        userName: userDisplayName,
        userEmail: userEmail,
      });

      const elapsed = Date.now() - startTime;
      console.log(`[Google Chat Webhook] Respuesta enviada satisfactoriamente en ${elapsed}ms | Hilo: ${threadName}`);

      // Respuesta estándar compatible con Google Chat
      res.status(200).json({
        text: botReply,
      });
      return;
    }

    // Tipo de evento no reconocido
    console.warn(`[Google Chat Webhook] Tipo de evento desconocido o no soportado: ${eventType}`);
    res.status(200).json({
      text: 'Evento recibido por TRASA HelpBot.',
    });
  } catch (error: any) {
    console.error('[Google Chat Webhook] Error interno procesando evento:', error);
    res.status(500).json({
      error: 'Error interno en el asistente de Google Chat',
      details: error.message,
    });
  }
}
