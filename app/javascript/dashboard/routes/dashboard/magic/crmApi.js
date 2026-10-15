/* global axios */
import ApiClient from 'dashboard/api/ApiClient';

// Endpoint propio del fork (Api::V1::Accounts::Magic::CrmController): una tarjeta por
// contacto en una sola petición, en vez de paginar el listado completo de conversaciones.
class MagicCrmAPI extends ApiClient {
  constructor() {
    super('magic/crm', { accountScoped: true });
  }

  cards() {
    return axios.get(this.url);
  }
}

export default new MagicCrmAPI();
