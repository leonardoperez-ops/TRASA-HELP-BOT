import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ChatSpace } from '../services/googleChat';
import { SupportTicket } from '../types';
import { OfficialGoogleButton } from './OfficialGoogleButton';

interface GoogleChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spaces: ChatSpace[];
  isLoadingSpaces: boolean;
  onRefreshSpaces: () => void;
  selectedSpace: string;
  onSelectSpace: (spaceName: string) => void;
  user: any | null;
  onLogin: () => void;
  isLoggingIn: boolean;
  activeTicket: SupportTicket | null;
  onTriggerSendToChat: () => void;
  lastSentInfo: string | null;
}

export const GoogleChatDrawer: React.FC<GoogleChatDrawerProps> = ({
  isOpen,
  onClose,
  spaces,
  isLoadingSpaces,
  onRefreshSpaces,
  selectedSpace,
  onSelectSpace,
  user,
  onLogin,
  isLoggingIn,
  activeTicket,
  onTriggerSendToChat,
  lastSentInfo,
}) => {
  const [customQuickNote, setCustomQuickNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl ring-1 ring-neutral-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Google Chat</h2>
            <p className="text-xs text-neutral-500">Integración con canales de soporte</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Account Authentication Banner */}
        {!user ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Conexión con Google Workspace</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Iniciá sesión con tu cuenta corporativa para listar tus espacios de Google Chat y derivar incidentes directamente al equipo técnico.
            </p>
            <OfficialGoogleButton
              onClick={onLogin}
              isLoading={isLoggingIn}
              text="Conectar con Google"
              className="w-full text-xs py-2"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-900 block">Google Chat conectado</span>
                <span className="text-emerald-700 truncate max-w-[220px] block">{user.email}</span>
              </div>
            </div>
            <button
              onClick={onRefreshSpaces}
              disabled={isLoadingSpaces}
              className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-800 transition"
              title="Refrescar lista de espacios"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Space Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Espacio o Canal Destino
            </label>
            <span className="text-[11px] text-neutral-500 font-medium">
              {spaces.length} disponibles
            </span>
          </div>

          <div className="space-y-2">
            {spaces.map((sp) => {
              const isSelected = selectedSpace === sp.name;
              return (
                <div
                  key={sp.name}
                  onClick={() => onSelectSpace(sp.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 truncate block">
                        {sp.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono lowercase truncate block">
                        {sp.name}
                      </span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Ticket Quick Preview */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2.5">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
            Ticket a Notificar
          </label>
          {activeTicket ? (
            <div className="space-y-1.5 text-xs text-neutral-700">
              <div className="font-bold text-neutral-900">{activeTicket.titulo}</div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-neutral-200 font-medium text-neutral-800">
                  {activeTicket.area}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 font-medium text-amber-800">
                  {activeTicket.prioridad}
                </span>
              </div>
              <p className="text-neutral-600 line-clamp-2 pt-1">{activeTicket.descripcion}</p>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 italic py-2">
              No hay incidente activo preparado. Podés describir tu problema en el chat primero.
            </div>
          )}
        </div>

        {lastSentInfo && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{lastSentInfo}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 p-4 bg-white">
        <button
          onClick={onTriggerSendToChat}
          disabled={!activeTicket}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Enviar alerta a Google Chat</span>
        </button>
      </div>
    </div>
  );
};
