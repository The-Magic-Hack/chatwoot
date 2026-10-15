<script setup>
// Workflows de la fase 1: lo que el motor del agente hace solo con cada conversación cada
// 5 minutos. Aquí se encienden, se ajustan y se ve qué hicieron. La vista previa dice qué
// harían ahora mismo sin tocar nada.
import { computed, onMounted, ref } from 'vue';
import { useAlert } from 'dashboard/composables';
import Button from 'dashboard/components-next/button/Button.vue';
import Switch from 'dashboard/components-next/switch/Switch.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import WorkflowsAPI from '../workflowsApi';
import RuleEditor from '../components/RuleEditor.vue';
import { newRule } from '../workflowBlocks';

const config = ref(null);
const saved = ref('');
const agents = ref([]);
const activity = ref([]);
const preview = ref(null);
const isLoading = ref(true);
const isSaving = ref(false);
const isPreviewing = ref(false);
const loadError = ref('');

const NAMES = {
  recontacto: 'Recontacto',
  silencio: 'Silencio',
  caliente: 'Lead caliente',
  pago: 'Pago en Stripe',
};
const nameOf = item =>
  item.workflow === 'regla' ? `Regla «${item.rule}»` : NAMES[item.workflow];

const addRule = () => {
  config.value.reglas = [...(config.value.reglas || []), newRule()];
};
const removeRule = index => {
  config.value.reglas.splice(index, 1);
};

const dirty = computed(
  () => config.value && JSON.stringify(config.value) !== saved.value
);

const load = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    const data = await WorkflowsAPI.get();
    config.value = { reglas: [], ...data.config };
    saved.value = JSON.stringify(config.value);
    agents.value = data.agents || [];
    activity.value = data.log || [];
  } catch (error) {
    loadError.value = error.message;
  } finally {
    isLoading.value = false;
  }
};

const save = async () => {
  isSaving.value = true;
  try {
    const data = await WorkflowsAPI.save(config.value);
    config.value = { reglas: [], ...data.config };
    saved.value = JSON.stringify(config.value);
    useAlert('Workflows guardados. Se aplican en la próxima vuelta (máx. 5 min).');
  } catch (error) {
    useAlert(error.message);
  } finally {
    isSaving.value = false;
  }
};

const runPreview = async () => {
  isPreviewing.value = true;
  try {
    preview.value = await WorkflowsAPI.preview(config.value);
  } catch (error) {
    useAlert(error.message);
  } finally {
    isPreviewing.value = false;
  }
};

const when = epoch =>
  new Date(epoch * 1000).toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

onMounted(load);
</script>

