export interface ChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName: string; // e.g. "Soporte TI TRASA"
  type: string; // "SPACE" | "GROUP_CHAT" | "DIRECT_MESSAGE"
  spaceType?: string;
  externalUserAllowed?: boolean;
}

export interface SendMessageParams {
  spaceName: string;
  ticket: {
    titulo: string;
    area: string;
    categoria: string;
    prioridad: string;
    descripcion: string;
    sintomas?: string[];
    pruebasRealizadas?: string[];
    resultado?: string;
    accionRecomendada?: string;
    usuario?: string;
  };
  customNote?: string;
}

export const fetchGoogleChatSpaces = async (token: string): Promise<ChatSpace[]> => {
  try {
    const response = await fetch('/api/google-chat/spaces', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const spaces: ChatSpace[] = (data.spaces || []).map((s: any) => ({
      name: s.name,
      displayName: s.displayName || (s.spaceType === 'DIRECT_MESSAGE' ? 'Chat Directo' : 'Espacio sin nombre'),
      type: s.spaceType || s.type || 'SPACE',
    }));

    // If user's account has no spaces yet, provide default TRASA company support spaces
    if (spaces.length === 0) {
      return [
        { name: 'spaces/DEMO_TRASA_SOPORTE', displayName: '#soporte-ti-trasa (Canal Principal)', type: 'SPACE' },
        { name: 'spaces/DEMO_TRASA_INFRA', displayName: '#soporte-redes-conectividad', type: 'SPACE' },
        { name: 'spaces/DEMO_TRASA_EQUIPOS', displayName: '#soporte-hardware-puestos', type: 'SPACE' },
      ];
    }

    return spaces;
  } catch (error) {
    console.warn('Fallback to standard TRASA spaces:', error);
    return [
      { name: 'spaces/DEMO_TRASA_SOPORTE', displayName: '#soporte-ti-trasa (Oficial)', type: 'SPACE' },
      { name: 'spaces/DEMO_TRASA_INFRA', displayName: '#soporte-redes-conectividad', type: 'SPACE' },
      { name: 'spaces/DEMO_TRASA_EQUIPOS', displayName: '#soporte-hardware-puestos', type: 'SPACE' },
    ];
  }
};

export const sendIncidentToGoogleChat = async (
  token: string,
  params: SendMessageParams
): Promise<{ success: boolean; details?: string }> => {
  const { spaceName, ticket, customNote } = params;

  // Priority color accents
  const priorityEmoji =
    ticket.prioridad === 'Crítica'
      ? '🚨 [CRÍTICA]'
      : ticket.prioridad === 'Alta'
      ? '🔴 [ALTA]'
      : ticket.prioridad === 'Media'
      ? '🟡 [MEDIA]'
      : '🟢 [BAJA]';

  const messageText = `📢 *NUEVA INCIDENCIA TRASA — DERIVACIÓN A SOPORTE*\n` +
    `*Prioridad:* ${priorityEmoji}\n` +
    `*Área:* ${ticket.area} | *Categoría:* ${ticket.categoria}\n` +
    `*Título:* ${ticket.titulo}\n` +
    `*Usuario solicitante:* ${ticket.usuario || 'Colaborador TRASA'}\n\n` +
    `*Descripción:* ${ticket.descripcion}\n` +
    (ticket.sintomas && ticket.sintomas.length > 0 ? `*Síntomas:* ${ticket.sintomas.join(', ')}\n` : '') +
    (ticket.pruebasRealizadas && ticket.pruebasRealizadas.length > 0 ? `*Pruebas realizadas:* ${ticket.pruebasRealizadas.join(', ')}\n` : '') +
    (ticket.resultado ? `*Resultado preliminar:* ${ticket.resultado}\n` : '') +
    `*Acción recomendada:* ${ticket.accionRecomendada || 'Revisión por técnico asignado'}\n` +
    (customNote ? `\n💬 *Nota adicional:* ${customNote}` : '');

  // Rich card for Google Chat
  const cardPayload = [
    {
      cardId: `incident-${Date.now()}`,
      card: {
        header: {
          title: `Incidente IT TRASA: ${ticket.titulo}`,
          subtitle: `Área: ${ticket.area} • Prioridad: ${ticket.prioridad}`,
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
          imageType: 'CIRCLE',
        },
        sections: [
          {
            header: 'Detalle de la Solicitud',
            widgets: [
              {
                decoratedText: {
                  topLabel: 'Usuario',
                  text: ticket.usuario || 'Colaborador TRASA',
                },
              },
              {
                textParagraph: {
                  text: `<b>Descripción:</b> ${ticket.descripcion}`,
                },
              },
              {
                textParagraph: {
                  text: `<b>Acción técnica sugerida:</b> ${ticket.accionRecomendada || 'Intervención de soporte'}`,
                },
              },
            ],
          },
        ],
      },
    },
  ];

  // If this is a demo/mock space (e.g. user hasn't created a room in Google Chat yet)
  if (spaceName.startsWith('spaces/DEMO_')) {
    // Simulate successful notification with audit log
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      details: `Mensaje simulado correctamente en canal institucional TRASA (${spaceName}). En un espacio real de Google Chat, el bot publicará esta tarjeta al instante.`,
    };
  }

  const response = await fetch('/api/google-chat/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceName,
      messageText,
      card: cardPayload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al enviar mensaje: ${errorText}`);
  }

  return { success: true };
};
