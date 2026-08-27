import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
    },

    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/Products.vue'),
    },
    {
      path: '/products/:partNumber',
      name: 'product-detail',
      component: () => import('@/views/ProductDetail.vue'),
    },
    {
      path: '/request-quote',
      name: 'request-quote',
      component: () => import('@/views/RequestQuote.vue'),
    },
    {
      path: '/manufacturers',
      name: 'manufacturers',
      component: () => import('@/views/Manufacturers.vue'),
    },
    {
      path: '/technical',
      name: 'technical',
      component: () => import('@/views/Technical.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue'),
    },

    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/Contact.vue'),
    },
  ],
})

export default router
