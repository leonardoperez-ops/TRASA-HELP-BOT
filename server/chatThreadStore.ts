/**
 * server/chatThreadStore.ts
 * 
 * Gestor de sesiones e historial de conversaciones de Google Chat por thread.
 * Mantiene el contexto de diagnóstico aislado por cada hilo de conversación.
 * 
 * Arquitectura modular preparada con interfaz IThreadStore para permitir
 * el reemplazo transparente del almacenamiento en memoria por Firestore.
 */

export interface ChatThreadMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatThreadSession {
  threadId: string;
  spaceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  messages: ChatThreadMessage[];
  lastActivity: number;
}

export interface IThreadStore {
  getSession(threadKey: string): Promise<ChatThreadSession | null>;
  saveSession(session: ChatThreadSession): Promise<void>;
  addMessages(
    threadKey: string,
    userMessage: string,
    modelReply: string,
    metadata: {
      spaceId: string;
      userId: string;
      userName?: string;
      userEmail?: string;
    }
  ): Promise<ChatThreadSession>;
  deleteSession(threadKey: string): Promise<void>;
  cleanupOldSessions(): Promise<number>;
}

export class InMemoryThreadStore implements IThreadStore {
  private sessions: Map<string, ChatThreadSession> = new Map();
  // Tiempo de vida de la sesión: 4 horas de inactividad
  private readonly ttlMs: number;
  private readonly maxMessagesPerThread: number;

  constructor(ttlHours: number = 4, maxMessagesPerThread: number = 20) {
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.maxMessagesPerThread = maxMessagesPerThread;

    // Tarea periódica de limpieza cada 30 minutos
    setInterval(() => {
      this.cleanupOldSessions().catch((err) => {
        console.error('[ThreadStore] Error en limpieza periódica de sesiones:', err);
      });
    }, 30 * 60 * 1000).unref();
  }

  /**
   * Obtiene la sesión activa de un thread específico.
   * Si la sesión ha expirado por TTL, se descarta para iniciar una nueva.
   */
  async getSession(threadKey: string): Promise<ChatThreadSession | null> {
    const session = this.sessions.get(threadKey);
    if (!session) {
      return null;
    }

    const now = Date.now();
    if (now - session.lastActivity > this.ttlMs) {
      this.sessions.delete(threadKey);
      return null;
    }

    return session;
  }

  /**
   * Persiste la sesión en memoria actualizando la marca temporal de actividad.
   */
  async saveSession(session: ChatThreadSession): Promise<void> {
    session.lastActivity = Date.now();
    this.sessions.set(session.threadId, session);
  }

  /**
   * Agrega el turno de conversación (usuario + respuesta del bot) al hilo correspondiente.
   * Asegura el aislamiento estricto por thread y acota el historial a los últimos mensajes
   * más relevantes para no exceder los límites de tokens de contexto.
   */
  async addMessages(
    threadKey: string,
    userMessage: string,
    modelReply: string,
    metadata: {
      spaceId: string;
      userId: string;
      userName?: string;
      userEmail?: string;
    }
  ): Promise<ChatThreadSession> {
    let session = await this.getSession(threadKey);
    const now = Date.now();

    if (!session) {
      session = {
        threadId: threadKey,
        spaceId: metadata.spaceId,
        userId: metadata.userId,
        userName: metadata.userName,
        userEmail: metadata.userEmail,
        messages: [],
        lastActivity: now,
      };
    } else {
      // Actualizar metadatos del usuario si estaban ausentes
      if (!session.userName && metadata.userName) session.userName = metadata.userName;
      if (!session.userEmail && metadata.userEmail) session.userEmail = metadata.userEmail;
    }

    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: now,
    });

    session.messages.push({
      role: 'model',
      content: modelReply,
      timestamp: now,
    });

    // Mantener una ventana deslizante de mensajes
    if (session.messages.length > this.maxMessagesPerThread) {
      session.messages = session.messages.slice(-this.maxMessagesPerThread);
    }

    session.lastActivity = now;
    this.sessions.set(threadKey, session);
    return session;
  }

  /**
   * Elimina una sesión específica.
   */
  async deleteSession(threadKey: string): Promise<void> {
    this.sessions.delete(threadKey);
  }

  /**
   * Limpia sesiones inactivas cuyo TTL haya expirado.
   */
  async cleanupOldSessions(): Promise<number> {
    const now = Date.now();
    let purged = 0;
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.ttlMs) {
        this.sessions.delete(key);
        purged++;
      }
    }
    return purged;
  }
}

// Instancia singleton por defecto
export const chatThreadStore = new InMemoryThreadStore();
