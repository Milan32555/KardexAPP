import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'
import { vuetify } from './plugins/vuetify'

import '@mdi/font/css/materialdesignicons.css'
import './styles/main.scss'

import VueApexCharts from 'vue3-apexcharts' 

createApp(App)
  .use(router)
  .use(pinia)
  .use(vuetify)
  .use(VueApexCharts)                     
  .mount('#app')