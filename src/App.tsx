import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { TicketDrawer } from './components/TicketDrawer';
import { GoogleChatDrawer } from './components/GoogleChatDrawer';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SendEmailTicketModal } from './components/SendEmailTicketModal';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import { fetchGoogleChatSpaces, sendIncidentToGoogleChat, ChatSpace } from './services/googleChat';
import { ChatMessage, SupportTicket, DiagnosticPhase } from './types';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `¡Hola! Soy **TRASA HelpBot**, el asistente virtual de **Soporte Técnico de Infraestructura** de TRASA.\n\nEstoy acá para ayudarte a diagnosticar y resolver problemas relacionados exclusivamente con redes, conectividad, Wi-Fi, VPN, hardware (notebooks, PCs, monitores, docks), Windows, impresoras y servicios de infraestructura.\n\nSi el problema requiere la intervención de un técnico, recopilaré los datos del diagnóstico para derivar el caso a **tickets@trasa.com.ar**.\n\n¿Qué inconveniente estás experimentando?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function App() {
  // Authentication & Google Workspace
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google Chat spaces
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('spaces/DEMO_TRASA_SOPORTE');
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [lastSentInfo, setLastSentInfo] = useState<string | null>(null);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<DiagnosticPhase>('Entender');

  // Active Incident & Ticket Draft
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  // Modals & Drawers
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(false);
  const [isGoogleChatDrawerOpen, setIsGoogleChatDrawerOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isSendingToChat, setIsSendingToChat] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Initialize Auth state on mount
  useEffect(() => {
    initAuth(
      async (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        loadSpaces(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
        loadSpaces(null);
      }
    );
  }, []);

  const loadSpaces = async (authToken: string | null) => {
    setIsLoadingSpaces(true);
    try {
      if (authToken) {
        const fetchedSpaces = await fetchGoogleChatSpaces(authToken);
        setSpaces(fetchedSpaces);
        if (fetchedSpaces.length > 0) {
          setSelectedSpace(fetchedSpaces[0].name);
        }
      } else {
        const fallback = await fetchGoogleChatSpaces('');
        setSpaces(fallback);
        setSelectedSpace(fallback[0].name);
      }
    } catch (err) {
      console.error('Error loading spaces:', err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadSpaces(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    loadSpaces(null);
  };

  // Determine current diagnostic phase dynamically
  const updatePhaseFromResponse = (reply: string) => {
    const lower = reply.toLowerCase();
    if (
      lower.includes('tickets@trasa.com.ar') ||
      lower.includes('no puede resolverse') ||
      lower.includes('¿querés que genere') ||
      lower.includes('¿querés que envíe') ||
      lower.includes('derivación')
    ) {
      setCurrentPhase('Derivar');
    } else if (lower.includes('ticket') || lower.includes('información recopilada:')) {
      setCurrentPhase('Documentar');
    } else if (
      lower.includes('primer paso') ||
      lower.includes('intentá') ||
      lower.includes('comprobemos') ||
      lower.includes('vamos a probar') ||
      lower.includes('reiniciá') ||
      lower.includes('desconectá')
    ) {
      setCurrentPhase('Resolver');
    } else if (lower.includes('¿') || lower.includes('desde cuándo') || lower.includes('qué equipo') || lower.includes('afecta a otros')) {
      setCurrentPhase('Diagnosticar');
    } else {
      setCurrentPhase('Entender');
    }
  };

  // Extract structured ticket via server
  const triggerTicketExtraction = async (currentMsgs: ChatMessage[]) => {
    try {
      const userContext = {
        name: user?.displayName || 'Leonardo Pérez',
        email: user?.email || 'leonardo.perez@trasa.com.ar',
      };

      const res = await fetch('/api/extract-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMsgs.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          const newTicket: SupportTicket = {
            ...data.ticket,
            area: 'Soporte Técnico de Infraestructura',
            destinatarioEmail: 'tickets@trasa.com.ar',
            usuario: userContext.name,
            email: userContext.email,
            estado: 'En diagnóstico',
            createdAt: new Date().toLocaleString(),
          };
          setActiveTicket(newTicket);
        }
      }
    } catch (err) {
      console.warn('Could not auto-extract ticket:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const userContext = {
        name: user?.displayName || 'Leonardo Pérez',
        email: user?.email || 'leonardo.perez@trasa.com.ar',
      };

      const cleanHistory = newMessages.filter(
        (m) => !m.content.includes('Ocurrió un error al contactar')
      );

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanHistory.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const botReply =
        data.reply ||
        'Disculpá, no pude procesar la respuesta. Por favor intentá nuevamente.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedHistory = [...newMessages, botMsg];
      setMessages(updatedHistory);
      updatePhaseFromResponse(botReply);

      // Extract ticket when bot proposes derivation or user requests email dispatch
      if (
        botReply.toLowerCase().includes('tickets@trasa.com.ar') ||
        botReply.toLowerCase().includes('¿querés que') ||
        botReply.toLowerCase().includes('derivación') ||
        text.toLowerCase().includes('mail') ||
        text.toLowerCase().includes('tickets') ||
        text.toLowerCase().includes('recopil')
      ) {
        triggerTicketExtraction(updatedHistory);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `No se pudo conectar momentáneamente con el servicio de IA de Infraestructura. Podés reintentar tu mensaje o derivar el caso directamente con el botón de abajo a tickets@trasa.com.ar.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputMessage('');
    setActiveTicket(null);
    setCurrentPhase('Entender');
  };

  const handleOpenTicketDrawer = () => {
    if (!activeTicket && messages.some((m) => m.role === 'user')) {
      triggerTicketExtraction(messages);
    }
    setIsTicketDrawerOpen(true);
  };

  const handleOpenSendEmailModal = () => {
    if (!activeTicket && messages.some((m) => m.role === 'user')) {
      triggerTicketExtraction(messages);
    }
    setIsSendEmailModalOpen(true);
  };

  // Google Chat confirmation & dispatch
  const handleOpenGoogleChatConfirmation = () => {
    if (!activeTicket) {
      if (messages.some((m) => m.role === 'user')) {
        triggerTicketExtraction(messages);
      }
      setIsTicketDrawerOpen(true);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSendToGoogleChat = async () => {
    if (!activeTicket) return;

    setIsSendingToChat(true);
    try {
      const currentToken = token || (await getAccessToken()) || 'DEMO_TOKEN';
      const targetSpace = spaces.find((s) => s.name === selectedSpace);
      const spaceDisplayName = targetSpace ? targetSpace.displayName : selectedSpace;

      const result = await sendIncidentToGoogleChat(currentToken, {
        spaceName: selectedSpace,
        ticket: activeTicket,
      });

      if (result.success) {
        const successNotice = `Alerta enviada con éxito a Google Chat: ${spaceDisplayName}`;
        setLastSentInfo(successNotice);

        setActiveTicket({
          ...activeTicket,
          estado: 'Notificado en Google Chat',
          googleChatSpaceNotified: spaceDisplayName,
        });

        const confMsg: ChatMessage = {
          id: `bot-conf-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Notificación enviada a Google Chat:**\nSe notificó la incidencia de infraestructura al canal **${spaceDisplayName}** con el resumen del diagnóstico para que un técnico tome el caso.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, confMsg]);
        setIsConfirmModalOpen(false);
      }
    } catch (error: any) {
      console.error('Error sending to chat:', error);
      alert(`No se pudo enviar el mensaje a Google Chat: ${error.message}`);
    } finally {
      setIsSendingToChat(false);
    }
  };

  // Dispatch full chat to tickets@trasa.com.ar (Infraestructura)
  const handleConfirmSendEmailTicket = async (notes: string) => {
    setIsSendingEmail(true);
    try {
      const userName = user?.displayName || 'Leonardo Pérez';
      const userEmail = user?.email || 'leonardo.perez@trasa.com.ar';

      const transcript = messages
        .map(
          (m) =>
            `[${m.timestamp}] ${m.role === 'assistant' ? 'TRASA HelpBot' : userName}: ${m.content}`
        )
        .join('\n\n');

      const res = await fetch('/api/send-email-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          ticket: activeTicket,
          userEmail,
          userName,
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();

      if (activeTicket) {
        setActiveTicket({
          ...activeTicket,
          estado: 'Derivado a Infraestructura',
        });
      }

      const emailConfirmedMsg: ChatMessage = {
        id: `email-conf-${Date.now()}`,
        role: 'assistant',
        content: `📬 **Chat completo derivado a tickets@trasa.com.ar**\n\nEl reporte técnico del incidente y todo el historial del diagnóstico fueron remitidos exitosamente al equipo de **Infraestructura** (**tickets@trasa.com.ar**).\n\nUn técnico de guardia revisará la información recopilada para dar curso a la solución.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, emailConfirmedMsg]);

      setIsSendEmailModalOpen(false);
    } catch (err: any) {
      console.error('Error sending email ticket:', err);
      alert(`No se pudo enviar a tickets@trasa.com.ar: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const selectedSpaceObj = spaces.find((s) => s.name === selectedSpace);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* App Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenGoogleChat={() => setIsGoogleChatDrawerOpen(true)}
        onOpenTicketDrawer={handleOpenTicketDrawer}
        onOpenSendEmailModal={handleOpenSendEmailModal}
        onResetChat={handleResetChat}
        ticketCount={activeTicket ? 1 : 0}
        googleChatConnected={!!user}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col">
        <ChatView
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentPhase={currentPhase}
          onOpenTicketDrawer={handleOpenTicketDrawer}
          onOpenSendEmailModal={handleOpenSendEmailModal}
          onOpenGoogleChat={() => setIsGoogleChatDrawerOpen(true)}
          activeTicket={activeTicket}
          user={user}
          onSelectPrompt={(text) => handleSendMessage(text)}
        />
      </main>

      {/* Slide-out Ticket Drawer */}
      <TicketDrawer
        isOpen={isTicketDrawerOpen}
        onClose={() => setIsTicketDrawerOpen(false)}
        ticket={activeTicket}
        onUpdateTicket={(updated) => setActiveTicket(updated)}
        onRequestSendEmail={() => {
          setIsTicketDrawerOpen(false);
          handleOpenSendEmailModal();
        }}
        onRequestSendToChat={handleOpenGoogleChatConfirmation}
        isChatConnected={!!user}
      />

      {/* Slide-out Google Chat Drawer */}
      <GoogleChatDrawer
        isOpen={isGoogleChatDrawerOpen}
        onClose={() => setIsGoogleChatDrawerOpen(false)}
        spaces={spaces}
        isLoadingSpaces={isLoadingSpaces}
        onRefreshSpaces={() => loadSpaces(token)}
        selectedSpace={selectedSpace}
        onSelectSpace={(s) => setSelectedSpace(s)}
        user={user}
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        activeTicket={activeTicket}
        onTriggerSendToChat={handleOpenGoogleChatConfirmation}
        lastSentInfo={lastSentInfo}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
        onSelectPrompt={(text) => handleSendMessage(text)}
      />

      {/* Send Complete Chat to tickets@trasa.com.ar Modal */}
      <SendEmailTicketModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        ticket={activeTicket}
        messages={messages}
        user={user}
        onConfirmSend={handleConfirmSendEmailTicket}
        isLoading={isSendingEmail}
      />

      {/* Confirmation Modal for Google Chat */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirmar envío de alerta a Google Chat"
        description="Estás a punto de enviar una tarjeta con el diagnóstico de infraestructura a un canal de Google Chat."
        targetSpaceName={selectedSpaceObj?.displayName || selectedSpace}
        ticketSummary={{
          titulo: activeTicket?.titulo || 'Incidente de infraestructura',
          area: 'Soporte Técnico de Infraestructura',
          prioridad: activeTicket?.prioridad || 'Media',
        }}
        onConfirm={handleConfirmSendToGoogleChat}
        onCancel={() => setIsConfirmModalOpen(false)}
        isLoading={isSendingToChat}
      />
    </div>
  );
}
