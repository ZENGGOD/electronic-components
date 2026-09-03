<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

interface Manufacturer {
  id: number
  name: string
  shortName?: string
  logo?: string | null
  website?: string | null
  description?: string | null
  productCount?: number
}

interface ManufacturersResponse {
  success?: boolean
  message?: string
  data?: Manufacturer[]
}

const router = useRouter()

const manufacturers = ref<Manufacturer[]>([])
const loading = ref(true)
const error = ref('')

async function fetchManufacturers() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/manufacturers')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result: ManufacturersResponse = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch manufacturers')
    }

    manufacturers.value = Array.isArray(result.data)
      ? result.data
      : []
  } catch (err: unknown) {
    console.error('Failed to fetch manufacturers:', err)

    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Failed to fetch manufacturers'
    }

    manufacturers.value = []
  } finally {
    loading.value = false
  }
}

function viewManufacturer(name: string) {
  router.push({
    path: '/products',
    query: {
      manufacturer: name,
    },
  })
}

onMounted(() => {
  fetchManufacturers()
})
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Header -->
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
          {{ $t('manufacturers.label') }}
        </p>

        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {{ $t('manufacturers.title') }}
        </h1>

        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-500">
          {{ $t('manufacturers.description') }}
        </p>
      </div>
    </section>

    <!-- Manufacturers -->
    <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <!-- Loading -->
      <div
        v-if="loading"
        class="rounded-xl border border-slate-200 bg-white p-12 text-center"
      >
        <p class="text-sm text-slate-500">
          Loading manufacturers...
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-200 bg-white p-12 text-center"
      >
        <h2 class="font-semibold text-red-600">
          Failed to load manufacturers
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          {{ error }}
        </p>

        <button
          type="button"
          class="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          @click="fetchManufacturers"
        >
          Retry
        </button>
      </div>

      <!-- Manufacturers -->
      <div
        v-else-if="manufacturers.length"
        class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <button
          v-for="manufacturer in manufacturers"
          :key="manufacturer.id"
          type="button"
          class="group rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          @click="viewManufacturer(manufacturer.name)"
        >
          <!-- Logo -->
          <div
            class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-sm font-bold text-white"
          >
            <img
              v-if="manufacturer.logo"
              :src="manufacturer.logo"
              :alt="manufacturer.name"
              class="h-full w-full object-contain"
            />

            <span v-else>
              {{ manufacturer.name.charAt(0) }}
            </span>
          </div>

          <!-- Name -->
          <h2 class="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600">
            {{ manufacturer.name }}
          </h2>

          <!-- Products -->
          <p class="mt-2 text-sm text-slate-500">
            {{ manufacturer.productCount ?? 0 }}
            {{ $t('manufacturers.products') }}
          </p>

          <!-- Link -->
          <div class="mt-5 text-sm font-semibold text-blue-600">
            {{ $t('manufacturers.viewProducts') }} →
          </div>
        </button>
      </div>

      <!-- Empty -->
      <div
        v-else
        class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
      >
        <h2 class="font-semibold text-slate-900">
          {{ $t('manufacturers.noManufacturers') }}
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          {{ $t('manufacturers.noManufacturersDescription') }}
        </p>
      </div>
    </section>
  </main>
</template>
