# 📦 Kardex Promedio – Inventario con Costo Promedio Móvil

Aplicación web construida con **Vue 3 + Vite + Vuetify** para la gestión de productos, movimientos de inventario (entradas/salidas) y cálculo del **Kardex con método de Promedio Móvil**.

## 🚀 Características
- Gestión de productos con stock mínimo y estado.
- Registro de movimientos de inventario (entradas y salidas).
- Generación automática del **Kardex Promedio**.
- Exportación de reportes a **CSV** y **PDF**.
- Gráfico interactivo con **ApexCharts** mostrando saldo y costo promedio.
- Interfaz responsive con **Vuetify 3**.

## 🛠️ Tecnologías
- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- [Vuetify 3](https://vuetifyjs.com/) – UI
- [Pinia](https://pinia.vuejs.org/) – Stores de productos y movimientos
- [dayjs](https://day.js.org/) – Manejo de fechas
- [ApexCharts](https://apexcharts.com/vue3-chart-demos/) – Gráficos
- [jsPDF](https://github.com/parallax/jsPDF) + [autoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) – Reportes PDF

## 📂 Estructura
- `modules/products` → gestión de productos
- `modules/movements` → registro de movimientos
- `modules/kardex` → lógica de cálculo del kardex
- `components/PageCard.vue` → wrapper para páginas con título, acciones y tabla
- `styles/main.scss` → estilos globales

## ▶️ Cómo ejecutar
```bash
# instalar dependencias
npm install

# entorno de desarrollo
npm run dev

# pruebas unitarias
npm run test

# build producción
npm run build
