<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import PageCard from '../../../components/PageCard.vue'
import { useProductsStore } from '../../products/stores/productsStore'
import { useMovementsStore } from '../stores/movementsStore'

const products = useProductsStore()
const moves = useMovementsStore()

// ----- Formulario de alta -----
const valid = ref(false)
const form = ref({
  productId: products.items[0]?.id ?? null,
  fecha: dayjs().toISOString(),
  tipo: 'entrada',
  cantidad: null,
  costoUnit: null,
})

// ----- UI -----
const search = ref('')
const productFilter = ref(null) // filtro de tabla (no del form)
const confirmDelete = ref(false)
const toDelete = ref(null)
const snack = ref(false)
const snackText = ref('')

// Opciones de selects
const productOptions = computed(() =>
  products.items.map(p => ({ title: p.nombre, value: p.id }))
)

// Tabla: headers
const headers = [
  { title: 'Fecha', value: 'fecha', width: 110 },
  { title: 'Producto', value: 'productName' },
  { title: 'Tipo', value: 'tipo', width: 110 },
  { title: 'Cantidad', value: 'cantidad', align: 'end', width: 120 },
  { title: 'Costo Unit', value: 'costoUnit', align: 'end', width: 140 },
  { title: 'Acciones', value: 'actions', sortable: false, align: 'end', width: 100 },
]

// Items renderizables (con filtros y formato)
const items = computed(() => {
  const base = moves.items.map(m => ({
    ...m,
    productName: products.items.find(p => p.id === m.productId)?.nombre ?? '—',
    fecha: dayjs(m.fecha).format('YYYY-MM-DD'),
  }))

  // Filtro por producto (tabla)
  let filtered = productFilter.value
    ? base.filter(i => i.productId === productFilter.value)
    : base

  // Búsqueda por texto (producto/tipo)
  const q = search.value.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      i.tipo.toLowerCase().includes(q)
    )
  }

  // Orden por fecha ascendente
  return filtered.sort((a, b) => a.fecha.localeCompare(b.fecha))
})

// KPIs rápidos
const kpis = computed(() => {
  const entradas = items.value.filter(i => i.tipo === 'entrada')
  const salidas = items.value.filter(i => i.tipo === 'salida')
  const sum = (arr, k) => arr.reduce((acc, it) => acc + Number(it[k] || 0), 0)
  return {
    total: items.value.length,
    entCount: entradas.length,
    salCount: salidas.length,
    entQty: sum(entradas, 'cantidad'),
    salQty: sum(salidas, 'cantidad'),
  }
})

// Alta de movimiento
const add = () => {
  if (!valid.value) return
  const payload = { ...form.value }

  // Validaciones adicionales
  if (!payload.productId) return
  const c = Number(payload.cantidad || 0)
  if (c <= 0) return

  if (payload.tipo === 'entrada') {
    const cu = Number(payload.costoUnit || 0)
    if (cu <= 0) return
  } else {
    // salida: costoUnit no aplica en persistencia
    delete payload.costoUnit
  }

  moves.add(payload)

  // feedback
  snackText.value = 'Movimiento agregado'
  snack.value = true

  // reset conservando producto elegido
  const keepPid = form.value.productId
  form.value = {
    productId: keepPid,
    fecha: dayjs().toISOString(),
    tipo: 'entrada',
    cantidad: null,
    costoUnit: null,
  }
}

// Semillador demo
function seedDemoData() {
  const pid = form.value.productId || products.items[0]?.id
  if (!pid) return

  // Limpia movimientos de ese producto (comenta si no quieres limpiar)
  moves.items = moves.items.filter(m => m.productId !== pid)

  const base = dayjs().subtract(45, 'day')
  const entries = [
    { d: 0,  tipo: 'entrada', cantidad: 100, costoUnit: 4.80 },
    { d: 5,  tipo: 'salida',  cantidad: 30 },
    { d: 10, tipo: 'entrada', cantidad: 120, costoUnit: 5.20 },
    { d: 15, tipo: 'salida',  cantidad: 50 },
    { d: 20, tipo: 'salida',  cantidad: 40 },
    { d: 25, tipo: 'entrada', cantidad: 80,  costoUnit: 5.00 },
    { d: 30, tipo: 'salida',  cantidad: 60 },
    { d: 35, tipo: 'entrada', cantidad: 150, costoUnit: 4.90 },
    { d: 40, tipo: 'salida',  cantidad: 70 },
  ]

  for (const e of entries) {
    moves.add({
      productId: pid,
      fecha: base.add(e.d, 'day').toISOString(),
      tipo: e.tipo,
      cantidad: e.cantidad,
      ...(e.tipo === 'entrada' ? { costoUnit: e.costoUnit } : {}),
    })
  }

  snackText.value = 'Datos de demo cargados'
  snack.value = true
}

// Borrar
const askDelete = (row) => { toDelete.value = row; confirmDelete.value = true }
const doDelete = () => {
  if (!toDelete.value) return
  moves.remove(toDelete.value.id)
  confirmDelete.value = false
  toDelete.value = null
  snackText.value = 'Movimiento eliminado'
  snack.value = true
}
</script>

