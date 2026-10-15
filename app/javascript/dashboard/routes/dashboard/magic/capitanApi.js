/* global axios */

// El Capitán vive en el agente JP (/jp-agent/api/copilot/<acción>). Se llama con el axios
// del dashboard, que ya manda las cabeceras de sesión de Chatwoot: con ellas el agente lee
// la conversación como quien pregunta. `X-Capitan` lo exige el agente contra peticiones de
// otros sitios.
export const REWRITE_MODES = [
  { mode: 'mejorar', label: 'Corregir' },
  { mode: 'amigable', label: 'Más cálido' },
  { mode: 'formal', label: 'Más formal' },
  { mode: 'corto', label: 'Más corto' },
  { mode: 'en', label: 'A inglés' },
  { mode: 'es', label: 'A español' },
];

const call = async (action, body) => {
  try {
    const { data } = await axios.post(`/jp-agent/api/copilot/${action}`, body, {
      headers: { 'X-Capitan': '1' },
      timeout: 60000,
    });
    return { text: data.text || '', warnings: data.warnings || [] };
  } catch (error) {
    const message =
      error?.response?.data?.error || 'El Capitán no respondió. Reintenta.';
    throw new Error(message);
  }
};

export default {
  suggest: conversationId =>
    call('suggest', { conversation_id: conversationId }),
  summary: conversationId =>
    call('summary', { conversation_id: conversationId }),
  rewrite: (conversationId, text, mode) =>
    call('rewrite', { conversation_id: conversationId, text, mode }),
  ask: (conversationId, question) =>
    call('ask', { conversation_id: conversationId, question }),
};
