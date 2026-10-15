<script setup>
// El campo de un bloque según su tipo (etapa, número, etiqueta, texto, mensajes…).
import { STAGES } from '../workflowBlocks';

const props = defineProps({
  input: { type: String, required: true },
  agents: { type: Array, default: () => [] },
});
const model = defineModel({ type: [String, Number, Array, Object, null] });

const toggleStage = stage => {
  const list = Array.isArray(model.value) ? model.value : [];
  model.value = list.includes(stage)
    ? list.filter(item => item !== stage)
    : [...list, stage];
};
const FIELD = 'h-8 px-2 mb-0 text-sm rounded-lg';
</script>

<template>
  <select v-if="props.input === 'stage'" v-model="model" :class="FIELD">
    <option v-for="stage in STAGES" :key="stage" :value="stage">
      {{ stage }}
    </option>
  </select>
  <input
    v-else-if="props.input === 'number'"
    v-model.number="model"
    type="number"
    min="0"
    :class="[FIELD, 'w-20']"
  />
  <input
    v-else-if="props.input === 'label'"
    v-model.trim="model"
    type="text"
    placeholder="etiqueta"
    :class="[FIELD, 'w-40']"
  />
  <input
    v-else-if="props.input === 'text'"
    v-model="model"
    type="text"
    maxlength="600"
    :class="[FIELD, 'flex-1 min-w-48']"
  />
  <select v-else-if="props.input === 'origin'" v-model="model" :class="FIELD">
    <option value="anuncio">un anuncio</option>
    <option value="organico">orgánico</option>
  </select>
  <select v-else-if="props.input === 'lang'" v-model="model" :class="FIELD">
    <option value="es">español</option>
    <option value="en">inglés</option>
  </select>
  <select v-else-if="props.input === 'agent'" v-model="model" :class="FIELD">
    <option :value="null" disabled>Elige una persona</option>
    <option v-for="agent in props.agents" :key="agent.id" :value="agent.id">
      {{ agent.name }}
    </option>
  </select>
  <div v-else-if="props.input === 'stages'" class="flex flex-wrap gap-1">
    <button
      v-for="stage in STAGES"
      :key="stage"
      type="button"
      class="px-2 h-7 text-xs rounded-md outline outline-1"
      :class="
        (model || []).includes(stage)
          ? 'bg-n-brand text-white outline-n-brand'
          : 'text-n-slate-11 outline-n-weak'
      "
      @click="toggleStage(stage)"
    >
      {{ stage }}
    </button>
  </div>
  <div
    v-else-if="props.input === 'texts'"
    class="grid flex-1 gap-2 md:grid-cols-2"
  >
    <textarea
      v-model="model.es"
      rows="2"
      maxlength="600"
      placeholder="En español"
      class="px-2 py-1.5 mb-0 text-sm rounded-lg"
    />
    <textarea
      v-model="model.en"
      rows="2"
      maxlength="600"
      placeholder="In English"
      class="px-2 py-1.5 mb-0 text-sm rounded-lg"
    />
  </div>
</template>
