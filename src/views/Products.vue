<script setup lang="ts">
import type { Product } from '@/types/product'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'

const route = useRoute()
const router = useRouter()

const API_BASE_URL = 'http://localhost:3000/api'

// Search keyword from URL
const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '')

// Category filter
const selectedCategory = ref('All')

// Manufacturer filter from URL
const selectedManufacturer = ref(
  typeof route.query.manufacturer === 'string' ? route.query.manufacturer : 'All',
)

// API state
interface ApiProduct {
  id: number
  partNumber?: string
  part_number?: string
  manufacturer?: string
  manufacturerName?: string
  manufacturer_name?: string
  category?: string
  categoryName?: string
  category_name?: string
  package?: string
  title?: string
  titleEn?: string
  title_en?: string
  titleZh?: string
  title_zh?: string
  description?: string
  descriptionEn?: string
  description_en?: string
  descriptionZh?: string
  description_zh?: string
  features?: string[]
  applications?: string[]
  datasheet?: string
  datasheetUrl?: string
  datasheet_url?: string
  status?: 'In Stock' | 'Available' | 'Request Quote' | 'Discontinued'
}

interface ApiManufacturer {
  id: number
  name?: string
  nameEn?: string
  name_en?: string
}

const products = ref<Product[]>([])
const loading = ref(false)
const errorMessage = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(12)
const totalProducts = ref(0)
const totalPages = ref(1)

// Categories
const categories = [
  { label: 'All', value: 'All' },
  { label: 'MCU', value: 'mcu' },
  { label: 'Analog IC', value: 'analog-ic' },
  { label: 'Power Management', value: 'power-management' },
  { label: 'Communication IC', value: 'communication-ic' },
  { label: 'DSP / DSC', value: 'dsp-dsc' },
]

// Manufacturers
const manufacturers = ref<string[]>(['All'])

/**
 * Convert backend product data to the ProductCard expected structure.
 *
 * Backend fields are converted to the existing frontend Product structure.
 * ProductCard.vue does not need to be changed.
 */
function mapProduct(product: ApiProduct): Product {
  const manufacturer =
    product.manufacturer ||
    product.manufacturerName ||
    product.manufacturer_name ||
    ''

  const category =
    product.category ||
    product.categoryName ||
    product.category_name ||
    ''

  return {
    id: String(product.id),
    partNumber: product.partNumber || product.part_number || '',
    manufacturer,
    category: category as Product['category'],
    package: product.package || '',
    title:
      product.title ||
      product.titleEn ||
      product.title_en ||
      product.titleZh ||
      product.title_zh ||
      '',
    description:
      product.description ||
      product.descriptionEn ||
      product.description_en ||
      product.descriptionZh ||
      product.description_zh ||
      '',
    features: Array.isArray(product.features) ? product.features : [],
    applications: Array.isArray(product.applications) ? product.applications : [],
    datasheet:
      product.datasheet ||
      product.datasheetUrl ||
      product.datasheet_url ||
      '',
    status: product.status || 'Available',
  }
}

/**
 * Load products from backend API
 */
async function fetchProducts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams()

    if (searchQuery.value.trim()) {
      params.set('search', searchQuery.value.trim())
    }

    if (selectedManufacturer.value !== 'All') {
      params.set('manufacturer', selectedManufacturer.value)
    }

    if (selectedCategory.value !== 'All') {
      params.set('category', selectedCategory.value)
    }

    params.set('page', String(currentPage.value))
    params.set('pageSize', String(pageSize.value))

    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch products')
    }

    const rawProducts = Array.isArray(result.data) ? result.data : []

    products.value = rawProducts.map(mapProduct)

    // Pagination information returned by backend
    if (result.pagination) {
      currentPage.value = Number(result.pagination.page || 1)
      pageSize.value = Number(result.pagination.pageSize || 12)
      totalProducts.value = Number(result.pagination.total || 0)
      totalPages.value = Number(result.pagination.totalPages || 1)
    } else {
      totalProducts.value = products.value.length
      totalPages.value = products.value.length > 0 ? 1 : 1
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)

    products.value = []
    totalProducts.value = 0
    totalPages.value = 1

    errorMessage.value = 'Failed to fetch products'
  } finally {
    loading.value = false
  }
}

/**
 * Load manufacturers from backend API
 */
async function fetchManufacturers() {
  try {
    const response = await fetch(`${API_BASE_URL}/manufacturers`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success || !Array.isArray(result.data)) {
      return
    }

    manufacturers.value = [
      'All',
      ...result.data
        .map((manufacturer: ApiManufacturer) => {
          return (
            manufacturer.name ||
            manufacturer.nameEn ||
            manufacturer.name_en ||
            ''
          )
        })
        .filter(Boolean),
    ]
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
  }
}

// Search button
function searchProducts() {
  currentPage.value = 1

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

  fetchProducts()
}

// Select category
function selectCategory(category: string) {
  selectedCategory.value = category
  currentPage.value = 1

  fetchProducts()
}

// Select manufacturer
function selectManufacturer(manufacturer: string) {
  selectedManufacturer.value = manufacturer
  currentPage.value = 1

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

  fetchProducts()
}

// Initial load
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchManufacturers(),
  ])
})

// Watch URL query changes
watch(
  () => route.query.search,
  (value) => {
    searchQuery.value = typeof value === 'string' ? value : ''
  },
)

// Watch search query from route
watch(
  () => route.query.manufacturer,
  (value) => {
    selectedManufacturer.value =
      typeof value === 'string' ? value : 'All'
  },
)

// Pagination
function previousPage() {
  if (currentPage.value <= 1) {
    return
  }

  currentPage.value -= 1
  fetchProducts()
}

function nextPage() {
  if (currentPage.value >= totalPages.value) {
    return
  }

  currentPage.value += 1
  fetchProducts()
}

// Products are already filtered and paginated by backend.
const filteredProducts = computed(() => products.value)
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
                :key="category.value"
                type="button"
                class="w-full rounded-lg px-3 py-2.5 text-left text-sm transition"
                :class="
                  selectedCategory === category.value
                    ? 'bg-blue-600 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                "
                @click="selectCategory(category.value)"
              >
                {{
                  category.value === 'All'
                    ? $t('products.all')
                    : category.value === 'analog-ic'
                      ? $t('products.analogIC')
                      : category.value === 'power-management'
                        ? $t('products.powerManagement')
                        : category.value === 'communication-ic'
                          ? $t('products.communicationIC')
                          : category.value === 'dsp-dsc'
                            ? $t('products.dspDsc')
                            : category.label
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
                {{ totalProducts }}
                {{ $t('products.found') }}
              </p>
            </div>
          </div>

          <!-- Cards -->
          <div
            v-if="!loading && filteredProducts.length"
            class="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <ProductCard
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
            />
          </div>

          <!-- Loading -->
          <div
            v-else-if="loading"
            class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
          >
            <p class="text-sm text-slate-500">
              Loading products...
            </p>
          </div>

          <!-- Error -->
          <div
            v-else-if="errorMessage"
            class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
          >
            <h3 class="font-semibold text-slate-900">
              Failed to load products
            </h3>

            <p class="mt-2 text-sm text-slate-500">
              {{ errorMessage }}
            </p>
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

          <!-- Pagination -->
          <div
            v-if="totalPages > 1 && !loading"
            class="mt-8 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage <= 1"
              @click="previousPage"
            >
              Previous
            </button>

            <span class="text-sm text-slate-500">
              Page {{ currentPage }} / {{ totalPages }}
            </span>

            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage >= totalPages"
              @click="nextPage"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
