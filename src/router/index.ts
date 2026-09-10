import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    /*
     * Frontend Routes
     */

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

    /*
     * Admin Login
     */

    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLogin.vue'),
    },

    /*
     * Admin Routes
     */

    {
      path: '/admin',
      component: () => import('@/admin/layouts/AdminLayout.vue'),
      meta: {
        requiresAuth: true,
      },

      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () =>
            import('@/views/admin/AdminDashboard.vue'),
        },

        {
          path: 'products',
          name: 'admin-products',
          component: () =>
            import('@/views/admin/AdminProducts.vue'),
        },

        {
          path: 'manufacturers',
          name: 'admin-manufacturers',
          component: () =>
             import('@/views/admin/AdminManufacturers.vue'),
        },

        {
          path: 'categories',
          name: 'admin-categories',
          component: () =>
             import('@/views/admin/AdminDashboard.vue'),
        },

        {
          path: 'technical',
          name: 'admin-technical',
          component: () =>
            import('@/views/admin/AdminDashboard.vue'),
        },

        {
          path: 'quotes',
          name: 'admin-quotes',
          component: () =>
            import('@/views/admin/AdminQuoteRequests.vue'),
        },

        {
          path: 'messages',
          name: 'admin-messages',
          component: () =>
            import('@/views/admin/AdminMessages.vue'),
        },

        {
          path: 'settings',
          name: 'admin-settings',
          component: () =>
            import('@/views/admin/AdminDashboard.vue'),
        },
      ],
    },
  ],
})

/*
 * Admin Route Guard
 */

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')

  if (to.meta.requiresAuth && !token) {
    return {
      name: 'admin-login',
    }
  }

  if (
    to.name === 'admin-login' &&
    token
  ) {
    return {
      name: 'admin-dashboard',
    }
  }

  return true
})

export default router
