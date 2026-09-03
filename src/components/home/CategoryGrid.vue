<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Category {
  id: number
  nameZh: string
  nameEn: string
  slug: string
  descriptionZh?: string | null
  descriptionEn?: string | null
  icon?: string | null
}

interface CategoriesResponse {
  success?: boolean
  message?: string
  data?: Category[]
}

const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref('')

async function fetchCategories() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/categories')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result: CategoriesResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch categories')
    }

    categories.value = Array.isArray(result.data)
      ? result.data
      : []
  } catch (err: unknown) {
    console.error('Failed to fetch categories:', err)

    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Failed to fetch categories'
    }

    categories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

function getCategoryIcon(slug: string) {
  const icons: Record<string, string> = {
    mcu: 'MCU',
    'analog-ic': 'A',
    'power-management': 'PWR',
    'communication-ic': 'CAN',
    'dsp-dsc': 'DSP',
    'industrial-control': 'IND',
  }

  return icons[slug] || 'IC'
}
</script>

<template>
  <section class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mb-12 flex items-end justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Product Categories
          </p>

          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Explore Our Components
          </h2>

          <p class="mt-4 max-w-2xl text-slate-500">
            Browse electronic components by product category and quickly find the right solution for
            your application.
          </p>
        </div>

        <RouterLink
          to="/products"
          class="hidden text-sm font-semibold text-blue-600 hover:text-blue-700 sm:block"
        >
          View All Products →
        </RouterLink>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-12 text-center"
      >
        <p class="text-sm text-slate-500">
          Loading categories...
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-white p-12 text-center"
      >
        <h2 class="font-semibold text-red-600">
          Failed to load categories
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          {{ error }}
        </p>

        <button
          type="button"
          class="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          @click="fetchCategories"
        >
          Retry
        </button>
      </div>

      <!-- Categories -->
      <div
        v-else-if="categories.length"
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <RouterLink
          v-for="category in categories"
          :key="category.id"
          :to="`/products?category=${encodeURIComponent(category.slug)}`"
          class="group rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
        >
          <!-- Icon -->
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
          >
            <span class="text-xl font-bold">
              {{ getCategoryIcon(category.slug) }}
            </span>
          </div>

          <!-- Name -->
          <h3 class="mt-5 font-semibold text-slate-900 group-hover:text-blue-600">
            {{ category.nameEn }}
          </h3>

          <!-- Description -->
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ category.descriptionEn || category.nameEn }}
          </p>

          <!-- Link -->
          <div class="mt-5 text-sm font-medium text-blue-600 transition group-hover:translate-x-1">
            Explore →
          </div>
        </RouterLink>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
      >
        <h2 class="font-semibold text-slate-900">
          No categories available
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          Categories will appear here once they are available.
        </p>
      </div>
    </div>
  </section>
</template>
