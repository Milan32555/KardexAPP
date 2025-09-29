<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import PageCard from '../../../components/PageCard.vue'

// 👇 REGISTRO LOCAL del gráfico (usaremos <ApexChart/> en el template)
import ApexChart from 'vue3-apexcharts'

import { useProductsStore } from '../../products/stores/productsStore'
import { useMovementsStore } from '../../movements/stores/movementsStore'
import { buildKardex } from '../services/kardexService'

const products = useProductsStore()
const moves = useMovementsStore()

const productId = ref(products.items[0]?.id ?? null)
const from = ref(null) // ISO
const to = ref(null)
const search = ref('')

const presets = [
  { label: 'Mes actual', range: () => ({ start: dayjs().startOf('month').toISOString(), end: dayjs().endOf('month').toISOString() }) },
  { label: 'Últimos 30 días', range: () => ({ start: dayjs().subtract(30,'day').toISOString(), end: dayjs().toISOString() }) },
  { label: 'Todo', range: () => ({ start: null, end: null }) },
]

const productOptions = computed(()=> products.items.map(p=>({ title:p.nombre, value:p.id })))

const rowsRaw = computed(()=>{
  if (!productId.value) return []
  const list = moves.byProduct(productId.value)
  try {
    return buildKardex(list, from.value, to.value)
  } catch (e) {
    alert(e.message); return []
  }
})

const rows = computed(()=>{
  const q = search.value.trim().toLowerCase()
  if (!q) return rowsRaw.value
  return rowsRaw.value.filter(r =>
    dayjs(r.fecha).format('YYYY-MM-DD').includes(q) ||
    (r.tipo || '').toLowerCase().includes(q)
  )
})

const fixed = (n)=> Number(n||0).toFixed(2)

// KPIs
const kpis = computed(() => {
  const totalMov = rows.value.length
  const entradas = rows.value.filter(r => r.tipo === 'Entrada')
  const salidas = rows.value.filter(r => r.tipo === 'Salida')
  const sum = (arr, k) => arr.reduce((acc, it) => acc + Number(it[k] || 0), 0)
  const last = rows.value.at(-1) || {}
  return {
    totalMov,
    entCant: sum(entradas, 'cantIn'),
    salCant: sum(salidas, 'cantOut'),
    saldoCant: Number(last.saldoCant || 0),
    saldoCU: fixed(last.saldoCostUnit),
    saldoTotal: fixed(last.saldoTotal),
  }
})

function applyPreset(p) {
  const { start, end } = p.range()
  from.value = start
  to.value = end
}

// ---------- GRÁFICO ----------
const chartSeries = computed(() => {
  const s1 = rows.value.map(r => ({ x: dayjs(r.fecha).valueOf(), y: Number(r.saldoCant || 0) }))
  const s2 = rows.value.map(r => ({ x: dayjs(r.fecha).valueOf(), y: Number(r.saldoCostUnit || 0) }))
  return [
    { name: 'Saldo (u)', type: 'area', data: s1 },
    { name: 'Costo promedio (CU)', type: 'line', data: s2 },
  ]
})

const chartOpts = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, animations: { enabled: true } },
  stroke: { width: [2, 3] },
  dataLabels: { enabled: false },
  xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
  yaxis: [
    { title: { text: 'Saldo (unidades)' }, decimalsInFloat: 0 },
    { opposite: true, title: { text: 'Costo promedio (CU)' }, decimalsInFloat: 2 }
  ],
  tooltip: { shared: true, x: { format: 'yyyy-MM-dd' } },
  grid: { strokeDashArray: 3 },
}))

const headers = [
  { title:'Fecha', value:'fecha', width:110 },
  { title:'Tipo', value:'tipo', width:110 },
  { title:'Ent. Cant', value:'cantIn', align:'end', width:120 },
  { title:'Ent. C.U.', value:'costIn', align:'end', width:120 },
  { title:'Ent. Total', value:'totalIn', align:'end', width:140 },
  { title:'Sal. Cant', value:'cantOut', align:'end', width:120 },
  { title:'Sal. C.U.', value:'costOut', align:'end', width:120 },
  { title:'Sal. Total', value:'totalOut', align:'end', width:140 },
  { title:'Saldo Cant', value:'saldoCant', align:'end', width:130 },
  { title:'Saldo C.U.', value:'saldoCostUnit', align:'end', width:120 },
  { title:'Saldo Total', value:'saldoTotal', align:'end', width:140 },
]

