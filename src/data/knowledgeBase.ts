export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Red' | 'Wi-Fi' | 'Internet' | 'VPN' | 'Hardware' | 'Windows' | 'Impresoras' | 'Active Directory' | 'Recursos compartidos';
  summary: string;
  steps: string[];
  warning?: string;
  escalationTarget: string;
  suggestedPrompt: string;
}

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'sin-internet-red',
    title: 'Pérdida de conectividad / Sin acceso a Internet',
    category: 'Internet',
    summary: 'Diagnóstico paso a paso para identificar si el fallo es local del puesto o una caída del enlace/red.',
    steps: [
      'Identificá si estás conectado por cable de red (Ethernet) o por Wi-Fi.',
      'Verificá con un compañero cercano si también perdió Internet para determinar si es un problema puntual de tu equipo o general del sector.',
      'Si es cable de red, verificá que la ficha RJ45 tenga las luces verde/ámbar encendidas junto al conector.',
      'En Windows, abrí el Símbolo del Sistema (cmd) y probá ejecutar "ping 8.8.8.8" para comprobar salida al gateway.',
    ],
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'No tengo conexión a Internet en mi equipo de trabajo.',
  },
  {
    id: 'vpn-infraestructura',
    title: 'VPN TRASA — Falla de Conexión o Enrutamiento',
    category: 'VPN',
    summary: 'Procedimiento de infraestructura para diagnosticar problemas al establecer el túnel seguro remoto.',
    steps: [
      'Verificá que tu equipo tenga navegación activa a Internet antes de iniciar el cliente de VPN.',
      'Cerrá completamente el cliente de VPN desde la barra de tareas (junto al reloj) y volvelo a ejecutar.',
      'Ingresá tu usuario corporativo sin espacios adicionales y revisá que el bloqueo de mayúsculas esté desactivado.',
      'Si la VPN conecta pero no podés acceder a recursos internos, verificá la resolución DNS del túnel.',
    ],
    warning: 'Por seguridad, nunca compartas contraseñas, tokens ni códigos MFA.',
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'La VPN me arroja error al intentar conectarme desde mi casa.',
  },
  {
    id: 'wifi-trasa-corp',
    title: 'Wi-Fi TRASA_CORP — Conexión y Autenticación WPA2-Enterprise',
    category: 'Wi-Fi',
    summary: 'Resolución de problemas de asociación con los Access Points corporativos en las oficinas.',
    steps: [
      'Verificá que el adaptador Wi-Fi de la notebook esté habilitado y fuera de modo avión.',
      'Seleccioná la red "TRASA_CORP", hacé clic derecho y elegí "Dejar de recordar" u "Olvidar red".',
      'Volvé a conectarte ingresando tus credenciales de red de Windows.',
      'Si el problema persiste, conectá el cable Ethernet del puesto para validar si la boca de red tiene DHCP activo.',
    ],
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'Mi notebook no se asocia a la red Wi-Fi TRASA_CORP en la oficina.',
  },
  {
    id: 'hardware-dock-monitores',
    title: 'Monitores externos, Docking Station y Periféricos',
    category: 'Hardware',
    summary: 'Fallas físicas de detección de pantalla, docks USB-C / Thunderbolt y periféricos.',
    steps: [
      'Desconectá y reconectá con firmeza el cable USB-C o Thunderbolt del docking station a la notebook.',
      'Verificá que el cargador y la fuente de alimentación del dock estén encendidos con su luz testigo.',
      'En Windows, presioná Windows + P y asegurate de tener seleccionada la opción "Extender" o "Duplicar".',
      'Si falla el teclado o mouse, probá conectarlos en otro puerto USB directo del equipo.',
    ],
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'Mi docking station no transmite imagen a los monitores externos.',
  },
  {
    id: 'windows-bsod-inicio',
    title: 'Windows — Pantalla azul (BSOD) o error de arranque',
    category: 'Windows',
    summary: 'Acciones de contingencia ante fallos críticos del sistema operativo o reinicios abruptos.',
    steps: [
      'Si aparece una pantalla azul (BSOD), anotá o fotografíá el código de detención (ejemplo: IRQL_NOT_LESS_OR_EQUAL).',
      'Desconectá periféricos recién agregados (docks, memorias externas) y encendé nuevamente el equipo.',
      'Si Windows inicia en bucle de reparación automática, apagá el equipo y comunicate con Infraestructura.',
    ],
    warning: 'NUNCA intentes formatear el disco ni modificar particiones del sistema.',
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'Mi computadora sufrió una pantalla azul (BSOD) y se reinicia sola.',
  },
  {
    id: 'active-directory-dominio',
    title: 'Active Directory — Error de relación de confianza con el dominio',
    category: 'Active Directory',
    summary: 'Diagnóstico cuando Windows no puede autenticar la cuenta contra el controlador de dominio.',
    steps: [
      'Si el error indica "No hay servidores de inicio de sesión disponibles", verificá la conexión física de red (cable o Wi-Fi).',
      'Si estás trabajando remoto, asegurate de tener la VPN iniciada antes del inicio de sesión si tu equipo lo requiere.',
      'Si el mensaje indica "Fallo en la relación de confianza entre la estación de trabajo y el dominio principal", el equipo debe ser reincorporado al dominio por un técnico de Infraestructura.',
    ],
    warning: 'El bot nunca te solicitará tu contraseña de dominio.',
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'Windows indica que no hay relación de confianza con el dominio.',
  },
  {
    id: 'carpetas-compartidas-red',
    title: 'Carpetas compartidas y Unidades de red (SMB)',
    category: 'Recursos compartidos',
    summary: 'Falta de acceso a servidores de archivos o unidades mapeadas (Z:, Y:).',
    steps: [
      'Comprobá que tengas conectividad con la red interna (o VPN activa si estás remoto).',
      'En el Explorador de Windows, probá acceder por ruta UNC ingresando "\\\\nombre-servidor" o la IP del servidor de archivos.',
      'Si recibís "Acceso denegado", el administrador de Infraestructura debe verificar la pertenencia a los grupos de seguridad en Active Directory.',
    ],
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'No puedo acceder a la unidad compartida de red ni a las carpetas del servidor.',
  },
  {
    id: 'impresoras-red-offline',
    title: 'Impresoras de red offline o cola trabada',
    category: 'Impresoras',
    summary: 'Procedimiento para equipos de impresión de red y servicios locales de spooler.',
    steps: [
      'Verificá que la impresora física tenga luz verde y no marque alerta de atasco o falta de papel/tóner.',
      'Revisá en Windows la cola de impresión y cancelá los trabajos que figuren con estado "Error".',
      'Asegurate de estar conectado a la misma subred de la oficina donde se encuentra la impresora.',
      'Si el servicio local de Spooler se detuvo, no modifiques registros del sistema; un técnico lo reiniciará.',
    ],
    escalationTarget: 'tickets@trasa.com.ar',
    suggestedPrompt: 'La impresora de red de mi piso figura offline y no imprime.',
  },
];