<template>
  <!-- Card de alta -->
  <PageCard>
    <template #title>
      <div class="d-flex align-center" style="gap:10px;">
        <v-icon color="primary">mdi-playlist-plus</v-icon>
        Registrar movimiento

        <!-- KPIs -->
        <v-chip class="ml-4" size="small" color="primary" variant="tonal" prepend-icon="mdi-database">
          Total: {{ kpis.total }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="success" variant="tonal" prepend-icon="mdi-tray-arrow-down">
          Entradas: {{ kpis.entCount }} ({{ kpis.entQty }})
        </v-chip>
        <v-chip class="ml-2" size="small" color="error" variant="tonal" prepend-icon="mdi-tray-arrow-up">
          Salidas: {{ kpis.salCount }} ({{ kpis.salQty }})
        </v-chip>
      </div>
    </template>

    <template #actions>
      <v-select
        class="mr-2"
        label="Producto"
        :items="productOptions"
        v-model="form.productId"
        style="min-width: 260px"
        hide-details
      />
      <v-btn variant="tonal" prepend-icon="mdi-database-import" @click="seedDemoData">Semillar demo</v-btn>
    </template>

    <v-form v-model="valid" @submit.prevent="add">
      <div class="d-flex flex-wrap" style="gap: 12px;">
        <v-text-field
          label="Fecha"
          type="date"
          :model-value="dayjs(form.fecha).format('YYYY-MM-DD')"
          @update:model-value="val => form.fecha = dayjs(val).toISOString()"
          style="min-width: 170px;"
        />
        <v-select
          label="Tipo"
          :items="[{ title: 'Entrada', value: 'entrada' }, { title: 'Salida', value: 'salida' }]"
          v-model="form.tipo"
          style="min-width: 160px;"
        />
        <v-text-field
          label="Cantidad"
          type="number"
          min="1"
          v-model.number="form.cantidad"
          :rules="[v => Number(v) > 0 || 'Debe ser > 0']"
          style="min-width: 160px;"
        />
        <v-text-field
          v-if="form.tipo === 'entrada'"
          label="Costo Unitario"
          type="number"
          min="0"
          step="0.01"
          v-model.number="form.costoUnit"
          :rules="[v => Number(v) > 0 || 'Debe ser > 0']"
          style="min-width: 180px;"
        />

        <v-spacer />
        <v-btn color="primary" type="submit" prepend-icon="mdi-check">Agregar</v-btn>
      </div>

      <v-alert class="mt-3" type="info" variant="tonal" density="comfortable">
        Las salidas usarán el <b>costo promedio móvil</b> vigente al momento del reporte Kardex.
      </v-alert>
    </v-form>
  </PageCard>

  <!-- Card de lista -->
  <PageCard class="mt-6">
    <template #title>
      <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
      Movimientos
    </template>

    <template #actions>
      <v-select
        v-model="productFilter"
        :items="[{ title: 'Todos', value: null }, ...productOptions]"
        label="Filtrar por producto"
        variant="outlined"
        density="comfortable"
        hide-details
        style="max-width: 260px;"
      />
      <v-text-field
        v-model="search"
        class="ml-2"
        density="comfortable"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar por producto o tipo"
        hide-details
        style="max-width: 280px;"
      />
    </template>

    <v-data-table
      :headers="headers"
      :items="items"
      items-per-page="10"
      hover
      fixed-header
      class="rounded-xl"
    >
      <template #item.tipo="{ item }">
        <v-chip
          :color="item.tipo === 'entrada' ? 'success' : 'error'"
          variant="tonal"
          size="small"
          :prepend-icon="item.tipo === 'entrada' ? 'mdi-tray-arrow-down' : 'mdi-tray-arrow-up'"
        >
          {{ item.tipo }}
        </v-chip>
      </template>

      <template #item.cantidad="{ item }">
        <div class="text-right">{{ Number(item.cantidad || 0) }}</div>
      </template>

      <template #item.costoUnit="{ item }">
        <div class="text-right">
          <span v-if="item.tipo === 'entrada'">{{ Number(item.costoUnit).toFixed(2) }}</span>
          <span v-else>—</span>
        </div>
      </template>

      <template #item.actions="{ item }">
        <v-btn icon size="small" variant="text" color="error" @click="askDelete(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>

      <template #no-data>
        <div class="text-center py-10">
          <v-icon size="56" color="secondary" class="mb-2">mdi-database-off</v-icon>
          <div class="text-h6 mb-1">Sin movimientos</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Registra tu primer movimiento o usa el semillador de demo.
          </div>
        </div>
      </template>
    </v-data-table>
  </PageCard>

  <!-- Confirmación de borrado -->
  <v-dialog v-model="confirmDelete" max-width="480">
    <v-card>
      <v-card-title class="text-subtitle-1">Eliminar movimiento</v-card-title>
      <v-card-text>
        ¿Seguro que deseas eliminar el movimiento del
        <b>{{ toDelete?.fecha }}</b> para
        <b>{{ toDelete?.productName }}</b>?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
        <v-btn color="error" @click="doDelete">Eliminar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar -->
  <v-snackbar v-model="snack" timeout="2000" location="top right" color="success">
    {{ snackText }}
    <template #actions>
      <v-btn variant="text" @click="snack = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>
