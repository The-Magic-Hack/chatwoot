<script setup>
// El Capitán: copiloto del equipo en cada conversación. Sugiere respuestas con el prompt y
// las ofertas del agente JP, resume al lead, mejora lo que escribiste y responde preguntas.
// Todo queda como borrador en la caja de respuesta: una persona decide qué se envía.
import { computed, ref, watch } from 'vue';
import Button from 'dashboard/components-next/button/Button.vue';
import CapitanAPI, { REWRITE_MODES } from '../capitanApi';
import { readReply, writeReply } from '../replyBus';

const props = defineProps({
  conversationId: { type: [Number, String], required: true },
});

// Códigos del saneador del agente (agent/sanitize.py): al agente lo bloquean; aquí avisan.
const WARNING_LABELS = {
  cifra_prohibida: 'menciona un precio que no está en las ofertas',
  cifra_como_descuento_o_anticipo: 'ofrece descuento, anticipo o cuotas',
  url_no_autorizada: 'trae un link que no es el de las ofertas',
  telefono_no_autorizado: 'trae un teléfono no autorizado',
  negacion_de_bot: 'niega ser automático',
  promesa_de_ingresos: 'promete ingresos',
  promesa_de_humano_sin_confirmar: 'promete que lo contactará una persona',
  afirma_ver_media: 'dice haber visto una foto o video',
  handoff_con_pregunta: 'pasa a una persona terminando en pregunta',
  fuga_de_tool: 'deja ver instrucciones internas',
};

const busy = ref('');
const result = ref(null);
const error = ref('');
const question = ref('');
const undoText = ref(null);

const conversation = computed(() => Number(props.conversationId));

watch(conversation, () => {
  result.value = null;
  error.value = '';
  undoText.value = null;
  question.value = '';
});

const warningText = computed(() =>
  (result.value?.warnings || [])
    .map(code => WARNING_LABELS[code] || code.replace(/_/g, ' '))
    .join('; ')
);

const run = async (key, title, request, { usable = false } = {}) => {
  busy.value = key;
  error.value = '';
  try {
    const data = await request();
    result.value = { ...data, title, usable };
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = '';
  }
};

const suggest = () =>
  run('suggest', 'Respuesta sugerida', () => CapitanAPI.suggest(conversation.value), {
    usable: true,
  });

const summarize = () =>
  run('summary', 'Resumen del lead', () => CapitanAPI.summary(conversation.value));

const ask = () => {
  const text = question.value.trim();
  if (!text) return;
  run('ask', text, () => CapitanAPI.ask(conversation.value, text), { usable: true });
};

const rewrite = async mode => {
  const current = readReply().trim();
  if (!current) {
    error.value = 'Escribe primero tu mensaje en la caja de respuesta.';
    return;
  }
  busy.value = `rewrite-${mode}`;
  error.value = '';
  try {
    const data = await CapitanAPI.rewrite(conversation.value, current, mode);
    undoText.value = current;
    writeReply(data.text);
    result.value = data.warnings.length
      ? { ...data, title: 'Revisa tu mensaje', usable: false }
      : null;
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = '';
  }
};

const undo = () => {
  if (undoText.value === null) return;
  writeReply(undoText.value);
  undoText.value = null;
};

const useResult = () => {
  if (!result.value?.text) return;
  undoText.value = readReply();
  writeReply(result.value.text);
};
</script>

<template>
  <div class="flex flex-col gap-3 px-2 pb-2">
    <div class="flex flex-wrap gap-2">
      <Button
        label="Sugerir respuesta"
        icon="i-lucide-sparkles"
        size="sm"
        :is-loading="busy === 'suggest'"
        :disabled="!!busy"
        @click="suggest"
      />
      <Button
        label="Resumir"
        icon="i-lucide-list"
        size="sm"
        slate
        faded
        :is-loading="busy === 'summary'"
        :disabled="!!busy"
        @click="summarize"
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-xs text-n-slate-11">Mejorar lo que escribiste</span>
      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="item in REWRITE_MODES"
          :key="item.mode"
          :label="item.label"
          size="xs"
          slate
          faded
          :is-loading="busy === `rewrite-${item.mode}`"
          :disabled="!!busy"
          @click="rewrite(item.mode)"
        />
        <Button
          v-if="undoText !== null"
          label="Deshacer"
          icon="i-lucide-undo-2"
          size="xs"
          slate
          ghost
          @click="undo"
        />
      </div>
    </div>

    <form class="flex gap-1.5" @submit.prevent="ask">
      <input
        v-model="question"
        type="text"
        maxlength="1000"
        placeholder="Pregúntale al Capitán…"
        class="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-lg bg-n-alpha-black2 outline outline-1 outline-n-weak text-n-slate-12 !mb-0"
      />
      <Button
        icon="i-lucide-send"
        size="sm"
        slate
        faded
        type="submit"
        :is-loading="busy === 'ask'"
        :disabled="!!busy || !question.trim()"
      />
    </form>

    <p v-if="error" class="text-sm text-n-ruby-11 mb-0">{{ error }}</p>

    <div
      v-if="result"
      class="flex flex-col gap-2 p-3 rounded-xl bg-n-alpha-2 outline outline-1 outline-n-weak"
    >
      <span class="text-xs font-medium text-n-slate-11 truncate">
        {{ result.title }}
      </span>
      <p class="text-sm whitespace-pre-wrap text-n-slate-12 mb-0">
        {{ result.text }}
      </p>
      <p v-if="warningText" class="text-xs text-n-amber-11 mb-0">
        Revisa antes de enviar: {{ warningText }}.
      </p>
      <div class="flex gap-1.5">
        <Button
          v-if="result.usable"
          label="Usar en la respuesta"
          icon="i-lucide-corner-down-left"
          size="xs"
          @click="useResult"
        />
        <Button
          label="Cerrar"
          size="xs"
          slate
          ghost
          @click="result = null"
        />
      </div>
    </div>
  </div>
</template>
