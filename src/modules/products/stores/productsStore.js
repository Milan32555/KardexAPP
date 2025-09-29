import { defineStore } from 'pinia'
import { load, save, uid } from '../../../utils/storage'

export const useProductsStore = defineStore('products', 
    {
  state: () => ({
    items: load('products', [
      { id: uid('p'), nombre: 'Alimento 32%', categoria: 'Insumo', stockMin: 10, activo: true },
      { id: uid('p'), nombre: 'Alimento 24%', categoria: 'Insumo', stockMin: 8, activo: true },
    ]),
  }),
  actions: 
  {
    add(product)
    {
      this.items.push({ id: uid('p'), activo: true, ...product })
      save('products', this.items)
    },
    update(id, patch) 
    {
      const i = this.items.findIndex(p => p.id === id)
      if (i >= 0) { this.items[i] = { ...this.items[i], ...patch }; save('products', this.items) }
    },
    remove(id) 
    {
      this.items = this.items.filter(p => p.id !== id)
      save('products', this.items)
    },
  },
})
