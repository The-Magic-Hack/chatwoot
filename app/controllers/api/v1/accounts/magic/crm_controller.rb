# CRM de The Magic Hack: una tarjeta por contacto (su conversación más reciente), con lo
# justo para el tablero. El listado normal de conversaciones arma cada una completa (último
# mensaje, asignados, canal…) y tarda segundos por página; el CRM no necesita nada de eso.
# Los workflows del agente JP leen esta misma lista (estado, canal y último mensaje de cada
# conversación) en una sola petición en vez de paginar el listado completo.
class Api::V1::Accounts::Magic::CrmController < Api::V1::Accounts::BaseController
  MAX_CONVERSATIONS = 5000

  def index
    latest = {}
    permitted_conversations.each do |conversation|
      latest[conversation.contact_id] ||= conversation
    end
    last_messages = last_messages_for(latest.values.map(&:id))
    render json: { payload: latest.values.map { |conversation| card(conversation, last_messages[conversation.id]) } }
  end

  private

  def permitted_conversations
    conversations = Current.account.conversations
                           .includes(:inbox, contact: { avatar_attachment: :blob })
                           .order(last_activity_at: :desc, id: :desc)
                           .limit(MAX_CONVERSATIONS)
    Conversations::PermissionFilterService.new(conversations, Current.user, Current.account).perform
  end

  # El último mensaje que no es de actividad de cada conversación, en una sola consulta.
  def last_messages_for(conversation_ids)
    return {} if conversation_ids.empty?

    Message.where(conversation_id: conversation_ids)
           .where.not(message_type: :activity)
           .select('DISTINCT ON (conversation_id) conversation_id, message_type, private, created_at')
           .reorder(:conversation_id, created_at: :desc, id: :desc)
           .index_by(&:conversation_id)
  end

  def card(conversation, last_message)
    contact = conversation.contact
    {
      contact_id: contact.id,
      conversation_id: conversation.display_id,
      name: contact.name,
      thumbnail: contact.avatar_url,
      instagram: contact.additional_attributes&.dig('social_profiles', 'instagram'),
      custom_attributes: contact.custom_attributes || {},
      labels: conversation.cached_label_list.to_s.split(',').map(&:strip).compact_blank,
      last_activity_at: conversation.last_activity_at.to_i,
      status: conversation.status,
      channel: conversation.inbox&.channel_type,
      inbox_id: conversation.inbox_id,
      assignee_id: conversation.assignee_id,
      conversation_attributes: conversation.custom_attributes || {},
      last_message: last_message && {
        message_type: Message.message_types[last_message.message_type],
        private: last_message.private,
        created_at: last_message.created_at.to_i
      }
    }
  end
end
