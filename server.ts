import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { verifyGoogleChatAuth, handleGoogleChatEvent } from './server/chatBotHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// Initialize GoogleGenAI server-side with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `
==================================================
IDENTIDAD Y ROL
==================================================
Nombre: TRASA HelpBot
Rol: Asistente virtual de Soporte Técnico de Infraestructura de TRASA.
Comportamiento: Primer nivel de soporte técnico. Ayudás a los usuarios de TRASA a diagnosticar y resolver problemas relacionados EXCLUSIVAMENTE con infraestructura informática, redes, conectividad, equipos y servicios de infraestructura.
Intentá resolver problemas sencillos mediante diagnóstico guiado paso a paso.
Cuando el problema requiera intervención de un técnico, recopilá la información necesaria y prepará la derivación a Infraestructura (a tickets@trasa.com.ar o Google Chat de soporte).

==================================================
ALCANCE EXCLUSIVO (SOLO ATENDER ESTOS TEMAS)
==================================================
1. HARDWARE:
   - Notebooks, PCs, Monitores, Teclados, Mouse, Docking stations.
   - Fuentes de alimentación, Cargadores, Periféricos.
   - Problemas de encendido, problemas de hardware, problemas de rendimiento relacionados con hardware, conexión de periféricos.
2. WINDOWS / SISTEMA OPERATIVO:
   - Problemas de inicio de Windows, errores de Windows, Pantallas azules (BSOD).
   - Problemas de inicio de sesión relacionados con el equipo, problemas de rendimiento, actualizaciones, drivers.
   - Configuración básica del sistema, problemas con dispositivos, problemas con servicios locales del sistema.
3. REDES:
   - LAN, Wi-Fi, Internet, Ethernet, Cable de red, Switches, Routers.
   - Conectividad, DNS, DHCP, Direcciones IP, problemas de gateway.
   - Problemas de acceso a recursos de red, problemas de conectividad entre equipos.
4. VPN:
   - Problemas para conectarse a la VPN, errores de conexión, problemas de conectividad después de establecer la VPN.
   - Diagnóstico básico de VPN, verificación de conectividad.
   - NUNCA solicitar contraseñas, códigos MFA, tokens ni credenciales.
5. IMPRESORAS Y DISPOSITIVOS DE RED:
   - Impresoras de red, impresoras locales, problemas de conexión, impresoras offline.
   - Problemas de cola de impresión, problemas de acceso a impresoras compartidas.
6. ACCESO A RECURSOS DE INFRAESTRUCTURA:
   - Carpetas compartidas, recursos de red, servidores, recursos internos, unidades de red (ej. Z:, Y:), conectividad con servidores.
7. ACTIVE DIRECTORY:
   - Solo problemas relacionados con infraestructura y acceso técnico: equipo que no puede autenticarse contra el dominio, problemas de conexión al dominio, políticas del equipo (GPO), inicio de sesión en Windows asociado al dominio, pertenencia al dominio.
   - NUNCA solicitar ni manejar contraseñas.
8. SERVICIOS DE INFRAESTRUCTURA:
   - DNS, DHCP, Active Directory, VPN, Wi-Fi, Red LAN/WAN, Servidores, Recursos compartidos, Servicios de autenticación, Conectividad.
   - No realizar cambios directamente sobre estos servicios.

==================================================
PROBLEMAS FUERA DEL ALCANCE (REGLA OBLIGATORIA)
==================================================
El bot NO debe atender como soporte técnico:
- RRHH, Sueldos, Vacaciones, Administración, Compras.
- Desarrollo, Programación, Magento, Gescom como aplicación, Errores funcionales de aplicaciones empresariales.
- Sistemas internos que no pertenezcan a Infraestructura.
- Consultas comerciales, legales, personales o generales.

SI EL USUARIO PREGUNTA ALGO FUERA DEL ALCANCE:
Respondé de manera clara, amable y breve con esta frase exacta o equivalente:
"Soy TRASA HelpBot y estoy especializado exclusivamente en Soporte Técnico de Infraestructura. Esta consulta corresponde a otra área de TRASA."
NO intentes resolver el problema fuera del alcance.

==================================================
METODOLOGÍA DE DIAGNÓSTICO
==================================================
Seguí siempre este flujo:
ENTENDER → RECOPILAR INFORMACIÓN → DIAGNOSTICAR → REALIZAR PRUEBAS → PROPONER SOLUCIÓN → VERIFICAR RESULTADO → RESOLVER O DERIVAR.
- Realizá el diagnóstico paso a paso.
- NO des una lista enorme de instrucciones de una sola vez. Proponé una sola prueba o indicación a la vez y esperá la respuesta.
- Hacé una sola pregunta a la vez (máximo dos), avanzando progresivamente.
- Preguntas clave cuando corresponda: ¿Qué equipo estás utilizando (notebook/PC)? ¿Estás conectado por Wi-Fi o cable? ¿Desde dónde estás trabajando (oficina o remoto)? ¿Qué mensaje de error exacto aparece? ¿Afecta sólo a tu equipo o a otros compañeros cercanos?

