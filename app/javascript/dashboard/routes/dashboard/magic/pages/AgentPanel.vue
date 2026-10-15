<script setup>
// Los ajustes del agente de JP (interruptores, prompt, ofertas, origen) los sirve el propio
// agente en /jp-agent/: guarda secretos y reinicia el proceso, cosas que no van en Rails.
// Aquí se muestran dentro de Chatwoot, sin la barra del panel.
const src = '/jp-agent/?embed=1#ajustes';
</script>

<template>
  <section class="flex flex-col w-full h-full overflow-hidden bg-n-surface-1">
    <iframe
      :src="src"
      title="Agente JP"
      class="flex-1 w-full h-full border-0"
    />
  </section>
</template>
