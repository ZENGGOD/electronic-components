<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

interface ApiProductDetail {
  id: number
  partNumber: string
  package: string | null

  titleZh: string
  titleEn: string

  descriptionZh: string | null
  descriptionEn: string | null

  status: string

  stockQuantity: number | null
  unit: string | null

  datasheetUrl: string | null
  imageUrl: string | null

  isFeatured: number
  sortOrder: number

  createdAt: string
  updatedAt: string

  manufacturerId: number
  manufacturer: string

  categoryId: number
  category: string
}

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()

const product = ref<ApiProductDetail | null>(null)
const loading = ref(false)
const error = ref('')

const partNumber = computed(() => {
  return typeof route.params.partNumber === 'string'
    ? route.params.partNumber
    : ''
})

const API_BASE_URL = 'http://localhost:3000'

/**
 * 当前语言
 */
const isChinese = computed(() => {
  return locale.value === 'zh'
})

/**
 * 当前产品标题
 */
const productTitle = computed(() => {
  if (!product.value) return ''

  return isChinese.value
    ? product.value.titleZh
    : product.value.titleEn
})

/**
 * 当前产品描述
 */
const productDescription = computed(() => {
  if (!product.value) return ''

  return isChinese.value
    ? product.value.descriptionZh
    : product.value.descriptionEn
})

/**
 * 分类显示
 */
const displayCategory = computed(() => {
  if (!product.value) return ''

  if (product.value.category === 'MCU 与微控制器') {
    return 'MCU'
  }

  if (product.value.category === '模拟 IC') {
    return isChinese.value ? '模拟 IC' : 'Analog IC'
  }

  if (product.value.category === '电源管理') {
    return isChinese.value ? '电源管理' : 'Power Management'
  }

  if (product.value.category === '通信 IC') {
    return isChinese.value ? '通信 IC' : 'Communication IC'
  }

  if (product.value.category === 'DSP / DSC') {
    return 'DSP / DSC'
  }

  if (product.value.category === '工业控制') {
    return isChinese.value ? '工业控制' : 'Industrial Control'
  }

  return product.value.category
})

/**
 * 状态国际化
 *
 * 数据库字段：
 * products.status
 *
 * In Stock       → 有库存
 * Available      → 可供货
 * Request Quote  → 询价
 * Discontinued   → 已停产
 */
const displayStatus = computed(() => {
  if (!product.value) return ''

  const statusMap: Record<string, string> = {
    'In Stock': isChinese.value ? '有库存' : 'In Stock',
    Available: isChinese.value ? '可供货' : 'Available',
    'Request Quote': isChinese.value ? '询价' : 'Request Quote',
    Discontinued: isChinese.value ? '已停产' : 'Discontinued',
  }

  return statusMap[product.value.status] || product.value.status
})

/**
 * 状态样式
 */
const statusClass = computed(() => {
  if (!product.value) {
    return ''
  }

  switch (product.value.status) {
    case 'In Stock':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'

    case 'Available':
      return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'

    case 'Request Quote':
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'

    case 'Discontinued':
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'

    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
  }
})

/**
 * 获取产品详情
 */
