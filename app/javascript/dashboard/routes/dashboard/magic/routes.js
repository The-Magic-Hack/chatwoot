// The Magic Hack: pantallas propias dentro de Chatwoot. Todo lo nuestro vive en esta
// carpeta para que actualizar Chatwoot (merge de upstream) no choque con nada.
import { ROLES } from 'dashboard/constants/permissions';
import { frontendURL } from '../../../helper/URLHelper';
import CrmIndex from './pages/CrmIndex.vue';
import AgentPanel from './pages/AgentPanel.vue';

export const routes = [
  {
    path: frontendURL('accounts/:accountId/crm'),
    name: 'magic_crm_index',
    component: CrmIndex,
    meta: { permissions: [...ROLES, 'contact_manage'] },
  },
  {
    path: frontendURL('accounts/:accountId/agente-jp'),
    name: 'magic_agent_panel',
    component: AgentPanel,
    meta: { permissions: ['administrator'] },
  },
];
