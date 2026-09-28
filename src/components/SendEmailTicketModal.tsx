import React, { useState } from 'react';
import { Mail, Send, X, Copy, Check, ExternalLink, FileText, Laptop, Users, CheckCircle2 } from 'lucide-react';
import { SupportTicket, ChatMessage } from '../types';

interface SendEmailTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket | null;
  messages: ChatMessage[];
  user: any | null;
  onConfirmSend: (notes: string) => Promise<void>;
  isLoading: boolean;
}

export const SendEmailTicketModal: React.FC<SendEmailTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  messages,
  user,
  onConfirmSend,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [userNotes, setUserNotes] = useState('');

  if (!isOpen) return null;

  const recipient = 'tickets@trasa.com.ar';
  const userName = user?.displayName || 'Leonardo Pérez';
  const userEmail = user?.email || 'leonardo.perez@trasa.com.ar';
  const subject = `[INFRAESTRUCTURA TRASA] ${ticket?.titulo || 'Incidente de Infraestructura'} - ${userName}`;

  const transcript = messages
    .filter((m) => !m.content.includes('Ocurrió un error al contactar') && m.id !== 'welcome-1')
    .map((m) => `[${m.timestamp}] ${m.role === 'assistant' ? 'TRASA HelpBot' : userName}: ${m.content}`)
    .join('\n\n');

  const fullEmailContent = `Para: ${recipient}
De: ${userName} <${userEmail}>
Asunto: ${subject}

=======================================================
REPORTE DE INCIDENTE — SOPORTE TÉCNICO DE INFRAESTRUCTURA
=======================================================
Usuario: ${userName} (${userEmail})
Fecha: ${new Date().toLocaleString()}
Área: Soporte Técnico de Infraestructura
Categoría: ${ticket?.categoria || 'General'}
Subcategoría: ${ticket?.subcategoria || 'No especificada'}
Equipo afectado: ${ticket?.equipo || 'Equipo del puesto de trabajo'}
Ubicación: ${ticket?.ubicacion || 'Oficina / Remoto'}
Impacto: ${ticket?.impacto || 'Un solo usuario'}
Prioridad sugerida: ${ticket?.prioridad || 'Media'}

TÍTULO DEL PROBLEMA:
${ticket?.titulo || 'Incidente de infraestructura'}

DESCRIPCIÓN:
${ticket?.descripcion || 'No especificada'}

SÍNTOMAS REPORTADOS:
${ticket?.sintomas?.map((s) => `• ${s}`).join('\n') || 'Detallados en la conversación'}

PRUEBAS DE DIAGNÓSTICO REALIZADAS (TRASA HelpBot):
${ticket?.pruebasRealizadas?.map((p) => `• ${p}`).join('\n') || 'Pruebas guiadas paso a paso con el asistente'}

RESULTADO OBTENIDO:
${ticket?.resultado || 'El problema requiere intervención del equipo de Infraestructura'}

ACCIÓN REQUERIDA PARA EL TÉCNICO DE INFRAESTRUCTURA:
${ticket?.accionRecomendada || 'Intervención técnica y contacto con el usuario'}

${userNotes ? `NOTAS ADICIONALES DEL SOLICITANTE:\n${userNotes}\n` : ''}
=======================================================
HISTORIAL COMPLETO DE LA CONVERSACIÓN:
=======================================================
${transcript}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullEmailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(fullEmailContent)}`;

  const gmailWebLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipient
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullEmailContent)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Enviar chat completo a tickets@trasa.com.ar
              </h3>
              <p className="text-xs text-neutral-500">
                Derivación directa a la guardia de Soporte Técnico de Infraestructura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Recipient badge */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-500 font-medium block">Destinatario oficial:</span>
                <span className="font-mono font-bold text-blue-900 text-sm">{recipient}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-200/80 text-blue-900">
              Infraestructura
            </span>
          </div>

          {/* Ticket preview card */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Incidente a derivar
              </span>
              <span className="font-semibold text-neutral-700">
                Prioridad: {ticket?.prioridad || 'Media'}
              </span>
            </div>
            <div className="font-bold text-neutral-900 text-sm">
              {ticket?.titulo || 'Incidente de Infraestructura'}
            </div>
            <p className="text-neutral-600">
              {ticket?.descripcion || 'No detallada'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
              <span>Categoría: <strong>{ticket?.categoria || 'General'}</strong></span>
              <span>Equipo: <strong>{ticket?.equipo || 'Equipo del puesto'}</strong></span>
              <span>Impacto: <strong>{ticket?.impacto || 'Un usuario'}</strong></span>
            </div>
          </div>

          {/* User additional notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700 block">
              ¿Algún dato adicional para el técnico? (Ubicación, interno, número de serie)
            </label>
            <input
              type="text"
              placeholder="Ej: Estoy en la oficina de San Martín, piso 3, interno 204..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs text-neutral-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Transcript preview banner */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-neutral-500" />
                Historial completo adjunto ({messages.length} mensajes)
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? '¡Copiado!' : 'Copiar todo'}</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Se remitirá todo el registro del diagnóstico para que el técnico de Infraestructura continúe la resolución de inmediato.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-neutral-200 p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              href={gmailWebLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
              title="Abrir redacción en Gmail Web"
            >
              <ExternalLink className="h-3.5 w-3.5 text-red-600" />
              <span>Abrir en Gmail Web</span>
            </a>

            <a
              href={mailtoLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              title="Abrir en cliente de correo del sistema (Outlook/Thunderbird)"
            >
              <Mail className="h-3.5 w-3.5 text-neutral-500" />
              <span>Outlook / Mailto</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => onConfirmSend(userNotes)}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enviando reporte...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar a tickets@trasa.com.ar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
