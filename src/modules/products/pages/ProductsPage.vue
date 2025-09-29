<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '../stores/productsStore'
import { useMovementsStore } from '../../movements/stores/movementsStore'
import { getCurrentBalance } from '../../kardex/services/inventoryService'
import PageCard from '../../../components/PageCard.vue'

const store = useProductsStore()
const moves = useMovementsStore()

// UI
const dialog = ref(false)
const valid = ref(false)
const editingId = ref(null)
const snack = ref(false)
const snackText = ref('')
const search = ref('')

// Confirmación de borrado
const confirmDelete = ref(false)
const toDelete = ref(null)

// Form
const form = ref({ nombre: '', categoria: '', stockMin: 0 })

// Items con saldo y flag de bajo stock
const items = computed(() => {
  const base = store.items.map(p => {
    const bal = getCurrentBalance(moves.byProduct(p.id))
    const bajo = bal.qty <= Number(p.stockMin || 0)
    return { ...p, saldo: bal.qty, bajo }
  })
  // Filtro por búsqueda (nombre o categoría)
  const q = search.value.trim().toLowerCase()
  const filtered = !q
    ? base
    : base.filter(i =>
        (i.nombre || '').toLowerCase().includes(q) ||
        (i.categoria || '').toLowerCase().includes(q)
      )
  // Orden: primero bajo stock, luego nombre
  return filtered.sort((a, b) => {
    if (a.bajo !== b.bajo) return a.bajo ? -1 : 1
    return (a.nombre || '').localeCompare(b.nombre || '')
  })
})

// KPIs rápidos
const kpis = computed(() => {
  const total = store.items.length
  const bajos = items.value.filter(i => i.bajo).length
  const activos = items.value.filter(i => i.activo).length
  return { total, bajos, activos }
})

const openNew = () => {
  editingId.value = null
  form.value = { nombre: '', categoria: '', stockMin: 0 }
  dialog.value = true
}
const openEdit = (p) => {
  editingId.value = p.id
  form.value = { nombre: p.nombre, categoria: p.categoria, stockMin: p.stockMin }
  dialog.value = true
}
const save = () => {
  if (!valid.value) return
  if (editingId.value) {
    store.update(editingId.value, form.value)
    snackText.value = 'Producto actualizado'
  } else {
    store.add(form.value)
    snackText.value = 'Producto creado'
  }
  dialog.value = false
  snack.value = true
}
const askDelete = (p) => { toDelete.value = p; confirmDelete.value = true }
const doDelete = () => {
  if (!toDelete.value) return
  store.remove(toDelete.value.id)
  confirmDelete.value = false
  toDelete.value = null
  snackText.value = 'Producto eliminado'
  snack.value = true
}

const headers = [
  { title: 'Nombre', value: 'nombre' },
  { title: 'Categoría', value: 'categoria' },
  { title: 'Stock mín.', value: 'stockMin', align: 'end' },
  { title: 'Saldo', value: 'saldo', align: 'end' },
  { title: 'Estado', value: 'alerta', sortable: false },
  { title: 'Activo', value: 'activo', sortable: false },
  { title: 'Acciones', value: 'actions', sortable: false, align: 'end' },
]
</script>

<template>
  <PageCard>
    <!-- Título -->
    <template #title>
      <div class="d-flex align-center" style="gap:10px;">
        <v-icon color="primary">mdi-package-variant</v-icon>
        <span>Productos</span>

        <!-- KPIs -->
        <v-chip class="ml-4" size="small" color="primary" variant="tonal" prepend-icon="mdi-counter">
          Total: {{ kpis.total }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="error" variant="tonal" prepend-icon="mdi-alert">
          Bajo stock: {{ kpis.bajos }}
        </v-chip>
        <v-chip class="ml-2" size="small" color="success" variant="tonal" prepend-icon="mdi-check-circle">
          Activos: {{ kpis.activos }}
        </v-chip>
      </div>
    </template>

    <!-- Acciones -->
    <template #actions>
      <v-text-field
        v-model="search"
        density="comfortable"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar por nombre o categoría"
        hide-details
        style="max-width: 320px;"
      />
      <v-btn class="ml-2" prepend-icon="mdi-plus" @click="openNew">Nuevo</v-btn>
    </template>

    <!-- Tabla -->
    <v-data-table
      :headers="headers"
      :items="items"
      items-per-page="10"
      hover
      fixed-header
      class="rounded-xl"
    >
      <!-- Categoría como badge -->
      <template #item.categoria="{ item }">
        <v-chip size="small" variant="tonal" color="secondary">
          {{ item.categoria || '—' }}
        </v-chip>
      </template>

      <!-- Números alineados -->
      <template #item.stockMin="{ item }">
        <div class="text-right">{{ Number(item.stockMin || 0) }}</div>
      </template>
      <template #item.saldo="{ item }">
        <div class="text-right">{{ Number(item.saldo || 0) }}</div>
      </template>

      <!-- Estado (bajo stock / ok) -->
      <template #item.alerta="{ item }">
        <v-chip
          v-if="item.bajo"
          color="error"
          variant="flat"
          size="small"
          prepend-icon="mdi-alert"
        >Bajo stock</v-chip>
        <v-chip
          v-else
          color="success"
          variant="tonal"
          size="small"
          prepend-icon="mdi-check"
        >OK</v-chip>
      </template>

      <!-- Activo como badge -->
      <template #item.activo="{ item }">
        <v-chip
          :color="item.activo ? 'success' : 'secondary'"
          :variant="item.activo ? 'tonal' : 'text'"
          size="small"
          prepend-icon="mdi-circle-small"
        >
          {{ item.activo ? 'Sí' : 'No' }}
        </v-chip>
      </template>

      <!-- Acciones -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-end" style="gap:6px;">
          <v-btn icon size="small" variant="text" @click="openEdit(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="askDelete(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>

      <!-- Estado vacío elegante -->
      <template #no-data>
        <div class="text-center py-10">
          <v-icon size="56" color="secondary" class="mb-2">mdi-database-off</v-icon>
          <div class="text-h6 mb-1">Sin productos</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Crea tu primer producto para empezar a registrar movimientos.
          </div>
          <v-btn prepend-icon="mdi-plus" @click="openNew">Nuevo producto</v-btn>
        </div>
      </template>
    </v-data-table>
  </PageCard>

  <!-- Diálogo Crear/Editar -->
  <v-dialog v-model="dialog" max-width="520">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-medium">
        {{ editingId ? 'Editar' : 'Nuevo' }} producto
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field v-model="form.nombre" label="Nombre" :rules="[v => !!v || 'Requerido']"/>
          <v-text-field v-model="form.categoria" label="Categoría" placeholder="Insumo, Repuesto…"/>
          <v-text-field v-model.number="form.stockMin" label="Stock mínimo" type="number" min="0"/>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn color="primary" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Confirmación de borrado -->
  <v-dialog v-model="confirmDelete" max-width="480">
    <v-card>
      <v-card-title class="text-subtitle-1">Eliminar producto</v-card-title>
      <v-card-text>
        ¿Seguro que deseas eliminar
        <b>{{ toDelete?.nombre }}</b>?
        Esta acción no se puede deshacer.
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
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
