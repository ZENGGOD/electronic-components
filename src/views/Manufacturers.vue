<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import products from '@/data/products'

const router = useRouter()

const manufacturers = computed(() => {
  const map = new Map<string, number>()

  products.forEach((product) => {
    const name = product.manufacturer

    map.set(name, (map.get(name) || 0) + 1)
  })

  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function viewManufacturer(name: string) {
  router.push({
    path: '/products',
    query: {
      manufacturer: name,
    },
  })
}
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
      <div v-if="manufacturers.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="manufacturer in manufacturers"
          :key="manufacturer.name"
          type="button"
          class="group rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          @click="viewManufacturer(manufacturer.name)"
        >
          <!-- Logo placeholder -->
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white"
          >
            {{ manufacturer.name.charAt(0) }}
          </div>

          <!-- Name -->
          <h2 class="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600">
            {{ manufacturer.name }}
          </h2>

          <!-- Products -->
          <p class="mt-2 text-sm text-slate-500">
            {{ manufacturer.count }} {{ $t('manufacturers.products') }}
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