==================================================
IMPACTO
==================================================
Determiná si el problema afecta:
- Un solo usuario.
- Varios usuarios.
- Un sector.
- Toda la empresa.
- Un servicio de infraestructura general.
Si varios usuarios o un sector están afectados, priorizá la derivación rápida a Infraestructura considerándolo un posible incidente general.

==================================================
SEGURIDAD Y ACCIONES PROHIBIDAS
==================================================
- NUNCA solicitar contraseñas, códigos MFA, tokens, claves privadas ni credenciales.
- Si el usuario proporciona accidentalmente una contraseña, NO la repitas y decile: "Por seguridad, no compartas contraseñas ni códigos de autenticación por este medio."
- NUNCA indiques formatear el equipo, borrar archivos críticos, deshabilitar permanentemente antivirus o firewall, ni reiniciar servidores de producción.

==================================================
ESCALAMIENTO Y DERIVACIÓN
==================================================
Si el problema no se resuelve con el diagnóstico básico, O SI EL USUARIO SOLICITA EXPLÍCITAMENTE ENVIAR/DERIVAR EL CHAT A tickets@trasa.com.ar (ej: "necesito que recopile el chat y lo envie por mail a tickets@trasa.com.ar", "mandalo por mail", "derivar a tickets"):
1. Confirmá que recopilaste el chat de inmediato.
2. Presentá el reporte consolidado listo para ser enviado a tickets@trasa.com.ar:
   - Destinatario: tickets@trasa.com.ar
   - Solicitante: Usuario actual
   - Área: Soporte Técnico de Infraestructura
   - Equipo y Ubicación
   - Categoría / Incidente
   - Pruebas realizadas
   - Resultado
   - Acción recomendada para el técnico
3. Indicá que el usuario puede pulsar el botón para despacharlo a tickets@trasa.com.ar o abrirlo en Gmail. Incluí siempre la mención explícita a tickets@trasa.com.ar.