// Exportaciones
const exportCSV = () => {
  const header = ['Fecha','Tipo','Entrada Cant','Entrada C.U.','Entrada Total','Salida Cant','Salida C.U.','Salida Total','Saldo Cant','Saldo C.U.','Saldo Total']
  const data = rows.value.map(r=>[
    dayjs(r.fecha).format('YYYY-MM-DD'), r.tipo,
    r.cantIn, fixed(r.costIn), fixed(r.totalIn),
    r.cantOut, fixed(r.costOut), fixed(r.totalOut),
    r.saldoCant, fixed(r.saldoCostUnit), fixed(r.saldoTotal)
  ])
  const csv = [header, ...data].map(row=>row.join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const prodName = products.items.find(p=>p.id===productId.value)?.nombre || 'producto'
  a.download = `kardex_${prodName}_${dayjs().format('YYYYMMDD_HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const exportPDF = () => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' })
  const prodName = products.items.find(p=>p.id===productId.value)?.nombre || 'producto'
  const title = `Kardex Promedio - ${prodName}`
  doc.setFontSize(14)
  doc.text(title, 40, 40)
  const rangeLine = `Rango: ${from.value?dayjs(from.value).format('YYYY-MM-DD'):'—'} a ${to.value?dayjs(to.value).format('YYYY-MM-DD'):'—'}`
  doc.setFontSize(10)
  doc.text(rangeLine, 40, 58)
  doc.text(`Movimientos: ${kpis.value.totalMov}`, 40, 74)
  doc.text(`Saldo final: ${kpis.value.saldoCant} u. @ ${kpis.value.saldoCU} = ${kpis.value.saldoTotal}`, 150, 74)

  const body = rows.value.map(r => ([
    dayjs(r.fecha).format('YYYY-MM-DD'), r.tipo,
    r.cantIn, fixed(r.costIn), fixed(r.totalIn),
    r.cantOut, fixed(r.costOut), fixed(r.totalOut),
    r.saldoCant, fixed(r.saldoCostUnit), fixed(r.saldoTotal)
  ]))
  autoTable(doc, {
    startY: 92,
    head: [['Fecha','Tipo','Ent. Cant','Ent. C.U.','Ent. Total','Sal. Cant','Sal. C.U.','Sal. Total','Saldo Cant','Saldo C.U.','Saldo Total']],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] }
  })
  doc.save(`kardex_${prodName}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`)
}
</script>

<template>
  <PageCard>
    <template #title>
      <div class="d-flex align-center" style="gap:10px;">
        <v-icon color="primary">mdi-file-chart</v-icon>
        Kardex Promedio
        <v-chip class="ml-4" size="small" color="primary" variant="tonal" prepend-icon="mdi-counter">
          Movs: {{ kpis.totalMov }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="success" variant="tonal" prepend-icon="mdi-tray-arrow-down">
          Entradas: {{ kpis.entCant }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="error" variant="tonal" prepend-icon="mdi-tray-arrow-up">
          Salidas: {{ kpis.salCant }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="secondary" variant="tonal" prepend-icon="mdi-warehouse">
          Saldo: {{ kpis.saldoCant }} u · CU {{ kpis.saldoCU }} · {{ kpis.saldoTotal }}
        </v-chip>
      </div>
    </template>

    <template #actions>
      <v-select label="Producto" :items="productOptions" v-model="productId" style="min-width: 260px" hide-details />
      <v-text-field class="ml-2" label="Desde" type="date"
        :model-value="from? $dayjs(from).format('YYYY-MM-DD') : ''"
        @update:model-value="v => from = v ? $dayjs(v).toISOString() : null"
        hide-details style="max-width: 170px;" />
      <v-text-field class="ml-2" label="Hasta" type="date"
        :model-value="to? $dayjs(to).format('YYYY-MM-DD') : ''"
        @update:model-value="v => to = v ? $dayjs(v).toISOString() : null"
        hide-details style="max-width: 170px;" />

      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar">Rangos rápidos</v-btn>
        </template>
        <v-list>
          <v-list-item v-for="p in presets" :key="p.label" @click="applyPreset(p)">
            <v-list-item-title>{{ p.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-text-field class="ml-2" v-model="search" density="comfortable" variant="outlined"
        prepend-inner-icon="mdi-magnify" placeholder="Buscar fecha o tipo" hide-details style="max-width: 240px;" />

      <v-btn class="ml-2" prepend-icon="mdi-download" color="primary" @click="exportCSV">CSV</v-btn>
      <v-btn class="ml-2" prepend-icon="mdi-file-pdf-box" color="secondary" variant="tonal" @click="exportPDF">PDF</v-btn>
    </template>

    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      Fórmula: <b>Promedio móvil</b>. Entrada actualiza costo promedio; salida valora a costo promedio vigente (COGS).
    </v-alert>

    <!-- Renderiza gráfico solo si hay datos -->
    <v-card v-if="rows.length" class="mb-4" elevation="1" rounded="xl">
      <v-card-text>
        <ApexChart type="line" height="320" :options="chartOpts" :series="chartSeries" />
      </v-card-text>
    </v-card>

    <v-data-table
      :headers="[
        { title:'Fecha', value:'fecha', width:110 },
        { title:'Tipo', value:'tipo', width:110 },
        { title:'Ent. Cant', value:'cantIn', align:'end', width:120 },
        { title:'Ent. C.U.', value:'costIn', align:'end', width:120 },
        { title:'Ent. Total', value:'totalIn', align:'end', width:140 },
        { title:'Sal. Cant', value:'cantOut', align:'end', width:120 },
        { title:'Sal. C.U.', value:'costOut', align:'end', width:120 },
        { title:'Sal. Total', value:'totalOut', align:'end', width:140 },
        { title:'Saldo Cant', value:'saldoCant', align:'end', width:130 },
        { title:'Saldo C.U.', value:'saldoCostUnit', align:'end', width:120 },
        { title:'Saldo Total', value:'saldoTotal', align:'end', width:140 }
      ]"
      :items="rows"
      item-key="fecha"
      :items-per-page="10"
      hover
      fixed-header
      class="rounded-xl"
    >
      <template #item.fecha="{ item }">{{ $dayjs(item.fecha).format('YYYY-MM-DD') }}</template>

      <template #item.tipo="{ item }">
        <v-chip
          :color="item.tipo === 'Entrada' ? 'success' : 'error'"
          variant="tonal"
          size="small"
          :prepend-icon="item.tipo === 'Entrada' ? 'mdi-tray-arrow-down' : 'mdi-tray-arrow-up'"
        >
          {{ item.tipo }}
        </v-chip>
      </template>

      <template #item.cantIn="{ item }"><div class="text-right">{{ Number(item.cantIn || 0) }}</div></template>
      <template #item.costIn="{ item }"><div class="text-right">{{ Number(item.costIn || 0).toFixed(2) }}</div></template>
      <template #item.totalIn="{ item }"><div class="text-right">{{ Number(item.totalIn || 0).toFixed(2) }}</div></template>
      <template #item.cantOut="{ item }"><div class="text-right">{{ Number(item.cantOut || 0) }}</div></template>
      <template #item.costOut="{ item }"><div class="text-right">{{ Number(item.costOut || 0).toFixed(2) }}</div></template>
      <template #item.totalOut="{ item }"><div class="text-right">{{ Number(item.totalOut || 0).toFixed(2) }}</div></template>
      <template #item.saldoCant="{ item }"><div class="text-right">{{ Number(item.saldoCant || 0) }}</div></template>
      <template #item.saldoCostUnit="{ item }"><div class="text-right">{{ Number(item.saldoCostUnit || 0).toFixed(2) }}</div></template>
      <template #item.saldoTotal="{ item }"><div class="text-right">{{ Number(item.saldoTotal || 0).toFixed(2) }}</div></template>

      <template #no-data>
        <div class="text-center py-10">
          <v-icon size="56" color="secondary" class="mb-2">mdi-database-off</v-icon>
          <div class="text-h6 mb-1">Sin registros</div>
          <div class="text-body-2 text-medium-emphasis">Ajusta el rango o genera movimientos en la sección correspondiente.</div>
        </div>
      </template>
    </v-data-table>
  </PageCard>
</template>

<script>
import dayjs from 'dayjs'
export default { provide: { $dayjs: dayjs } }
</script>
