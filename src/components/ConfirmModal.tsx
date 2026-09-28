import React from 'react';
import { AlertTriangle, Send, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetSpaceName: string;
  ticketSummary: {
    titulo: string;
    area: string;
    prioridad: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  targetSpaceName,
  ticketSummary,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-neutral-200">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </div>
        </div>

        {/* Detailed action overview */}
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            <span>Destino en Google Chat</span>
            <span className="text-blue-600 font-mono lowercase">{targetSpaceName}</span>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <div className="font-semibold text-neutral-900">{ticketSummary.titulo}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-neutral-200 text-neutral-800">
                Área: {ticketSummary.area}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                Prioridad: {ticketSummary.prioridad}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-500 italic">
          Esta acción enviará una notificación pública o mensaje al canal seleccionado en Google Chat con los detalles del diagnóstico recopilado.
        </p>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Enviando a Google Chat...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Confirmar y enviar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
