<script setup>
// Buscador fijo encima de la lista de conversaciones (The Magic Hack): Enter abre el buscador
// de Chatwoot con lo escrito (contactos, conversaciones y mensajes).
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const query = ref('');
const PLACEHOLDER = 'Buscar nombre o palabra…';
const LABEL = 'Buscar contactos, conversaciones y mensajes';

const search = () => {
  const q = query.value.trim();
  if (!q) return;
  router.push({ name: 'search', query: { q } });
  query.value = '';
};
</script>

<template>
  <form class="px-4 pb-2" role="search" @submit.prevent="search">
    <label
      class="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-n-alpha-black2 outline outline-1 outline-n-weak focus-within:outline-n-brand"
    >
      <span class="flex-shrink-0 i-lucide-search size-4 text-n-slate-10" />
      <input
        v-model="query"
        type="search"
        enterkeyhint="search"
        maxlength="200"
        :placeholder="PLACEHOLDER"
        :aria-label="LABEL"
        class="flex-1 min-w-0 !mb-0 !p-0 !h-auto text-sm bg-transparent !border-0 !outline-none !shadow-none text-n-slate-12 placeholder:text-n-slate-10"
      />
    </label>
  </form>
</template>
