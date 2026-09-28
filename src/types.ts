export type SupportArea = 'Soporte Técnico de Infraestructura';

export type InfrastructureCategory =
  | 'Hardware'
  | 'Windows'
  | 'Red'
  | 'Wi-Fi'
  | 'Internet'
  | 'VPN'
  | 'Impresoras'
  | 'Active Directory'
  | 'Servidores'
  | 'Recursos compartidos'
  | 'DNS'
  | 'DHCP'
  | 'Conectividad';

export type IncidentPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type DiagnosticPhase = 'Entender' | 'Diagnosticar' | 'Resolver' | 'Documentar' | 'Derivar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isSafetyWarning?: boolean;
  hasDerivationBlock?: boolean;
  ticketData?: SupportTicket;
}

export interface SupportTicket {
  id?: string;
  titulo: string;
  area: SupportArea | string;
  categoria: InfrastructureCategory | string;
  subcategoria?: string;
  equipo?: string;
  ubicacion?: string;
  impacto?: 'Un solo usuario' | 'Varios usuarios' | 'Sector' | 'Toda la empresa' | string;
  prioridad: IncidentPriority;
  descripcion: string;
  sintomas: string[];
  pruebasRealizadas: string[];
  resultado: string;
  accionRecomendada: string;
  requiereTecnico: boolean;
  destinatarioEmail?: string;
  usuario?: string;
  email?: string;
  estado?: 'Borrador' | 'En diagnóstico' | 'Derivado a Infraestructura' | 'Notificado en Google Chat' | 'Resuelto';
  googleChatSpaceNotified?: string;
  createdAt?: string;
}
