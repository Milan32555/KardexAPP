<template>
  <v-card>
    <v-card-title class="d-flex align-center" :class="titleClass">
      <slot name="title" />
      <v-spacer />
      <slot name="actions" />
    </v-card-title>
    <v-divider />
    <v-card-text>
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({ titleClass: { type: String, default: 'text-h6' } })
</script>
