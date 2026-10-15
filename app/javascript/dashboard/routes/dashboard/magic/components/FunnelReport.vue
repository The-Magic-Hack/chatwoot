<script setup>
// Embudo del CRM: cuántos leads hay en cada etapa y cuántos avanzan, en total y por anuncio.
// "Llegó a" cuenta a quien está en esa etapa o en una posterior (Lost cuenta solo hasta donde
// se sabe: no tiene etapa previa guardada, así que suma en Lost y no en las anteriores).
import { computed } from 'vue';

const props = defineProps({
  cards: { type: Array, required: true },
});

const FLOW = ['Lead', 'Contactado', 'Respondió', 'Engagement', 'Win'];

const reached = list => {
  const counts = Object.fromEntries(FLOW.map(stage => [stage, 0]));
  list.forEach(card => {
    const at = FLOW.indexOf(card.stage || 'Lead');
    FLOW.forEach((stage, index) => {
      if (at >= index) counts[stage] += 1;
    });
  });
  return counts;
};

const pct = (part, total) =>
  total ? `${Math.round((part / total) * 100)}%` : '—';

const total = computed(() => reached(props.cards));
const lost = computed(
  () => props.cards.filter(card => card.stage === 'Lost').length
);
const maxCount = computed(() => Math.max(1, total.value.Lead));

const byAd = computed(() => {
  const groups = new Map();
  props.cards.forEach(card => {
    let key = 'Sin anuncio (orgánico)';
    if (card.ad) key = card.ad;
    else if (card.origin === 'pauta') key = 'Pauta sin anuncio identificado';
    groups.set(key, [...(groups.get(key) || []), card]);
  });
  return [...groups.entries()]
    .map(([ad, list]) => ({
      ad,
      count: list.length,
      reached: reached(list),
      lost: list.filter(card => card.stage === 'Lost').length,
    }))
    .sort((a, b) => b.count - a.count);
});
</script>

<template>
  <main class="flex-1 px-6 py-6 overflow-auto">
    <div class="flex flex-col gap-6 max-w-5xl">
      <section class="flex flex-col gap-2">
        <h2 class="text-base font-medium text-n-slate-12">Embudo</h2>
        <div
          v-for="(stage, index) in FLOW"
          :key="stage"
          class="flex items-center gap-3 text-sm"
        >
          <span class="w-28 shrink-0 text-n-slate-12">{{ stage }}</span>
          <div class="flex-1 h-6 rounded-md bg-n-alpha-1 overflow-hidden">
            <div
              class="h-full rounded-md bg-n-brand/70"
              :style="{ width: `${(total[stage] / maxCount) * 100}%` }"
            />
          </div>
          <span class="w-12 text-right tabular-nums text-n-slate-12">
            {{ total[stage] }}
          </span>
          <span class="w-28 text-xs text-n-slate-11">
            {{
              index === 0
                ? 'leads'
                : `${pct(total[stage], total[FLOW[index - 1]])} de la anterior`
            }}
          </span>
        </div>
        <p class="text-xs text-n-slate-11 mb-0">
          {{ lost }} en Lost. Cada etapa cuenta a quien llegó a ella o más
          lejos.
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-base font-medium text-n-slate-12">Por anuncio</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-n-slate-11">
              <th class="py-2 pr-3 font-normal">Anuncio</th>
              <th class="py-2 pr-3 font-normal text-right">Leads</th>
              <th class="py-2 pr-3 font-normal text-right">Respondió</th>
              <th class="py-2 pr-3 font-normal text-right">Engagement</th>
              <th class="py-2 pr-3 font-normal text-right">Win</th>
              <th class="py-2 font-normal text-right">Lost</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in byAd"
              :key="row.ad"
              class="border-t border-n-weak"
            >
              <td class="py-2 pr-3 text-n-slate-12">{{ row.ad }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ row.count }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">
                {{ row.reached['Respondió'] }}
                <span class="text-xs text-n-slate-11">
                  {{ pct(row.reached['Respondió'], row.count) }}
                </span>
              </td>
              <td class="py-2 pr-3 text-right tabular-nums">
                {{ row.reached.Engagement }}
                <span class="text-xs text-n-slate-11">
                  {{ pct(row.reached.Engagement, row.count) }}
                </span>
              </td>
              <td class="py-2 pr-3 text-right tabular-nums">
                {{ row.reached.Win }}
                <span class="text-xs text-n-slate-11">
                  {{ pct(row.reached.Win, row.count) }}
                </span>
              </td>
              <td class="py-2 text-right tabular-nums">{{ row.lost }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </main>
</template>
