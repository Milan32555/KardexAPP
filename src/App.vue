<script setup>
import { useTheme } from 'vuetify'
import AppContainer from './layouts/AppContainer.vue'
import { useRoute } from 'vue-router'

const theme = useTheme()
const route = useRoute()
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
const isActive = (path) => route.path.startsWith(path)
</script>

<template>
  <v-app>
    <v-app-bar flat color="surface" class="border-b">
      <AppContainer>
        <div class="d-flex align-center" style="gap: 12px;">
          <v-icon size="28" color="primary">mdi-file-chart</v-icon>
          <div class="text-h6 font-weight-semibold">Kardex Promedio</div>
          <v-spacer/>

          <v-btn
            :variant="isActive('/productos') ? 'flat' : 'text'"
            :color="isActive('/productos') ? 'primary' : undefined"
            prepend-icon="mdi-package-variant"
            to="/productos"
          >Productos</v-btn>

          <v-btn
            :variant="isActive('/movimientos') ? 'flat' : 'text'"
            :color="isActive('/movimientos') ? 'primary' : undefined"
            prepend-icon="mdi-clipboard-text"
            to="/movimientos"
          >Movimientos</v-btn>

          <v-btn
            :variant="isActive('/kardex') ? 'flat' : 'text'"
            :color="isActive('/kardex') ? 'primary' : undefined"
            prepend-icon="mdi-file-chart"
            to="/kardex"
          >Kardex</v-btn>

          <v-divider vertical class="mx-3" />
          <v-btn icon variant="text" @click="toggleTheme" :title="`Tema: ${$vuetify.theme.current.dark ? 'Oscuro' : 'Claro'}`">
            <v-icon>{{ $vuetify.theme.current.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
        </div>
      </AppContainer>
    </v-app-bar>

    <v-main>
      <AppContainer>
        <div class="py-6">
          <router-view/>
        </div>
      </AppContainer>
    </v-main>
  </v-app>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(0,0,0,.06); }
</style>
