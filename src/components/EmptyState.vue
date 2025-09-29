<template>
  <div class="text-center py-12">
    <v-icon size="56" color="secondary" class="mb-2">{{ icon }}</v-icon>
    <div class="text-h6 mb-2">{{ title }}</div>
    <div class="text-body-2 text-medium-emphasis mb-4">{{ subtitle }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'mdi-database-off' },
  title: { type: String, default: 'Sin datos' },
  subtitle: { type: String, default: 'Aún no has registrado información' },
})
</script>
