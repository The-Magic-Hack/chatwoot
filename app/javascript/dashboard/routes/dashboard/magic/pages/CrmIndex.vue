<script setup>
// CRM de The Magic Hack: los leads por etapa del embudo, en tablero (Kanban) y lista.
//
// La etapa es el atributo de contacto `etapa` (lista) con `etapa_desde` (fecha). El agente
// de JP la mueve solo (Lead → Contactado → Respondió → Engagement → Win / Lost) y aquí el
// equipo la mueve a mano. Las etapas salen de la definición del atributo en Chatwoot, así
// que cambiarlas no exige tocar este archivo.
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMapGetter, useStore } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import ContactAPI from 'dashboard/api/contacts';
import { getCachedCards, setCachedCards } from '../crmCache';
import MagicCrmAPI from '../crmApi';
import Avatar from 'dashboard/components-next/avatar/Avatar.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import FunnelReport from '../components/FunnelReport.vue';

const STAGE_ATTR = 'etapa';
const SINCE_ATTR = 'etapa_desde';
const FALLBACK_STAGES = [
  'Lead',
  'Contactado',
  'Respondió',
  'Engagement',
  'Win',
  'Lost',
];
const STAGE_HELP = {
  Lead: 'Escribió; nadie le ha contestado',
  Contactado: 'El agente le escribió',
  Respondió: 'Contestó al agente',
  Engagement: 'Mostró intención de compra',
  Win: 'Pagó',
  Lost: 'No le interesa',
};

const store = useStore();
const router = useRouter();
const accountId = useMapGetter('getCurrentAccountId');
const attributesByModel = useMapGetter('attributes/getAttributesByModel');

const cards = ref(getCachedCards());
const isLoading = ref(true);
const mode = ref('kanban');
const origin = ref('');
const query = ref('');
const dragging = ref(null);
const overStage = ref(null);

const stages = computed(() => {
  const definition = (attributesByModel.value('contact_attribute') || []).find(
    attr => attr.attribute_key === STAGE_ATTR
  );
  const values = definition?.attribute_values;
  return Array.isArray(values) && values.length ? values : FALLBACK_STAGES;
});

const toCard = row => {
  const attrs = row.custom_attributes || {};
  const labels = row.labels || [];
  let source = '';
  if (labels.includes('anuncio') || attrs.lead_type === 'Campaña') source = 'pauta';
  else if (labels.includes('organico') || attrs.lead_type) source = 'organico';
  return {
    contactId: row.contact_id,
    conversationId: row.conversation_id,
    name: row.name || '(sin nombre)',
    thumbnail: row.thumbnail || '',
    instagram: row.instagram || '',
    // Sin etapa guardada, Chatwoot la deduce de quién escribió (una persona del equipo
    // también contesta; solo el agente guarda la etapa).
    stage: attrs[STAGE_ATTR] || row.derived_stage || '',
    since: attrs[SINCE_ATTR] || '',
    origin: source,
    ad: attrs.anuncio || '',
    agent: labels.includes('jp-agent'),
    lastActivity: row.last_activity_at || 0,
  };
};

const load = async () => {
  isLoading.value = true;
  try {
    const { data } = await MagicCrmAPI.cards();
    cards.value = (data?.payload || []).map(toCard);
    setCachedCards(cards.value);
  } catch (error) {
    useAlert('No se pudieron cargar los leads. Reintenta.');
  } finally {
    isLoading.value = false;
  }
};

const stageOf = card =>
  stages.value.includes(card.stage) ? card.stage : stages.value[0];

const visible = computed(() => {
  const term = query.value.trim().toLowerCase();
  return cards.value.filter(card => {
    if (origin.value && card.origin !== origin.value) return false;
    if (!term) return true;
    return `${card.name} ${card.instagram} ${card.ad}`
      .toLowerCase()
      .includes(term);
  });
});

const columns = computed(() =>
  stages.value.map(stage => ({
    stage,
    cards: visible.value.filter(card => stageOf(card) === stage),
  }))
);

const daysIn = since => {
  if (!since) return '';
  const days = Math.floor((Date.now() - Date.parse(`${since}T00:00:00Z`)) / 864e5);
  if (days <= 0) return 'hoy';
  return days === 1 ? '1 día' : `${days} días`;
};

