<script setup>
// Agentes: cada agente con su estado, lo que hace y lo que logró. El agente JP se configura
// en su ficha (prompt, ofertas, interruptores); el Capitán vive en cada conversación.
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMapGetter } from 'dashboard/composables/store';
import Button from 'dashboard/components-next/button/Button.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

/* global axios */
const router = useRouter();
const accountId = useMapGetter('getCurrentAccountId');
const agents = ref([]);
const isLoading = ref(true);
const loadError = ref('');

const load = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    const { data } = await axios.get('/jp-agent/api/agents');
    agents.value = data.agents || [];
  } catch (error) {
    loadError.value =
      error?.response?.data?.error || 'El agente no respondió. Reintenta.';
  } finally {
    isLoading.value = false;
  }
};

const pct = (part, total) =>
  total ? `${Math.round((part / total) * 100)}%` : '—';

const openSettings = agent =>
  router.push({ name: agent.settings, params: { accountId: accountId.value } });

onMounted(load);
</script>

<template>
  <section class="flex flex-col w-full h-full overflow-auto bg-n-background">
    <header class="shrink-0 px-6 pt-6 pb-4 border-b border-n-weak">
      <h1 class="text-xl font-medium text-n-slate-12">Agentes</h1>
      <p class="mt-1 text-sm text-n-slate-11">
        Los agentes de IA de la cuenta: qué hacen, si están encendidos y qué
        lograron.
      </p>
    </header>

    <div v-if="isLoading" class="flex justify-center py-16">
      <Spinner />
    </div>
    <div v-else-if="loadError" class="px-6 py-10 text-sm text-n-ruby-11">
      {{ loadError }}
    </div>

    <div v-else class="grid gap-4 px-6 py-6 max-w-5xl md:grid-cols-2">
      <article
        v-for="agent in agents"
        :key="agent.id"
        class="flex flex-col gap-3 p-4 rounded-xl outline outline-1 outline-n-weak bg-n-solid-1"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              class="size-9 rounded-lg flex items-center justify-center bg-n-alpha-2"
            >
              <span
                class="size-5"
                :class="agent.kind === 'copiloto' ? 'i-lucide-sparkles' : 'i-lucide-bot'"
              />
            </span>
            <div>
              <h2 class="text-base font-medium text-n-slate-12">
                {{ agent.name }}
              </h2>
              <span
                class="text-xs"
                :class="agent.on ? 'text-n-teal-11' : 'text-n-amber-11'"
              >
                ● {{ agent.status }}
              </span>
            </div>
          </div>
          <Button
            v-if="agent.settings"
            label="Configurar"
            icon="i-lucide-settings"
            size="xs"
            slate
            faded
            @click="openSettings(agent)"
          />
        </div>
        <p class="text-sm text-n-slate-11 mb-0">{{ agent.description }}</p>

        <dl
          v-if="agent.metrics"
          class="grid grid-cols-4 gap-2 p-3 rounded-lg bg-n-alpha-1 mb-0"
        >
          <div>
            <dt class="text-xs text-n-slate-11">Atendió</dt>
            <dd class="text-lg font-medium text-n-slate-12 mb-0">
              {{ agent.metrics.attended }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-n-slate-11">Respondieron</dt>
            <dd class="text-lg font-medium text-n-slate-12 mb-0">
              {{ agent.metrics.replied }}
              <span class="text-xs text-n-slate-11">
                {{ pct(agent.metrics.replied, agent.metrics.attended) }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-n-slate-11">Engagement</dt>
            <dd class="text-lg font-medium text-n-slate-12 mb-0">
              {{ agent.metrics.engaged }}
              <span class="text-xs text-n-slate-11">
                {{ pct(agent.metrics.engaged, agent.metrics.attended) }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-n-slate-11">Win</dt>
            <dd class="text-lg font-medium text-n-slate-12 mb-0">
              {{ agent.metrics.won }}
            </dd>
          </div>
        </dl>
        <p v-else class="text-xs text-n-slate-11 mb-0">
          Está en el panel derecho de cada conversación, para todo el equipo.
        </p>
      </article>
    </div>
  </section>
</template>
