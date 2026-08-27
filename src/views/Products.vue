<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import products from '@/data/products'

const route = useRoute()
const router = useRouter()

// Search keyword from URL
const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '')

// Category filter
const selectedCategory = ref('All')

// Manufacturer filter from URL
const selectedManufacturer = ref(
  typeof route.query.manufacturer === 'string' ? route.query.manufacturer : 'All',
)

const categories = ['All', 'MCU', 'Analog IC', 'Power Management', 'Communication IC', 'DSP / DSC']

// Automatically get manufacturers from product database
const manufacturers = computed(() => {
  return ['All', ...Array.from(new Set(products.map((product) => product.manufacturer))).sort()]
})

// Filter products
const filteredProducts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  return products.filter((product) => {
    const matchesCategory =
      selectedCategory.value === 'All' || product.category === selectedCategory.value

    const matchesManufacturer =
      selectedManufacturer.value === 'All' || product.manufacturer === selectedManufacturer.value

    const matchesSearch =
      !keyword ||
      product.partNumber.toLowerCase().includes(keyword) ||
      product.manufacturer.toLowerCase().includes(keyword) ||
      product.title.toLowerCase().includes(keyword)

    return matchesCategory && matchesManufacturer && matchesSearch
  })
})

// Search button
function searchProducts() {
  const query: Record<string, string> = {}

  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim()
  }

  if (selectedManufacturer.value !== 'All') {
    query.manufacturer = selectedManufacturer.value
  }

  router.push({
    path: '/products',
    query,
  })
}

// Select category
function selectCategory(category: string) {
  selectedCategory.value = category
}

// Select manufacturer
function selectManufacturer(manufacturer: string) {
  selectedManufacturer.value = manufacturer

  const query: Record<string, string> = {}

  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim()
  }

  if (manufacturer !== 'All') {
    query.manufacturer = manufacturer
  }

  router.push({
    path: '/products',
    query,
  })
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <!-- Header -->
    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <p class="text-sm font-semibold uppercase tracking-widest text-blue-600">
          {{ $t('products.database') }}
        </p>

        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          {{ $t('products.title') }}
        </h1>

        <p class="mt-4 max-w-2xl text-slate-500">
          {{ $t('products.description') }}
        </p>

        <!-- Search -->
        <div
          class="mt-8 flex max-w-3xl overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm"
        >
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('home.searchPlaceholder')"
            class="flex-1 px-5 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            @keyup.enter="searchProducts"
          />

          <button
            type="button"
            class="bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-500"
            @click="searchProducts"
          >
            {{ $t('home.search') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Products -->
    <section class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="grid gap-8 lg:grid-cols-[220px_1fr]">
        <!-- Sidebar -->
        <aside>
          <!-- Categories -->
          <div>
            <h2 class="text-sm font-semibold text-slate-900">
              {{ $t('products.categories') }}
            </h2>

            <div class="mt-4 space-y-1">
              <button
                v-for="category in categories"
                :key="category"
                type="button"
                class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition"
                :class="
                  selectedCategory === category
                    ? 'bg-blue-600 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                "
                @click="selectCategory(category)"
              >
                {{
                  category === 'All'
                    ? $t('products.all')
                    : category === 'Analog IC'
                      ? $t('products.analogIC')
                      : category === 'Power Management'
                        ? $t('products.powerManagement')
                        : category === 'Communication IC'
                          ? $t('products.communicationIC')
                          : category === 'DSP / DSC'
                            ? $t('products.dspDsc')
                            : category
                }}
              </button>
            </div>
          </div>

          <!-- Manufacturers -->
          <div class="mt-10">
            <h2 class="text-sm font-semibold text-slate-900">
              {{ $t('products.manufacturers') }}
            </h2>

            <div class="mt-4 space-y-1">
              <button
                v-for="manufacturer in manufacturers"
                :key="manufacturer"
                type="button"
                class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition"
                :class="
                  selectedManufacturer === manufacturer
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                "
                @click="selectManufacturer(manufacturer)"
              >
                {{ manufacturer === 'All' ? $t('products.allManufacturers') : manufacturer }}
              </button>
            </div>
          </div>
        </aside>

        <!-- Product List -->
        <div>
          <!-- Result Header -->
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-slate-900">
                {{ $t('products.products') }}
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                {{ filteredProducts.length }}
                {{ $t('products.found') }}
              </p>
            </div>
          </div>

          <!-- Cards -->
          <div v-if="filteredProducts.length" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
          </div>

          <!-- Empty -->
          <div
            v-else
            class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
          >
            <h3 class="font-semibold text-slate-900">
              {{ $t('products.noProducts') }}
            </h3>

            <p class="mt-2 text-sm text-slate-500">
              {{ $t('products.noProductsDescription') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
