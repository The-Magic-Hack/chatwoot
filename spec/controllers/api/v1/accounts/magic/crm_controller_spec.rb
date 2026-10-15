require 'rails_helper'

RSpec.describe 'Magic CRM API', type: :request do
  let(:account) { create(:account) }
  let(:inbox_1) { create(:inbox, account: account) }
  let(:inbox_2) { create(:inbox, account: account) }
  let(:admin) { create(:user, account: account, role: :administrator) }
  let(:agent) { create(:user, account: account, role: :agent) }
  let(:contact) { create(:contact, account: account, custom_attributes: { 'etapa' => 'Respondió' }) }
  let(:other) { create(:contact, account: account) }

  before do
    create(:inbox_member, user: agent, inbox: inbox_1)
    create(:conversation, account: account, inbox: inbox_1, contact: contact, last_activity_at: 2.days.ago)
    latest = create(:conversation, account: account, inbox: inbox_1, contact: contact, last_activity_at: 1.hour.ago)
    latest.update!(label_list: %w[anuncio jp-agent])
    create(:conversation, account: account, inbox: inbox_2, contact: other)
  end

  describe 'GET /api/v1/accounts/{account.id}/magic/crm' do
    it 'requires a session' do
      get "/api/v1/accounts/#{account.id}/magic/crm"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns one card per contact from its latest conversation' do
      get "/api/v1/accounts/#{account.id}/magic/crm", headers: admin.create_new_auth_token, as: :json

      expect(response).to have_http_status(:success)
      cards = response.parsed_body['payload']
      expect(cards.pluck('contact_id')).to contain_exactly(contact.id, other.id)
      card = cards.find { |c| c['contact_id'] == contact.id }
      expect(card['custom_attributes']['etapa']).to eq('Respondió')
      expect(card['labels']).to contain_exactly('anuncio', 'jp-agent')
      expect(card['status']).to eq('open')
      expect(card).to include('channel', 'inbox_id', 'assignee_id', 'conversation_attributes', 'last_message')
    end

    it 'only shows agents the contacts of their inboxes' do
      get "/api/v1/accounts/#{account.id}/magic/crm", headers: agent.create_new_auth_token, as: :json

      expect(response).to have_http_status(:success)
      expect(response.parsed_body['payload'].pluck('contact_id')).to eq([contact.id])
    end
  end
end
