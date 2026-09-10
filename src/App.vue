<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'

const route = useRoute()

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})
</script>

<template>
  <div class="min-h-screen bg-white">

    <!-- 普通网站 Header -->
    <Header v-if="!isAdminRoute" />

    <!-- Page Content -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- 普通网站 Footer -->
    <Footer v-if="!isAdminRoute" />

  </div>
</template>

