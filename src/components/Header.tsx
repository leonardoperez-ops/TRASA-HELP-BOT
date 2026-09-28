import React from 'react';
import {
  LifeBuoy,
  MessageSquare,
  BookOpen,
  FileText,
  Mail,
  LogOut,
  RotateCcw,
  Network,
} from 'lucide-react';
import { OfficialGoogleButton } from './OfficialGoogleButton';

interface HeaderProps {
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onOpenKnowledgeBase: () => void;
  onOpenGoogleChat: () => void;
  onOpenTicketDrawer: () => void;
  onOpenSendEmailModal: () => void;
  onResetChat: () => void;
  ticketCount: number;
  googleChatConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  onOpenKnowledgeBase,
  onOpenGoogleChat,
  onOpenTicketDrawer,
  onOpenSendEmailModal,
  onResetChat,
  ticketCount,
  googleChatConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-neutral-900 text-base sm:text-lg">
                TRASA <span className="text-blue-600">HelpBot</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                <Network className="h-3 w-3 text-blue-600" />
                Soporte de Infraestructura
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Redes, Equipos, Conectividad y Servicios de Infraestructura • tickets@trasa.com.ar
            </p>
          </div>
        </div>

        {/* Action icons & user profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenKnowledgeBase}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer"
            title="Guías de Infraestructura"
          >
            <BookOpen className="h-3.5 w-3.5 text-neutral-500" />
            <span>Guías Técnicas</span>
          </button>

          <button
            onClick={onOpenSendEmailModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            title="Derivar a tickets@trasa.com.ar"
          >
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden md:inline">tickets@trasa.com.ar</span>
            <span className="md:hidden">Derivar</span>
          </button>

          <button
            onClick={onOpenTicketDrawer}
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer"
            title="Ficha Técnica de Infraestructura"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Ficha</span>
            {ticketCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {ticketCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenGoogleChat}
            className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              googleChatConnected
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
            title="Canales de Google Chat"
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
            <span>Google Chat</span>
          </button>

          <button
            onClick={onResetChat}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
            title="Reiniciar consulta"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* User auth status */}
          <div className="ml-1 pl-2 border-l border-neutral-200">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="h-8 w-8 rounded-full ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="font-semibold text-neutral-800 truncate max-w-[130px]">
                    {user.displayName || 'Leonardo Pérez'}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate max-w-[130px]">
                    {user.email || 'leonardo.perez@trasa.com.ar'}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-lg p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <OfficialGoogleButton
                onClick={onLogin}
                isLoading={isLoggingIn}
                text="Google Workspace"
                className="py-1 px-2.5 text-xs"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
