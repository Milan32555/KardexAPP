<template>
  <v-snackbar v-model="open" timeout="2000" location="top right" color="success">
    {{ text }}
    <template #actions>
      <v-btn variant="text" @click="open=false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ modelValue: Boolean, text: String })
const emit = defineEmits(['update:modelValue'])
const open = ref(props.modelValue)
watch(() => props.modelValue, v => open.value = v)
watch(open, v => emit('update:modelValue', v))
</script>