async function fetchProduct() {
  const keyword = partNumber.value.trim()

  if (!keyword) {
    product.value = null
    error.value = 'Product not found'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/products/${encodeURIComponent(keyword)}`,
    )

    const result = await response.json()

    if (!response.ok || !result.success || !result.data) {
      product.value = null
      error.value = result.message || 'Product not found'
      return
    }

    product.value = result.data
  } catch (err) {
    console.error('Failed to fetch product:', err)

    product.value = null
    error.value = 'Failed to load product information'
  } finally {
    loading.value = false
  }
}

/**
 * 返回产品列表
 */
function backToProducts() {
  router.push('/products')
}

/**
 * 请求报价
 */
function requestQuote() {
  if (!product.value) return

  router.push({
    path: '/request-quote',
    query: {
      product: product.value.partNumber,
    },
  })
}

/**
 * 打开 Datasheet
 */
function openDatasheet() {
  if (!product.value?.datasheetUrl) return

  window.open(
    product.value.datasheetUrl,
    '_blank',
    'noopener,noreferrer',
  )
}

/**
 * 根据数据库 stock_quantity 判断库存
 *
 * stock_quantity > 0
 *   → 有库存 / In Stock
 *
 * stock_quantity = 0
 *   → 无库存 / Out of Stock
 *
 * stock_quantity = NULL
 *   → 无库存 / Out of Stock
 */
const stockStatus = computed(() => {
  if (!product.value) return ''

  if (
    product.value.stockQuantity !== null &&
    product.value.stockQuantity !== undefined &&
    product.value.stockQuantity > 0
  ) {
    return isChinese.value ? '有库存' : 'In Stock'
  }

  return isChinese.value ? '无库存' : 'Out of Stock'
})

/**
 * 页面首次加载产品详情
 */
onMounted(() => {
  fetchProduct()
})

/**
 * 产品型号发生变化时重新获取产品
 */
watch(
  () => route.params.partNumber,
  () => {
    fetchProduct()
  },
)
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- ========================================================= -->
    <!-- Loading -->
    <!-- ========================================================= -->
    <section
      v-if="loading"
      class="mx-auto max-w-7xl px-6 py-16 lg:px-8"
    >
      <div
        class="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <div
          class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
        ></div>

        <p class="mt-5 text-sm font-medium text-slate-500">
          {{ $t('productDetail.loading') }}
        </p>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- Not Found -->
    <!-- ========================================================= -->
    <section
      v-else-if="!product"
      class="mx-auto max-w-7xl px-6 py-16 lg:px-8"
    >
      <div
        class="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
      >
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
        >
          <svg
            class="h-8 w-8 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.5m0 3.5h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            />
          </svg>
        </div>

        <h1 class="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          {{ $t('productDetail.notFound') }}
        </h1>

        <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          {{
            error ||
            $t('productDetail.notFoundDescription')
          }}
        </p>

        <button
          type="button"
          class="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          @click="backToProducts"
        >
          {{ $t('productDetail.backToProducts') }}
        </button>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- Product -->
    <!-- ========================================================= -->
    <template v-else>
      <!-- Breadcrumb -->
      <div class="border-b border-slate-200 bg-white">
        <div
          class="mx-auto flex max-w-7xl items-center gap-2 px-6 py-4 text-sm lg:px-8"
        >
          <RouterLink
            to="/"
            class="text-slate-500 transition hover:text-blue-600"
          >
            {{ $t('productDetail.breadcrumbHome') }}
          </RouterLink>

          <svg
            class="h-4 w-4 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m9 18 6-6-6-6"
            />
          </svg>

          <RouterLink
            to="/products"
            class="text-slate-500 transition hover:text-blue-600"
          >
            {{ $t('productDetail.breadcrumbProducts') }}
          </RouterLink>

          <svg
            class="h-4 w-4 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m9 18 6-6-6-6"
            />
          </svg>

          <span class="font-medium text-slate-900">
            {{ product.partNumber }}
          </span>
        </div>
      </div>

      <!-- Main -->
      <main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div class="grid gap-8 lg:grid-cols-3">
          <!-- ===================================================== -->
          <!-- LEFT -->
          <!-- ===================================================== -->
          <div class="space-y-8 lg:col-span-2">
            <!-- Product Hero -->
            <section
              class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div class="p-7 lg:p-9">
                <div class="flex flex-wrap items-center gap-3">
                  <span
                    class="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {{ product.manufacturer }}
                  </span>

                  <span
                    class="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    {{ displayCategory }}
                  </span>

                  <span
                    class="rounded-md px-3 py-1.5 text-xs font-semibold"
                    :class="statusClass"
                  >
                    {{ displayStatus }}
                  </span>
                </div>

                <div class="mt-7">
                  <p
                    class="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600"
                  >
                    {{ $t('productDetail.product') }}
                  </p>

                  <h1
                    class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                  >
                    {{ product.partNumber }}
                  </h1>

                  <p
                    class="mt-4 text-lg font-semibold leading-8 text-slate-700"
                  >
                    {{ productTitle }}
                  </p>
                </div>

                <!-- Image -->
                <div
                  v-if="product.imageUrl"
                  class="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img
                    :src="product.imageUrl"
                    :alt="product.partNumber"
                    class="h-auto max-h-[420px] w-full object-contain"
                  />
                </div>

                <!-- No Image -->
                <div
                  v-else
                  class="mt-8 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50"
                >
                  <div class="text-center">
                    <div
                      class="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
                    >
                      <svg
                        class="h-7 w-7 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                      >
                        <rect
                          width="18"
                          height="14"
                          x="3"
                          y="5"
                          rx="2"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="m3 15 4-4a2 2 0 0 1 2.83 0L13 14l2-2a2 2 0 0 1 2.83 0L21 15"
                        />
                        <circle
                          cx="8.5"
                          cy="9"
                          r="1"
                        />
                      </svg>
                    </div>

                    <p class="mt-4 text-sm font-medium text-slate-600">
                      {{ $t('productDetail.imageUnavailable') }}
                    </p>

                    <p class="mt-1 text-xs text-slate-400">
                      {{ $t('productDetail.imageComingSoon') }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <!-- ================================================= -->
            <!-- Specifications -->
            <!-- ================================================= -->
            <section
              class="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div class="border-b border-slate-100 px-7 py-5 lg:px-8">
                <h2 class="text-lg font-bold text-slate-900">
                  {{ $t('productDetail.specifications') }}
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                  {{ $t('productDetail.specificationsDescription') }}
                </p>
              </div>

              <div class="grid gap-x-8 gap-y-6 p-7 sm:grid-cols-2 lg:p-8">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.partNumber') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ product.partNumber }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.manufacturer') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ product.manufacturer }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.category') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ displayCategory }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.package') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ product.package || $t('productDetail.notSpecified') }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.availability') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ displayStatus }}
                  </p>
                </div>

                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {{ $t('productDetail.stock') }}
                  </p>

                  <p class="mt-2 text-sm font-semibold text-slate-900">
                    {{ stockStatus }}
                  </p>
                </div>
              </div>
            </section>

            <!-- ================================================= -->
            <!-- Product Description -->
            <!-- ================================================= -->
            <section
              class="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div class="border-b border-slate-100 px-7 py-5 lg:px-8">
                <h2 class="text-lg font-bold text-slate-900">
                  {{ $t('productDetail.description') }}
                </h2>
              </div>

              <div class="p-7 lg:p-8">
                <p
                  v-if="productDescription"
                  class="text-sm leading-7 text-slate-600"
                >
                  {{ productDescription }}
                </p>

                <p
                  v-else
                  class="text-sm leading-7 text-slate-500"
                >
                  {{ $t('productDetail.noDescription') }}
                </p>
              </div>
            </section>

            <!-- ================================================= -->
            <!-- Technical Information -->
            <!-- ================================================= -->
            <section
              class="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div class="border-b border-slate-100 px-7 py-5 lg:px-8">
                <h2 class="text-lg font-bold text-slate-900">
                  {{ $t('productDetail.technicalInformation') }}
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                  {{ $t('productDetail.technicalInformationDescription') }}
                </p>
              </div>

              <div class="p-7 lg:p-8">
                <div class="overflow-hidden rounded-xl border border-slate-200">
                  <div
                    class="grid grid-cols-1 border-b border-slate-200 bg-slate-50 sm:grid-cols-2"
                  >
                    <div
                      class="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-500 sm:border-b-0 sm:border-r"
                    >
                      {{ $t('productDetail.manufacturer') }}
                    </div>

                    <div
                      class="px-5 py-4 text-sm font-semibold text-slate-900"
                    >
                      {{ product.manufacturer }}
                    </div>
                  </div>

                  <div
                    class="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2"
                  >
                    <div
                      class="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-500 sm:border-b-0 sm:border-r"
                    >
                      {{ $t('productDetail.partNumber') }}
                    </div>

                    <div
                      class="px-5 py-4 text-sm font-semibold text-slate-900"
                    >
                      {{ product.partNumber }}
                    </div>
                  </div>

                  <div
                    class="grid grid-cols-1 border-b border-slate-200 bg-slate-50 sm:grid-cols-2"
                  >
                    <div
                      class="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-500 sm:border-b-0 sm:border-r"
                    >
                      {{ $t('productDetail.package') }}
                    </div>

                    <div
                      class="px-5 py-4 text-sm font-semibold text-slate-900"
                    >
                      {{ product.package || $t('productDetail.notSpecified') }}
                    </div>
                  </div>

                  <div
                    class="grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2"
                  >
                    <div
                      class="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-500 sm:border-b-0 sm:border-r"
                    >
                      {{ $t('productDetail.category') }}
                    </div>

                    <div
                      class="px-5 py-4 text-sm font-semibold text-slate-900"
                    >
                      {{ displayCategory }}
                    </div>
                  </div>

                  <div
                    class="grid grid-cols-1 bg-slate-50 sm:grid-cols-2"
                  >
                    <div
                      class="border-b border-slate-200 px-5 py-4 text-sm font-medium text-slate-500 sm:border-b-0 sm:border-r"
                    >
                      {{ $t('productDetail.availability') }}
                    </div>

                    <div
                      class="px-5 py-4 text-sm font-semibold text-slate-900"
                    >
                      {{ displayStatus }}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- ===================================================== -->
          <!-- RIGHT SIDEBAR -->
          <!-- 样式保持原样，不修改 -->
          <!-- ===================================================== -->
          <aside class="lg:sticky lg:top-28 lg:h-fit">
            <div
              class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 class="font-bold text-slate-900">
                {{ $t('productDetail.interested') }}
              </h2>

              <p class="mt-3 text-sm leading-6 text-slate-500">
                {{ $t('productDetail.inquiryDescription') }}
              </p>

              <button
                type="button"
                class="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                @click="requestQuote"
              >
                {{ $t('nav.requestQuote') }}
              </button>

              <div class="mt-6 border-t border-slate-100 pt-6">
                <div class="flex justify-between gap-4 text-sm">
                  <span class="text-slate-500">
                    {{ $t('productDetail.partNumber') }}
                  </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ product.partNumber }}
                  </span>
                </div>

                <div class="mt-4 flex justify-between gap-4 text-sm">
                  <span class="text-slate-500">
                    {{ $t('productDetail.manufacturer') }}
                  </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ product.manufacturer }}
                  </span>
                </div>

                <div class="mt-4 flex justify-between gap-4 text-sm">
                  <span class="text-slate-500">
                    {{ $t('productDetail.category') }}
                  </span>

                  <span class="text-right font-semibold text-slate-900">
                    {{ displayCategory }}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </template>
  </div>
</template>
