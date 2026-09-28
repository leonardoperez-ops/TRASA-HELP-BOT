import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  LifeBuoy,
  User,
  ShieldCheck,
  FileText,
  Mail,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ChatMessage, DiagnosticPhase, SupportTicket } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSendMessage: (text?: string) => void;
  isLoading: boolean;
  currentPhase: DiagnosticPhase;
  onOpenTicketDrawer: () => void;
  onOpenSendEmailModal: () => void;
  onOpenGoogleChat: () => void;
  activeTicket: SupportTicket | null;
  user: any | null;
  onSelectPrompt: (promptText: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  inputMessage,
  setInputMessage,
  onSendMessage,
  isLoading,
  currentPhase,
  onOpenTicketDrawer,
  onOpenSendEmailModal,
  onOpenGoogleChat,
  activeTicket,
  user,
  onSelectPrompt,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const phases: DiagnosticPhase[] = ['Entender', 'Diagnosticar', 'Resolver', 'Documentar', 'Derivar'];

  // Exclusive Infrastructure Support Prompts
  const quickPrompts = [
    { label: '📧 Enviar a tickets@trasa.com.ar', prompt: 'Necesito que recopiles el chat y lo envíes por mail a tickets@trasa.com.ar' },
    { label: 'No tengo Internet', prompt: 'Hola, me quedé sin conexión a Internet en mi equipo de trabajo.' },
    { label: 'VPN no conecta', prompt: 'Tengo problemas para conectarme a la VPN de TRASA desde mi casa.' },
    { label: 'Wi-Fi TRASA_CORP', prompt: 'Mi notebook no se conecta a la red Wi-Fi TRASA_CORP en la oficina.' },
    { label: 'Pantalla azul / BSOD', prompt: 'Windows sufrió una pantalla azul (BSOD) y el equipo se reinició.' },
    { label: 'Dock / Monitores', prompt: 'Conecté la notebook al docking station pero no detecta los monitores externos.' },
    { label: 'Impresora offline', prompt: 'La impresora de red de mi sector figura fuera de línea y no imprime.' },
    { label: 'Carpeta compartida', prompt: 'No puedo acceder a la unidad de red ni a las carpetas compartidas del servidor.' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage();
  };

  const getPhaseIndex = (phase: DiagnosticPhase) => phases.indexOf(phase);

  const userName = user?.displayName || 'Leonardo Pérez';
  const userEmail = user?.email || 'leonardo.perez@trasa.com.ar';
  const ticketTitle = activeTicket?.titulo || 'Incidente de Infraestructura';
  const subject = `[INFRAESTRUCTURA TRASA] ${ticketTitle} - ${userName}`;

  const transcript = messages
    .filter((m) => !m.content.includes('Ocurrió un error al contactar') && m.id !== 'welcome-1')
    .map((m) => `[${m.timestamp}] ${m.role === 'assistant' ? 'TRASA HelpBot' : userName}: ${m.content}`)
    .join('\n\n');

  const fullEmailContent = `Para: tickets@trasa.com.ar
De: ${userName} <${userEmail}>
Asunto: ${subject}

=======================================================
REPORTE DE INCIDENTE — SOPORTE TÉCNICO DE INFRAESTRUCTURA
=======================================================
Usuario: ${userName} (${userEmail})
Fecha: ${new Date().toLocaleString()}
Área: Soporte Técnico de Infraestructura
Categoría: ${activeTicket?.categoria || 'General'}
Equipo: ${activeTicket?.equipo || 'Equipo del puesto'}
Ubicación: ${activeTicket?.ubicacion || 'Oficina / Remoto'}
Prioridad sugerida: ${activeTicket?.prioridad || 'Media'}

TÍTULO:
${ticketTitle}

PRUEBAS DE DIAGNÓSTICO (TRASA HelpBot):
${activeTicket?.pruebasRealizadas?.map((p) => `• ${p}`).join('\n') || 'Diagnóstico paso a paso efectuado'}

ACCIÓN REQUERIDA PARA INFRAESTRUCTURA:
${activeTicket?.accionRecomendada || 'Intervención técnica directa con el usuario'}

=======================================================
HISTORIAL COMPLETO DEL CHAT:
=======================================================
${transcript}`;

  const gmailWebComposeLink = `https://mail.google.com/mail/?view=cm&fs=1&to=tickets@trasa.com.ar&su=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(fullEmailContent)}`;

  const handleCopyTranscript = (msgId: string) => {
    navigator.clipboard.writeText(fullEmailContent);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Diagnostic Phase Progress Bar */}
      <div className="mb-3 rounded-2xl border border-neutral-200/90 bg-white/90 p-3 shadow-xs backdrop-blur-xs">
        <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-semibold text-neutral-500">
          {phases.map((ph, idx) => {
            const currentIdx = getPhaseIndex(currentPhase);
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div
                key={ph}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-neutral-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                ) : (
                  <span
                    className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isCurrent ? 'bg-white text-blue-600' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                <span>{ph}</span>
                {idx < phases.length - 1 && (
                  <span className="text-neutral-300 ml-1 hidden sm:inline">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Escalation notice banner */}
      <div className="mb-2 flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/80 px-3.5 py-2 text-[11px] text-blue-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            <strong>Soporte de Infraestructura:</strong> Si el problema no se resuelve, enviamos el reporte completo a <strong>tickets@trasa.com.ar</strong>.
          </span>
        </div>
        <button
          onClick={onOpenSendEmailModal}
          className="text-blue-700 hover:text-blue-900 font-bold underline inline-flex items-center gap-1 ml-2 shrink-0 cursor-pointer"
        >
          <Mail className="h-3 w-3" />
          <span>Enviar a tickets@trasa.com.ar</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const indicatesUnresolvedOrTicket =
            isAssistant &&
            (msg.content.includes('tickets@trasa.com.ar') ||
              msg.content.includes('He recopilado el historial') ||
              msg.content.includes('Reporte para Infraestructura') ||
              msg.content.includes('no puede resolverse') ||
              msg.content.includes('¿Querés que genere') ||
              msg.content.includes('¿Querés que envíe'));

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isAssistant ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAssistant && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xs">
                  <LifeBuoy className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                  isAssistant
                    ? 'bg-white border border-neutral-200/90 text-neutral-800 ring-1 ring-black/5'
                    : 'bg-blue-600 text-white font-medium ml-auto'
                }`}
              >
                {/* Content formatting */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.content}
                </div>

                {/* If the assistant mentions escalation or tickets to tickets@trasa.com.ar */}
                {indicatesUnresolvedOrTicket && (
                  <div className="mt-3.5 pt-3 border-t border-neutral-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-semibold">
                      <span className="flex items-center gap-1 text-blue-700">
                        <Mail className="h-3.5 w-3.5" />
                        Derivación lista a tickets@trasa.com.ar
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTranscript(msg.id)}
                        className="text-neutral-500 hover:text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                        title="Copiar texto completo del reporte"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={onOpenSendEmailModal}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Enviar a tickets@trasa.com.ar</span>
                      </button>

                      <a
                        href={gmailWebComposeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition shadow-xs cursor-pointer"
                        title="Abrir en Gmail Web con el correo y asunto ya escritos"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-red-600" />
                        <span>Abrir en Gmail Web</span>
                      </a>

                      <button
                        onClick={onOpenTicketDrawer}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-neutral-500" />
                        <span>Ver Ficha Técnica</span>
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className={`mt-1.5 text-[10px] ${
                    isAssistant ? 'text-neutral-400' : 'text-blue-100'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isAssistant && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-neutral-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white">
              <LifeBuoy className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl bg-white border border-neutral-200 p-4 text-xs text-neutral-500 flex items-center gap-2 shadow-xs">
              <div className="flex space-x-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium text-neutral-600">TRASA HelpBot recopilando información...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Infrastructure Quick suggestions pills */}
      <div className="py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-blue-500" />
          Infraestructura:
        </span>
        {quickPrompts.map((qp) => (
          <button
            key={qp.label}
            onClick={() => onSelectPrompt(qp.prompt)}
            disabled={isLoading}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer disabled:opacity-50 ${
              qp.label.includes('Enviar a tickets')
                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 font-bold'
                : 'bg-neutral-100/90 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 border-neutral-200/60'
            }`}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="mt-1 relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribí tu consulta o pedí 'enviar el chat por mail a tickets@trasa.com.ar'..."
          disabled={isLoading}
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3.5 pr-14 text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-neutral-50 transition"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer"
          title="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