<template>
  <section class="flex flex-col w-full h-full overflow-auto bg-n-background">
    <header class="shrink-0 px-6 pt-6 pb-4 border-b border-n-weak">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-medium text-n-slate-12">Workflows</h1>
          <p class="mt-1 text-sm text-n-slate-11">
            Lo que el agente hace solo con cada conversación, cada 5 minutos.
          </p>
        </div>
        <div v-if="config" class="flex flex-wrap items-center gap-2">
          <Button
            label="Vista previa"
            icon="i-lucide-eye"
            size="sm"
            slate
            faded
            :is-loading="isPreviewing"
            @click="runPreview"
          />
          <Button
            label="Guardar"
            icon="i-lucide-save"
            size="sm"
            :disabled="!dirty"
            :is-loading="isSaving"
            @click="save"
          />
        </div>
      </div>
    </header>

    <div v-if="isLoading" class="flex justify-center py-16">
      <Spinner />
    </div>
    <div v-else-if="loadError" class="px-6 py-10 text-sm text-n-ruby-11">
      {{ loadError }}
      <Button
        label="Reintentar"
        size="sm"
        slate
        faded
        class="ml-2"
        @click="load"
      />
    </div>

    <div v-else class="flex flex-col gap-4 px-6 py-6 max-w-4xl">
      <article
        class="flex flex-col gap-3 p-4 rounded-xl outline outline-1 outline-n-weak bg-n-solid-1"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-medium text-n-slate-12">Recontacto</h2>
            <p class="text-sm text-n-slate-11 mb-0">
              Si el lead deja de contestar, el agente le escribe una vez. Solo
              dentro de las 24 h que permite Meta, y solo en conversaciones que
              lleva el agente.
            </p>
          </div>
          <Switch v-model="config.recontacto.enabled" />
        </div>
        <label class="flex items-center gap-2 text-sm text-n-slate-12">
          Escribirle tras
          <input
            v-model.number="config.recontacto.after_hours"
            type="number"
            min="1"
            max="22"
            class="w-16 h-8 px-2 mb-0 text-sm rounded-lg"
          />
          horas sin respuesta
        </label>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-n-slate-11">
            Mensaje en español
            <textarea
              v-model="config.recontacto.text_es"
              rows="3"
              maxlength="600"
              class="px-2 py-1.5 mb-0 text-sm rounded-lg"
            />
          </label>
          <label class="flex flex-col gap-1 text-xs text-n-slate-11">
            Mensaje en inglés
            <textarea
              v-model="config.recontacto.text_en"
              rows="3"
              maxlength="600"
              class="px-2 py-1.5 mb-0 text-sm rounded-lg"
            />
          </label>
        </div>
      </article>

      <article
        class="flex flex-col gap-3 p-4 rounded-xl outline outline-1 outline-n-weak bg-n-solid-1"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-medium text-n-slate-12">Silencio</h2>
            <p class="text-sm text-n-slate-11 mb-0">
              Si el lead no contesta en varios días, pasa a Lost en el CRM y
              queda una nota en la conversación.
            </p>
          </div>
          <Switch v-model="config.silencio.enabled" />
        </div>
        <label class="flex items-center gap-2 text-sm text-n-slate-12">
          Pasar a Lost tras
          <input
            v-model.number="config.silencio.after_days"
            type="number"
            min="1"
            max="30"
            class="w-16 h-8 px-2 mb-0 text-sm rounded-lg"
          />
          días sin respuesta
        </label>
      </article>

      <article
        class="flex flex-col gap-3 p-4 rounded-xl outline outline-1 outline-n-weak bg-n-solid-1"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-medium text-n-slate-12">Lead caliente</h2>
            <p class="text-sm text-n-slate-11 mb-0">
              Cuando un lead llega a Engagement, se etiqueta «caliente», se
              asigna a una persona y queda una nota para atenderlo hoy.
            </p>
          </div>
          <Switch v-model="config.caliente.enabled" />
        </div>
        <label class="flex items-center gap-2 text-sm text-n-slate-12">
          Asignar a
          <select
            v-model="config.caliente.assignee_id"
            class="h-8 px-2 mb-0 text-sm rounded-lg w-auto"
          >
            <option :value="null">Nadie (solo etiqueta y nota)</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.name }}
            </option>
          </select>
        </label>
      </article>

      <div class="flex items-center justify-between gap-3 pt-2">
        <div>
          <h2 class="text-base font-medium text-n-slate-12">Reglas propias</h2>
          <p class="text-sm text-n-slate-11 mb-0">
            Arma tus propios workflows: cuando pase algo, si se cumplen las
            condiciones, haz estas acciones. Cada regla actúa una sola vez por
            cada vez que pasa.
          </p>
        </div>
        <Button
          label="Nueva regla"
          icon="i-lucide-plus"
          size="sm"
          slate
          faded
          @click="addRule"
        />
      </div>
      <RuleEditor
        v-for="(rule, index) in config.reglas"
        :key="rule.id"
        v-model="config.reglas[index]"
        :agents="agents"
        @remove="removeRule(index)"
      />

      <article
        v-if="preview"
        class="flex flex-col gap-2 p-4 rounded-xl outline outline-1 outline-n-weak"
      >
        <h2 class="text-base font-medium text-n-slate-12">
          Vista previa: qué harían ahora
        </h2>
        <p v-if="!preview.planned.length" class="text-sm text-n-slate-11 mb-0">
          Nada que hacer ahora en {{ preview.scanned }} conversaciones
          abiertas.
        </p>
        <ul v-else class="flex flex-col gap-1.5 mb-0">
          <li
            v-for="item in preview.planned"
            :key="item.conversation_id"
            class="text-sm text-n-slate-12"
          >
            <strong>{{ item.name || `#${item.conversation_id}` }}</strong>
            · {{ nameOf(item) }}: {{ item.results.join(', ') }}
          </li>
        </ul>
        <p class="text-xs text-n-slate-11 mb-0">
          Los mensajes además pasan por las puertas del agente (bajas, handoff,
          envíos apagados) al momento de enviarse.
        </p>
      </article>

      <article class="flex flex-col gap-2 p-4 rounded-xl outline outline-1 outline-n-weak">
        <h2 class="text-base font-medium text-n-slate-12">Actividad</h2>
        <p v-if="!activity.length" class="text-sm text-n-slate-11 mb-0">
          Todavía no hay actividad.
        </p>
        <ul v-else class="flex flex-col gap-1.5 mb-0">
          <li
            v-for="item in activity"
            :key="`${item.at}-${item.conversation_id}`"
            class="text-sm"
            :class="item.ok ? 'text-n-slate-12' : 'text-n-ruby-11'"
          >
            <span class="text-n-slate-11">{{ when(item.at) }}</span>
            · <strong>{{ item.name || `#${item.conversation_id}` }}</strong> ·
            {{ nameOf(item) }}: {{ item.results.join(', ') }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