const move = async (card, stage) => {
  if (stageOf(card) === stage) return;
  const before = { stage: card.stage, since: card.since };
  const today = new Date().toISOString().slice(0, 10);
  card.stage = stage;
  card.since = today;
  try {
    await ContactAPI.update(card.contactId, {
      custom_attributes: { [STAGE_ATTR]: stage, [SINCE_ATTR]: today },
    });
  } catch (error) {
    card.stage = before.stage;
    card.since = before.since;
    useAlert(`No se pudo mover a ${card.name}.`);
  }
};

const onDrop = stage => {
  overStage.value = null;
  if (dragging.value) move(dragging.value, stage);
  dragging.value = null;
};

const openConversation = card => {
  router.push({
    name: 'inbox_conversation',
    params: { accountId: accountId.value, conversation_id: card.conversationId },
  });
};

onMounted(() => {
  store.dispatch('attributes/get');
  load();
});
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -- equipo en español; sin tocar los JSON de i18n de upstream -->
  <section class="flex flex-col w-full h-full overflow-hidden bg-n-surface-1">
    <header class="shrink-0 px-6 pt-6 pb-4 border-b border-n-weak">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-medium text-n-slate-12">CRM</h1>
          <p class="mt-1 text-sm text-n-slate-11">
            {{ visible.length }} leads. El agente los mueve solo; arrastra una
            tarjeta o cambia su etapa para moverla a mano.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex overflow-hidden rounded-lg outline outline-1 outline-n-weak">
            <button
              v-for="option in [
                { value: 'kanban', label: 'Kanban' },
                { value: 'lista', label: 'Lista' },
                { value: 'embudo', label: 'Embudo' },
              ]"
              :key="option.value"
              type="button"
              class="px-3 h-8 text-sm"
              :class="
                mode === option.value
                  ? 'bg-n-brand text-white'
                  : 'text-n-slate-11 hover:bg-n-alpha-2'
              "
              :aria-pressed="mode === option.value"
              @click="mode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <select
            v-model="origin"
            aria-label="Origen"
            class="h-8 px-2 mb-0 text-sm rounded-lg w-auto"
          >
            <option value="">Todos los orígenes</option>
            <option value="pauta">Pauta</option>
            <option value="organico">Orgánico</option>
          </select>
          <input
            v-model="query"
            type="search"
            placeholder="Buscar nombre, @usuario o anuncio"
            class="h-8 px-2 mb-0 text-sm rounded-lg w-64"
          />
          <Button
            label="Actualizar"
            icon="i-lucide-refresh-cw"
            size="sm"
            slate
            faded
            :is-loading="isLoading"
            @click="load"
          />
        </div>
      </div>
    </header>

    <div
      v-if="isLoading && !cards.length"
      class="flex items-center justify-center flex-1"
    >
      <Spinner :size="24" />
    </div>

    <main
      v-else-if="mode === 'kanban'"
      class="flex flex-1 gap-3 p-4 overflow-x-auto overflow-y-hidden"
    >
      <section
        v-for="column in columns"
        :key="column.stage"
        :aria-label="column.stage"
        class="flex flex-col flex-shrink-0 w-72 rounded-xl bg-n-solid-2 outline outline-1"
        :class="
          overStage === column.stage ? 'outline-n-brand' : 'outline-n-weak'
        "
        @dragover.prevent="overStage = column.stage"
        @dragleave="overStage = null"
        @drop.prevent="onDrop(column.stage)"
      >
        <header class="px-3 pt-3 pb-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-n-slate-12">
              {{ column.stage }}
            </span>
            <span
              class="inline-grid h-5 min-w-5 place-items-center rounded-full bg-n-slate-4 px-1.5 text-xs text-n-slate-12"
            >
              {{ column.cards.length }}
            </span>
          </div>
          <p class="mt-0.5 text-xs text-n-slate-11">
            {{ STAGE_HELP[column.stage] || '' }}
          </p>
        </header>
        <div class="flex flex-col flex-1 gap-2 px-2 pb-3 overflow-y-auto">
          <article
            v-for="card in column.cards"
            :key="card.contactId"
            draggable="true"
            class="flex flex-col gap-1.5 p-2.5 rounded-lg bg-n-surface-1 outline outline-1 outline-n-weak cursor-grab active:cursor-grabbing"
            @dragstart="dragging = card"
            @dragend="dragging = null"
          >
            <button
              type="button"
              class="flex items-center gap-2 min-w-0 text-left"
              @click="openConversation(card)"
            >
              <Avatar :src="card.thumbnail" :name="card.name" :size="24" rounded-full />
              <span class="text-sm font-medium truncate text-n-slate-12 hover:underline">
                {{ card.name }}
              </span>
            </button>
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span
                v-if="card.origin === 'pauta'"
                class="px-1.5 py-0.5 rounded bg-n-amber-3 text-n-amber-11"
              >
                Pauta
              </span>
              <span
                v-else-if="card.origin === 'organico'"
                class="px-1.5 py-0.5 rounded bg-n-teal-3 text-n-teal-11"
              >
                Orgánico
              </span>
              <span
                v-if="card.agent"
                class="px-1.5 py-0.5 rounded bg-n-blue-3 text-n-blue-11"
              >
                Agente
              </span>
              <span v-if="card.since" class="text-n-slate-11">
                {{ daysIn(card.since) }}
              </span>
            </div>
            <p v-if="card.ad" class="text-xs break-words text-n-slate-11">
              {{ card.ad }}
            </p>
            <select
              :value="stageOf(card)"
              :aria-label="`Etapa de ${card.name}`"
              class="h-7 px-1.5 mb-0 text-xs rounded-md"
              @change="move(card, $event.target.value)"
            >
              <option v-for="stage in stages" :key="stage" :value="stage">
                {{ stage }}
              </option>
            </select>
          </article>
          <p
            v-if="!column.cards.length"
            class="py-4 text-xs text-center text-n-slate-11"
          >
            Nadie aquí.
          </p>
        </div>
      </section>
    </main>

    <FunnelReport
      v-else-if="mode === 'embudo'"
      :cards="visible" />
    <main v-else class="flex-1 px-6 py-4 overflow-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-n-slate-11">
            <th class="py-2 pr-3 font-medium">Nombre</th>
            <th class="py-2 pr-3 font-medium">Etapa</th>
            <th class="py-2 pr-3 font-medium">Origen</th>
            <th class="py-2 pr-3 font-medium">Anuncio</th>
            <th class="py-2 pr-3 font-medium">En la etapa</th>
            <th class="py-2 font-medium">Agente</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="card in visible"
            :key="card.contactId"
            class="border-t border-n-weak align-top"
          >
            <td class="py-2 pr-3">
              <button
                type="button"
                class="flex items-center gap-2 text-left"
                @click="openConversation(card)"
              >
                <Avatar :src="card.thumbnail" :name="card.name" :size="24" rounded-full />
                <span>
                  <span class="block font-medium text-n-slate-12 hover:underline">
                    {{ card.name }}
                  </span>
                  <span v-if="card.instagram" class="text-xs text-n-slate-11">
                    @{{ card.instagram }}
                  </span>
                </span>
              </button>
            </td>
            <td class="py-2 pr-3">
              <select
                :value="stageOf(card)"
                :aria-label="`Etapa de ${card.name}`"
                class="h-7 px-1.5 mb-0 text-xs rounded-md w-auto"
                @change="move(card, $event.target.value)"
              >
                <option v-for="stage in stages" :key="stage" :value="stage">
                  {{ stage }}
                </option>
              </select>
            </td>
            <td class="py-2 pr-3 text-n-slate-11">
              {{
                card.origin === 'pauta'
                  ? 'Pauta'
                  : card.origin === 'organico'
                    ? 'Orgánico'
                    : ''
              }}
            </td>
            <td class="py-2 pr-3 text-n-slate-11">{{ card.ad }}</td>
            <td class="py-2 pr-3 text-n-slate-11">{{ daysIn(card.since) }}</td>
            <td class="py-2 text-n-slate-11">{{ card.agent ? 'Sí' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </main>
  </section>
</template>
