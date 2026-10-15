/* global axios */

// Los workflows corren en el agente JP (/jp-agent/api/workflows). Se llama con el axios del
// dashboard, que manda las cabeceras de sesión: el agente confirma con Chatwoot que quien
// llama es administrador.
const BASE = '/jp-agent/api/workflows';

const unwrap = async request => {
  try {
    const { data } = await request;
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.error || 'El agente no respondió. Reintenta.'
    );
  }
};

export default {
  get: () => unwrap(axios.get(BASE)),
  save: config => unwrap(axios.put(BASE, { config })),
  preview: config =>
    unwrap(axios.post(`${BASE}/preview`, { config }, { timeout: 120000 })),
};
