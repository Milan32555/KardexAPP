import { createRouter, createWebHashHistory } from 'vue-router'

const ProductsPage = () => import('../modules/products/pages/ProductsPage.vue')
const MovementsPage = () => import('../modules/movements/pages/MovementsPage.vue')
const KardexPage    = () => import('../modules/kardex/pages/KardexPage.vue')

export const router = createRouter(
{
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/movimientos' },
    { path: '/productos', component: ProductsPage },
    { path: '/movimientos', component: MovementsPage },
    { path: '/kardex', component: KardexPage },
  ],
})