==================================================
TONO Y ESTILO
==================================================
- Profesional, amable, paciente, claro, directo y natural.
- Frases naturales: "Vamos a revisarlo paso a paso.", "Perfecto, con eso ya tenemos una pista.", "Probemos primero algo sencillo.", "Bien, esa prueba nos ayuda a descartar un problema de conexión."
- NUNCA inventes IPs, nombres de servidores o procedimientos falsos.
`;

// Helper: Generates content trying supported models with automatic resilient fallback
async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction: string;
  responseMimeType?: string;
  responseSchema?: any;
}) {
  // Try available models in order of capability & quota availability
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {
        systemInstruction: params.systemInstruction,
        temperature: 0.6,
      };
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed (${err.status || err.message}). Trying next fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo contactar los modelos disponibles.');
}

// Fallback rule-based guidance in case all Gemini quotas or network APIs are momentarily blocked
function getInfrastructureFallbackReply(userText: string): string {
  const lower = userText.toLowerCase();

  // Rechazo explícito de consultas fuera del alcance de Infraestructura
  if (
    lower.includes('sueldo') ||
    lower.includes('vacaciones') ||
    lower.includes('rrhh') ||
    lower.includes('recibo') ||
    lower.includes('gescom') ||
    lower.includes('magento') ||
    lower.includes('compras') ||
    lower.includes('liquidacion') ||
    lower.includes('licencia')
  ) {
    return 'Soy TRASA HelpBot y estoy especializado exclusivamente en Soporte Técnico de Infraestructura. Esta consulta corresponde a otra área de TRASA.';
  }

  if (
    lower.includes('tickets@trasa.com.ar') ||
    lower.includes('enviar por mail') ||
    lower.includes('envie por mail') ||
    lower.includes('recopile el chat') ||
    lower.includes('recopilar el chat') ||
    lower.includes('mandar mail') ||
    lower.includes('mandar correo')
  ) {
    return `¡Entendido! He recopilado el historial completo del chat de diagnóstico para enviarlo a **tickets@trasa.com.ar**.\n\n` +
      `📋 **Resumen del Reporte para Infraestructura:**\n` +
      `• **Destinatario**: tickets@trasa.com.ar\n` +
      `• **Área**: Soporte Técnico de Infraestructura\n` +
      `• **Incidente**: Falla de conectividad / red / equipo reportada en el diagnóstico\n` +
      `• **Historial adjunto**: Se incluye la transcripción completa de la conversación\n\n` +
      `Podés presionar el botón **"Derivar chat a tickets@trasa.com.ar"** a continuación para confirmar el envío o abrirlo directamente en Gmail / Outlook.`;
  }

  if (lower.includes('vpn')) {
    return `Vamos a revisar el inconveniente con la VPN paso a paso.\n\n` +
      `1. Primero comprobemos si tu equipo tiene conexión a Internet: ¿podés abrir el navegador e ingresar a cualquier página web como google.com o un diario?\n` +
      `2. ¿Qué mensaje de error exacto te muestra la VPN al intentar conectar (ej: "Error de autenticación", "Tiempo de espera agotado", "Gateway inaccesible")?\n\n` +
      `Contame cómo te fue con esa comprobación para continuar con el siguiente paso.`;
  }

  if (lower.includes('internet') || lower.includes('red') || lower.includes('wifi') || lower.includes('wi-fi')) {
    return `Entendido, revisemos la conectividad de tu puesto de trabajo.\n\n` +
      `1. ¿Estás conectado mediante cable de red (Ethernet) o por Wi-Fi?\n` +
      `2. ¿El problema ocurre únicamente en tu equipo o tenés algún compañero cercano que también haya perdido la conexión?\n\n` +
      `Avisame para determinar si es un problema puntual de tu equipo o de la red del sector.`;
  }

  if (lower.includes('impresora') || lower.includes('imprimir')) {
    return `Vamos a verificar el estado de la impresora de red.\n\n` +
      `1. ¿La impresora física tiene luz verde en su panel o muestra alguna alerta de atasco de papel o tóner?\n` +
      `2. En Windows, abrí la cola de impresión: ¿figura algún documento con estado "Error" que esté bloqueando los demás?\n\n` +
      `Probá cancelar los documentos con error y avisame si cambia su estado.`;
  }

  if (lower.includes('pantalla') || lower.includes('monitor') || lower.includes('dock')) {
    return `Vamos a revisar la conexión de tus pantallas o periféricos.\n\n` +
      `1. Desconectá y volvé a conectar firmemente el cable de video (HDMI / DisplayPort o USB-C del docking station).\n` +
      `2. En Windows, presioná la tecla Windows + P y asegurate de tener elegida la opción "Extender".\n\n` +
      `¿El monitor enciende su luz testigo o indica "Sin señal"?`;
  }

  return `Hola. Vamos a revisar este inconveniente de infraestructura paso a paso.\n\n` +
    `Para poder ayudarte mejor:\n` +
    `1. ¿Qué equipo estás utilizando (Notebook o PC de escritorio)?\n` +
    `2. ¿Desde dónde estás trabajando (sede u oficina de TRASA, o de forma remota desde tu casa)?\n` +
    `3. ¿Qué mensaje de error exacto aparece en tu pantalla?\n\n` +
    `Con estos datos aislamos la causa rápidamente.`;
}

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensajes requeridos' });
    }

    // Filter out initial greeting and system error messages
    const validMessages = messages.filter((m: any) =>
      m.id !== 'welcome-1' &&
      !m.content.includes('Ocurrió un error al contactar')
    );

    if (validMessages.length === 0) {
      return res.json({ reply: '¡Hola! ¿En qué puedo ayudarte con respecto a infraestructura, redes o tu equipo?' });
    }

    // Format contents for Gemini ensuring it begins with user and alternates properly
    const contents: any[] = [];
    for (const m of validMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (contents.length === 0 && role !== 'user') {
        continue;
      }
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${m.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: m.content }],
        });
      }
    }

    let fullSystemInstruction = SYSTEM_INSTRUCTION;
    if (userContext?.email) {
      fullSystemInstruction += `\nContexto del usuario actual en TRASA: ${userContext.name || ''} <${userContext.email}>. Canal de derivación oficial: tickets@trasa.com.ar (Área: Infraestructura).`;
    }

    try {
      const replyText = await generateContentWithFallback({
        contents,
        systemInstruction: fullSystemInstruction,
      });

      return res.json({ reply: replyText });
    } catch (genError: any) {
      console.error('All Gemini models exhausted, applying intelligent fallback:', genError.message || genError);
      const lastUserMsg = validMessages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || '';
      const fallbackReply = getInfrastructureFallbackReply(lastUserMsg);
      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: 'Error al comunicarse con el asistente de Soporte Técnico de Infraestructura',
      details: error.message,
    });
  }
});

// Structured Ticket Extraction endpoint (exclusive to Soporte Técnico de Infraestructura)
app.post('/api/extract-ticket', async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    const transcript = messages
      .map((m: any) => `${m.role === 'assistant' ? 'TRASA HelpBot' : 'Usuario'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Analizá la siguiente conversación de soporte técnico de INFRAESTRUCTURA de TRASA.
Extraé una ficha técnica estructurada para el equipo de Infraestructura.
Si el problema no fue resuelto automáticamente, debe quedar preparado para derivarse a tickets@trasa.com.ar.

Conversación:
${transcript}

Usuario: ${userContext?.name || 'Colaborador TRASA'} (${userContext?.email || 'usuario@trasa.com.ar'})`;

    try {
      const responseText = await generateContentWithFallback({
        contents: prompt,
        systemInstruction:
          'Sos un analista de incidentes de Infraestructura IT para TRASA. Clasificá el problema dentro de las categorías de Infraestructura: Hardware, Windows, Red, Wi-Fi, Internet, VPN, Impresoras, Active Directory, Servidores, Recursos compartidos, DNS, DHCP, Conectividad. Determiná el impacto (Un usuario, Varios usuarios, Sector, Empresa).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING, description: 'Título claro y técnico del incidente de infraestructura' },
            categoria: {
              type: Type.STRING,
              description: 'Categoría principal (Hardware, Windows, Red, Wi-Fi, Internet, VPN, Impresoras, Active Directory, Servidores, Recursos compartidos, DNS, DHCP, Conectividad)',
            },
            subcategoria: { type: Type.STRING, description: 'Subcategoría específica' },
            equipo: { type: Type.STRING, description: 'Tipo de equipo o recurso afectado' },
            ubicacion: { type: Type.STRING, description: 'Ubicación física' },
            impacto: { type: Type.STRING, description: 'Alcance del impacto' },
            prioridad: { type: Type.STRING, description: 'Baja, Media, Alta o Crítica' },
            descripcion: { type: Type.STRING, description: 'Descripción clara del problema' },
            sintomas: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Síntomas y mensajes de error' },
            pruebasRealizadas: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Pruebas de descarte realizadas' },
            resultado: { type: Type.STRING, description: 'Resultado obtenido' },
            accionRecomendada: { type: Type.STRING, description: 'Acción que debe ejecutar el técnico de Infraestructura' },
            requiereTecnico: { type: Type.BOOLEAN, description: 'Verdadero si el usuario no puede resolverlo solo' },
          },
          required: ['titulo', 'categoria', 'prioridad', 'descripcion', 'accionRecomendada', 'requiereTecnico'],
        },
      });

      const parsed = JSON.parse(responseText || '{}');
      parsed.area = 'Soporte Técnico de Infraestructura';
      parsed.destinatarioEmail = 'tickets@trasa.com.ar';
      return res.json({ ticket: parsed });
    } catch (err: any) {
      // Rule-based fallback ticket extraction if API limit reached
      const lastUserMsg = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || 'Incidente de infraestructura';
      const fallbackTicket = {
        titulo: lastUserMsg.slice(0, 60),
        area: 'Soporte Técnico de Infraestructura',
        categoria: lastUserMsg.toLowerCase().includes('vpn') ? 'VPN' : lastUserMsg.toLowerCase().includes('wifi') || lastUserMsg.toLowerCase().includes('internet') ? 'Red' : 'Hardware',
        subcategoria: 'General',
        equipo: 'Equipo del puesto de trabajo',
        ubicacion: 'Oficina / Remoto',
        impacto: 'Un solo usuario',
        prioridad: 'Media',
        descripcion: lastUserMsg,
        sintomas: [lastUserMsg],
        pruebasRealizadas: ['Diagnóstico guiado paso a paso con TRASA HelpBot'],
        resultado: 'El problema requiere intervención del equipo técnico',
        accionRecomendada: 'Contacto directo y asistencia técnica de Infraestructura',
        requiereTecnico: true,
        destinatarioEmail: 'tickets@trasa.com.ar',
      };
      return res.json({ ticket: fallbackTicket });
    }
  } catch (error: any) {
    console.error('Error in /api/extract-ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to dispatch full chat transcript to tickets@trasa.com.ar (Infraestructura)
app.post('/api/send-email-ticket', async (req, res) => {
  try {
    const { transcript, ticket, userEmail, userName, notes } = req.body;

    const recipient = 'tickets@trasa.com.ar';
    const subject = `[INFRAESTRUCTURA TRASA] ${ticket?.titulo || 'Incidente de infraestructura'} - ${userName || userEmail || 'Usuario'}`;

    const formattedEmailBody = `=======================================================
REPORTE DE INCIDENTE — INFRAESTRUCTURA TRASA
Destinatario: ${recipient}
Fecha: ${new Date().toLocaleString('es-AR')}
=======================================================

DATOS DEL SOLICITANTE:
Usuario: ${userName || 'Colaborador TRASA'}
Email: ${userEmail || 'usuario@trasa.com.ar'}
Equipo: ${ticket?.equipo || 'No especificado'}
Ubicación: ${ticket?.ubicacion || 'Oficina / Remoto'}

DETALLE DE INFRAESTRUCTURA:
Área: Soporte Técnico de Infraestructura
Categoría: ${ticket?.categoria || 'General'}
Subcategoría: ${ticket?.subcategoria || 'No especificada'}
Impacto: ${ticket?.impacto || 'Un solo usuario'}
Prioridad sugerida: ${ticket?.prioridad || 'Media'}

TÍTULO DEL PROBLEMA:
${ticket?.titulo || 'Incidente de Infraestructura'}

DESCRIPCIÓN:
${ticket?.descripcion || 'No detallada'}

SÍNTOMAS REPORTADOS:
${ticket?.sintomas ? ticket.sintomas.map((s: string) => `• ${s}`).join('\n') : 'Detallados en el chat'}

PRUEBAS DE DIAGNÓSTICO REALIZADAS (TRASA HelpBot):
${ticket?.pruebasRealizadas ? ticket.pruebasRealizadas.map((p: string) => `• ${p}`).join('\n') : 'Diagnóstico paso a paso efectuado'}

RESULTADO:
${ticket?.resultado || 'Incidente no resoluble mediante diagnóstico básico'}

ACCIÓN REQUERIDA PARA EL TÉCNICO DE INFRAESTRUCTURA:
${ticket?.accionRecomendada || 'Intervención y contacto directo con el usuario'}

${notes ? `NOTAS ADICIONALES DEL USUARIO:\n${notes}\n` : ''}
=======================================================
HISTORIAL COMPLETO DEL CHAT DE DIAGNÓSTICO:
=======================================================
${transcript || 'Sin historial'}
=======================================================`;

    console.log(`[TICKET INFRAESTRUCTURA] Enviado a ${recipient}:`, subject);

    res.json({
      success: true,
      recipient,
      subject,
      body: formattedEmailBody,
      mailtoUrl: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedEmailBody)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/send-email-ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Chat proxy endpoint: list spaces
app.get('/api/google-chat/spaces', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de acceso de Google no proporcionado' });
    }

    const googleRes = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=20', {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      return res.status(googleRes.status).json({
        error: 'Error al consultar Google Chat API',
        details: errText,
      });
    }

    const data = await googleRes.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/google-chat/spaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Chat proxy endpoint: post message to space
app.post('/api/google-chat/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de acceso no proporcionado' });
    }

    const { spaceName, messageText, card } = req.body;
    if (!spaceName) {
      return res.status(400).json({ error: 'Nombre de espacio requerido' });
    }

    const payload: any = {};
    if (messageText) payload.text = messageText;
    if (card) payload.cardsV2 = card;

    const endpoint = `https://chat.googleapis.com/v1/${spaceName}/messages`;
    const googleRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      return res.status(googleRes.status).json({
        error: 'Error al enviar mensaje a Google Chat',
        details: errText,
      });
    }

    const data = await googleRes.json();
    res.json({ success: true, message: data });
  } catch (error: any) {
    console.error('Error in /api/google-chat/send:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Chat Webhook: Recibe eventos interactivos y mensajes de Google Chat
app.post('/api/google-chat/webhook', async (req, res) => {
  try {
    // 1. Validar autenticación del token Bearer de Google Chat
    const authResult = await verifyGoogleChatAuth(req);
    if (!authResult.isValid) {
      console.warn(`[Google Chat Webhook] Solicitud rechazada (401): ${authResult.error}`);
      return res.status(401).json({ error: authResult.error || 'No autorizado' });
    }

    // 2. Procesar el evento con el motor de diagnóstico unificado de Infraestructura
    await handleGoogleChatEvent(req, res, {
      systemInstruction: SYSTEM_INSTRUCTION,
      generateContent: generateContentWithFallback,
      getFallbackReply: getInfrastructureFallbackReply,
    });
  } catch (error: any) {
    console.error('[Google Chat Webhook] Error no controlado en webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor en webhook de Google Chat' });
  }
});

// Setup Vite middleware or static serving
async function setupViteOrStatic() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRASA HelpBot Infraestructura running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic();
