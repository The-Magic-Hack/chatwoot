import { emitter } from 'shared/helpers/mitt';

// Puente con la caja de respuesta (ReplyBox escucha estos eventos): leer lo que la persona
// lleva escrito y reemplazarlo por un borrador. Nada se envía solo.
export const MAGIC_GET_REPLY = 'magicGetReply';
export const MAGIC_SET_REPLY = 'magicSetReply';

export const readReply = () => {
  let text = '';
  emitter.emit(MAGIC_GET_REPLY, value => {
    text = value || '';
  });
  return text;
};

export const writeReply = text => emitter.emit(MAGIC_SET_REPLY, text);
