import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Send,
  Mail,
  Clock,
  UserCheck,
  Tag,
  X,
  ExternalLink,
  Laptop,
  MapPin,
  Users,
} from 'lucide-react';
import { SupportTicket, IncidentPriority } from '../types';

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket | null;
  onUpdateTicket: (updated: SupportTicket) => void;
  onRequestSendEmail: () => void;
  onRequestSendToChat: () => void;
  isChatConnected: boolean;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
  isOpen,
  onClose,
  ticket,
  onUpdateTicket,
  onRequestSendEmail,
  onRequestSendToChat,
  isChatConnected,
}) => {
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);

  if (!isOpen) return null;

  const copyGLPIFormat = () => {
    if (!ticket) return;

    const glpiText = `================================================
SOLICITUD DE INFRAESTRUCTURA TRASA
Destinatario: tickets@trasa.com.ar
================================================
Usuario: ${ticket.usuario || 'Colaborador TRASA'} (${ticket.email || 'usuario@trasa.com.ar'})
Fecha: ${ticket.createdAt || new Date().toLocaleString()}
Área: Soporte Técnico de Infraestructura
Categoría: ${ticket.categoria}
Subcategoría: ${ticket.subcategoria || 'General'}
Equipo: ${ticket.equipo || 'No especificado'}
Ubicación: ${ticket.ubicacion || 'Oficina / Remoto'}
Impacto: ${ticket.impacto || 'Un solo usuario'}
Prioridad: ${ticket.prioridad}

TÍTULO:
${ticket.titulo}

DESCRIPCIÓN DEL INCIDENTE:
${ticket.descripcion}
${ticket.sintomas && ticket.sintomas.length > 0 ? `Síntomas:\n${ticket.sintomas.map((s) => `• ${s}`).join('\n')}` : ''}

PRUEBAS DE DIAGNÓSTICO (TRASA HelpBot):
${
  ticket.pruebasRealizadas && ticket.pruebasRealizadas.length > 0
    ? ticket.pruebasRealizadas.map((p) => `• ${p}`).join('\n')
    : 'Revisión paso a paso realizada con asistente de Infraestructura'
}
Resultado obtenido: ${ticket.resultado || 'Incidente no resoluble automáticamente'}

ACCIÓN REQUERIDA PARA EL TÉCNICO DE INFRAESTRUCTURA:
${ticket.accionRecomendada}
================================================`;

    navigator.clipboard.writeText(glpiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPriorityBadgeClass = (priority: IncidentPriority) => {
    switch (priority) {
      case 'Crítica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Alta':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Media':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Baja':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl ring-1 ring-neutral-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Ficha de Infraestructura</h2>
            <p className="text-xs text-neutral-500">Mesa de Ayuda • tickets@trasa.com.ar</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Recipient Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-950">
              Derivación: <strong className="font-mono">tickets@trasa.com.ar</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
            Infraestructura
          </span>
        </div>

        {!ticket ? (
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-700">No hay incidente de infraestructura activo</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Conversá con TRASA HelpBot sobre el inconveniente con tu equipo, red o conectividad para recopilar el diagnóstico técnico.
            </p>
          </div>
        ) : (
          <>
            {/* Status and Area */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeClass(
                  ticket.prioridad
                )}`}
              >
                <Clock className="h-3 w-3" />
                Prioridad {ticket.prioridad}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                <Tag className="h-3 w-3 text-neutral-500" />
                {ticket.categoria}
              </span>
            </div>

            {/* Title & Metadata */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Incidente Reportado
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={ticket.titulo}
                  onChange={(e) => onUpdateTicket({ ...ticket, titulo: e.target.value })}
                  className="w-full text-sm font-semibold rounded-md border border-neutral-300 p-2 bg-white"
                />
              ) : (
                <h3 className="text-sm font-bold text-neutral-900 leading-snug">{ticket.titulo}</h3>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{ticket.equipo || 'Equipo del usuario'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Impacto: {ticket.impacto || 'Un usuario'}</span>
                </div>
              </div>
            </div>

            {/* User details */}
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-3 text-xs text-neutral-800">
              <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold">{ticket.usuario || 'Colaborador TRASA'}</span>
                {ticket.email && <span className="text-neutral-500 ml-1">({ticket.email})</span>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Descripción del problema</label>
              {editMode ? (
                <textarea
                  rows={3}
                  value={ticket.descripcion}
                  onChange={(e) => onUpdateTicket({ ...ticket, descripcion: e.target.value })}
                  className="w-full text-xs rounded-md border border-neutral-300 p-2 bg-white"
                />
              ) : (
                <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200 leading-relaxed whitespace-pre-line">
                  {ticket.descripcion}
                </p>
              )}
            </div>

            {/* Pruebas realizadas */}
            {ticket.pruebasRealizadas && ticket.pruebasRealizadas.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Pruebas realizadas</label>
                <ul className="text-xs text-neutral-600 space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-200 list-disc list-inside">
                  {ticket.pruebasRealizadas.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acción recomendada */}
            <div className="space-y-2">
              <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-100 space-y-1 text-xs">
                <span className="font-bold text-blue-900 block">Acción requerida para Infraestructura:</span>
                <span className="text-blue-800">{ticket.accionRecomendada}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {ticket && (
        <div className="border-t border-neutral-200 p-4 bg-white space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyGLPIFormat}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-neutral-500" />
              )}
              <span>{copied ? '¡Copiado!' : 'Copiar ficha'}</span>
            </button>

            <button
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              <span>{editMode ? 'Guardar' : 'Editar'}</span>
            </button>
          </div>

          <button
            onClick={onRequestSendEmail}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Enviar chat completo a tickets@trasa.com.ar</span>
          </button>
        </div>
      )}
    </div>
  );
};
