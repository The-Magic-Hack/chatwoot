# CRM de The Magic Hack: una tarjeta por contacto (su conversación más reciente), con lo
# justo para el tablero. El listado normal de conversaciones arma cada una completa (último
# mensaje, asignados, canal…) y tarda segundos por página; el CRM no necesita nada de eso.
class Api::V1::Accounts::Magic::CrmController < Api::V1::Accounts::BaseController
  MAX_CONVERSATIONS = 5000

  def index
    latest = {}
    permitted_conversations.each do |conversation|
      latest[conversation.contact_id] ||= conversation
    end
    render json: { payload: latest.values.map { |conversation| card(conversation) } }
  end

  private

  def permitted_conversations
    conversations = Current.account.conversations
                           .includes(contact: { avatar_attachment: :blob })
                           .order(last_activity_at: :desc, id: :desc)
                           .limit(MAX_CONVERSATIONS)
    Conversations::PermissionFilterService.new(conversations, Current.user, Current.account).perform
  end

  def card(conversation)
    contact = conversation.contact
    {
      contact_id: contact.id,
      conversation_id: conversation.display_id,
      name: contact.name,
      thumbnail: contact.avatar_url,
      instagram: contact.additional_attributes&.dig('social_profiles', 'instagram'),
      custom_attributes: contact.custom_attributes || {},
      labels: conversation.cached_label_list.to_s.split(',').map(&:strip).compact_blank,
      last_activity_at: conversation.last_activity_at.to_i
    }
  end
end
