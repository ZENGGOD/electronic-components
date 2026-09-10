<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

import AdminProductForm from './AdminProductForm.vue'
import AdminProductViewModal from './AdminProductViewModal.vue'

const router = useRouter()

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ProductStatus =
  | 'In Stock'
  | 'Available'
  | 'Request Quote'
  | 'Discontinued'

interface Manufacturer {
  id: number
  name: string
  shortName?: string | null
}

interface Category {
  id: number
  nameZh: string
  nameEn: string
  slug?: string
}

interface Product {
  id: number

  partNumber: string

  titleZh: string

  titleEn: string

  manufacturer: {
    id: number
    name: string
  } | null

  category: {
    id: number
    nameZh: string
    nameEn: string
  } | null

  package: string | null

  descriptionZh: string | null

  descriptionEn: string | null

  status: ProductStatus

  stockQuantity: number | null

  unit: string

  datasheetUrl: string | null

  imageUrl: string | null

  isFeatured: boolean

  sortOrder: number

  createdAt: string

  updatedAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Toast

type ToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

interface ToastState {
  visible: boolean
  type: ToastType
  message: string
}

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

const products = ref<Product[]>([])

const manufacturers =
  ref<Manufacturer[]>([])

const categories =
  ref<Category[]>([])

const loading = ref(false)

const filterLoading = ref(false)

const errorMessage = ref('')

// Search filters

const searchKeyword = ref('')

const selectedManufacturerId =
  ref('')

const selectedCategoryId =
  ref('')

const selectedStatus =
  ref<ProductStatus | ''>('')

// Pagination

const currentPage = ref(1)

const pageSize = ref(10)

const pagination =
  ref<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

// Selected products

const selectedProductIds =
  ref<number[]>([])

// ─────────────────────────────────────────────
// Product Form
// ─────────────────────────────────────────────

const showProductForm =
  ref(false)

const editingProductId =
  ref<number | null>(null)

// ─────────────────────────────────────────────
// Product View Modal
// ─────────────────────────────────────────────

const showProductView =
  ref(false)

const viewingProductId =
  ref<number | null>(null)

// ─────────────────────────────────────────────
// Delete state
// ─────────────────────────────────────────────

const deletingProductId =
  ref<number | null>(null)

const batchDeleting =
  ref(false)

// ─────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────

const toast =
  ref<ToastState>({
    visible: false,
    type: 'success',
    message: '',
  })

let toastTimer:
  ReturnType<typeof setTimeout> | null =
  null

function showToast(
  message: string,
  type: ToastType = 'success',
  duration = 2500,
): void {
  if (toastTimer !== null) {
    clearTimeout(toastTimer)
  }

  toast.value = {
    visible: true,
    type,
    message,
  }

  toastTimer = setTimeout(() => {
    toast.value.visible = false
    toastTimer = null
  }, duration)
}

function hideToast(): void {
  if (toastTimer !== null) {
    clearTimeout(toastTimer)
    toastTimer = null
  }

  toast.value.visible = false
}

function getToastIcon(
  type: ToastType,
): string {
  switch (type) {
    case 'success':
      return '✓'

    case 'error':
      return '×'

    case 'warning':
      return '⚠'

    case 'info':
      return 'i'

    default:
      return 'i'
  }
}

// ─────────────────────────────────────────────
// Computed
// ─────────────────────────────────────────────

const allSelected = computed(() => {
  return (
    products.value.length > 0 &&
    products.value.every((product) =>
      selectedProductIds.value.includes(
        product.id,
      ),
    )
  )
})

const hasSelectedProducts =
  computed(() => {
    return (
      selectedProductIds.value.length >
      0
    )
  })

const visiblePages = computed(() => {
  const totalPages =
    pagination.value.totalPages

  const current =
    pagination.value.page

  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    )
  }

  const pages: (
    | number
    | string
  )[] = []

  if (current <= 4) {
    pages.push(
      1,
      2,
      3,
      4,
      5,
      '...',
      totalPages,
    )

    return pages
  }

  if (
    current >=
    totalPages - 3
  ) {
    pages.push(
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    )

    return pages
  }

  pages.push(
    1,
    '...',
    current - 1,
    current,
    current + 1,
    '...',
    totalPages,
  )

  return pages
})

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

const API_BASE_URL =
  'http://localhost:3000/api'

const SERVER_BASE_URL =
  'http://localhost:3000'

function getToken(): string | null {
  return localStorage.getItem(
    'admin_token',
  )
}

function getAuthHeaders(): HeadersInit {
  const token = getToken()

  return {
    'Content-Type':
      'application/json',

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  }
}

function handleUnauthorized(): void {
  localStorage.removeItem(
    'admin_token',
  )

  localStorage.removeItem(
    'admin_user',
  )

  router.push({
    name: 'admin-login',
  })
}

// ─────────────────────────────────────────────
// Image
// ─────────────────────────────────────────────

function getImageUrl(
  imageUrl: string | null,
): string {
  if (!imageUrl) {
    return ''
  }

  if (
    imageUrl.startsWith(
      'http://',
    ) ||
    imageUrl.startsWith(
      'https://',
    ) ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl
  }

  if (imageUrl.startsWith('/')) {
    return `${SERVER_BASE_URL}${imageUrl}`
  }

  return `${SERVER_BASE_URL}/${imageUrl}`
}

// ─────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────

function getStatusLabel(
  status: ProductStatus,
): string {
  switch (status) {
    case 'In Stock':
      return '有库存'

    case 'Available':
      return '可供应'

    case 'Request Quote':
      return '询价'

    case 'Discontinued':
      return '已停产'

    default:
      return status
  }
}

function getStatusClass(
  status: ProductStatus,
): string {
  switch (status) {
    case 'In Stock':
      return 'status-in-stock'

    case 'Available':
      return 'status-available'

    case 'Request Quote':
      return 'status-request-quote'

    case 'Discontinued':
      return 'status-discontinued'

    default:
      return ''
  }
}

// ─────────────────────────────────────────────
// Load manufacturers
// ─────────────────────────────────────────────

async function fetchManufacturers(): Promise<void> {
  filterLoading.value = true

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/manufacturers`,
        {
          method: 'GET',
          headers:
            getAuthHeaders(),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(
        'Failed to fetch manufacturers',
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          'Failed to fetch manufacturers',
      )
    }

    const data =
      result.data

    if (Array.isArray(data)) {
      manufacturers.value =
        data

      return
    }

    if (
      data &&
      Array.isArray(
        data.manufacturers,
      )
    ) {
      manufacturers.value =
        data.manufacturers
    }
  } catch (error) {
    console.error(
      'Failed to fetch manufacturers:',
      error,
    )
  } finally {
    filterLoading.value = false
  }
}

// ─────────────────────────────────────────────
// Load categories
// ─────────────────────────────────────────────

async function fetchCategories(): Promise<void> {
  filterLoading.value = true

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/categories`,
        {
          method: 'GET',
          headers:
            getAuthHeaders(),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(
        'Failed to fetch categories',
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          'Failed to fetch categories',
      )
    }

    const data =
      result.data

    if (Array.isArray(data)) {
      categories.value =
        data

      return
    }

    if (
      data &&
      Array.isArray(
        data.categories,
      )
    ) {
      categories.value =
        data.categories
    }
  } catch (error) {
    console.error(
      'Failed to fetch categories:',
      error,
    )
  } finally {
    filterLoading.value = false
  }
}

// ─────────────────────────────────────────────
// Load products
// ─────────────────────────────────────────────

async function fetchProducts(): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  loading.value = true

  errorMessage.value = ''

  try {
    const params =
      new URLSearchParams()

    params.set(
      'page',
      String(
        currentPage.value,
      ),
    )

    params.set(
      'pageSize',
      String(pageSize.value),
    )

    if (
      searchKeyword.value.trim()
    ) {
      params.set(
        'search',
        searchKeyword.value.trim(),
      )
    }

    if (
      selectedManufacturerId.value
    ) {
      params.set(
        'manufacturerId',
        selectedManufacturerId.value,
      )
    }

    if (
      selectedCategoryId.value
    ) {
      params.set(
        'categoryId',
        selectedCategoryId.value,
      )
    }

    // 产品状态筛选
    if (selectedStatus.value) {
      params.set(
        'status',
        selectedStatus.value,
      )
    }

    const response =
      await fetch(
        `${API_BASE_URL}/admin/products?${params.toString()}`,
        {
          method: 'GET',
          headers:
            getAuthHeaders(),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`,
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          'Failed to fetch products',
      )
    }

    products.value =
      result.data?.products ??
      []

    pagination.value = {
      page:
        result.data?.pagination
          ?.page ??
        currentPage.value,

      pageSize:
        result.data?.pagination
          ?.pageSize ??
        pageSize.value,

      total:
        result.data?.pagination
          ?.total ??
        0,

      totalPages:
        result.data?.pagination
          ?.totalPages ??
        0,
    }

    selectedProductIds.value =
      []
  } catch (error) {
    console.error(
      'Failed to fetch products:',
      error,
    )

    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取产品列表失败'
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

function handleSearch(): void {
  currentPage.value = 1

  fetchProducts()
}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

function handleReset(): void {
  searchKeyword.value = ''

  selectedManufacturerId.value =
    ''

  selectedCategoryId.value = ''

  selectedStatus.value = ''

  currentPage.value = 1

  selectedProductIds.value = []

  fetchProducts()
}

// ─────────────────────────────────────────────
// Status filter
// ─────────────────────────────────────────────

function handleStatusChange(): void {
  currentPage.value = 1

  selectedProductIds.value = []

  fetchProducts()
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

function goToPage(
  page: number,
): void {
  if (
    page < 1 ||
    page >
      pagination.value
        .totalPages ||
    page === currentPage.value
  ) {
    return
  }

  currentPage.value = page

  fetchProducts()
}

function goToPreviousPage(): void {
  if (currentPage.value <= 1) {
    return
  }

  currentPage.value -= 1

  fetchProducts()
}

function goToNextPage(): void {
  if (
    currentPage.value >=
    pagination.value
      .totalPages
  ) {
    return
  }

  currentPage.value += 1

  fetchProducts()
}

function handlePageSizeChange(): void {
  currentPage.value = 1

  selectedProductIds.value = []

  fetchProducts()
}

// ─────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────

function toggleProductSelection(
  productId: number,
): void {
  const index =
    selectedProductIds.value.indexOf(
      productId,
    )

  if (index === -1) {
    selectedProductIds.value.push(
      productId,
    )
  } else {
    selectedProductIds.value.splice(
      index,
      1,
    )
  }
}

function toggleSelectAll(): void {
  if (allSelected.value) {
    selectedProductIds.value = []

    return
  }

  selectedProductIds.value =
    products.value.map(
      (product) => product.id,
    )
}

// ─────────────────────────────────────────────
// Product actions
// ─────────────────────────────────────────────

function handleViewProduct(
  product: Product,
): void {
  viewingProductId.value =
    product.id

  showProductView.value = true
}

function handleProductViewClose(): void {
  showProductView.value = false

  viewingProductId.value = null
}

// ─────────────────────────────────────────────
// Add product
// ─────────────────────────────────────────────

function handleAddProduct(): void {
  editingProductId.value = null

  showProductForm.value = true
}

// ─────────────────────────────────────────────
// Edit product
// ─────────────────────────────────────────────

function handleEditProduct(
  product: Product,
): void {
  editingProductId.value =
    product.id

  showProductForm.value = true
}

// ─────────────────────────────────────────────
// Product form close
// ─────────────────────────────────────────────

function handleProductFormClose(): void {
  showProductForm.value = false

  editingProductId.value = null
}

// ─────────────────────────────────────────────
// Product form message
// ─────────────────────────────────────────────

function handleProductMessage(
  payload: {
    type: ToastType
    message: string
  },
): void {
  showToast(
    payload.message,
    payload.type,
  )
}

// ─────────────────────────────────────────────
// Product form success
// ─────────────────────────────────────────────

async function handleProductFormSuccess(): Promise<void> {
  const isEdit =
    editingProductId.value !==
    null

  showProductForm.value = false

  editingProductId.value = null

  await fetchProducts()

  if (isEdit) {
    showToast(
      '产品修改成功',
      'success',
    )
  } else {
    showToast(
      '产品新增成功',
      'success',
    )
  }
}

// ─────────────────────────────────────────────
// Delete product
// ─────────────────────────────────────────────

async function handleDeleteProduct(
  product: Product,
): Promise<void> {
  if (
    deletingProductId.value !==
      null ||
    batchDeleting.value
  ) {
    return
  }

  const confirmed =
    window.confirm(
      `确定要删除产品「${product.partNumber}」吗？\n\n删除后无法恢复，请确认。`,
    )

  if (!confirmed) {
    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  deletingProductId.value =
    product.id

  errorMessage.value = ''

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/products/${product.id}`,
        {
          method: 'DELETE',
          headers:
            getAuthHeaders(),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()

      return
    }

    const result =
      await response.json()

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '删除产品失败',
      )
    }

    selectedProductIds.value =
      selectedProductIds.value.filter(
        (id) =>
          id !== product.id,
      )

    if (
      products.value.length ===
        1 &&
      currentPage.value > 1
    ) {
      currentPage.value -= 1
    }

    await fetchProducts()

    showToast(
      `产品「${product.partNumber}」删除成功`,
      'success',
    )
  } catch (error) {
    console.error(
      'Failed to delete product:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '删除产品失败'

    errorMessage.value = message

    showToast(
      message,
      'error',
      3500,
    )
  } finally {
    deletingProductId.value =
      null
  }
}


// ─────────────────────────────────────────────
// Batch delete
// ─────────────────────────────────────────────

async function handleBatchDelete(): Promise<void> {
  if (
    !hasSelectedProducts.value ||
    batchDeleting.value ||
    deletingProductId.value !== null
  ) {
    return
  }

  const selectedIds = [
    ...selectedProductIds.value,
  ]

  const count = selectedIds.length

  const confirmed =
    window.confirm(
      `确定要删除选中的 ${count} 个产品吗？\n\n删除后无法恢复，请确认。`,
    )

  if (!confirmed) {
    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  batchDeleting.value = true

  errorMessage.value = ''

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/products/batch`,
        {
          method: 'DELETE',
          headers:
            getAuthHeaders(),
          body: JSON.stringify({
            ids: selectedIds,
          }),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()

      return
    }

    /*
     * 先读取文本，再尝试解析 JSON。
     *
     * 这样即使后端异常返回 HTML，
     * 也不会再次出现：
     *
     * Unexpected token '<'
     */
    const responseText =
      await response.text()

    let result: {
      success: boolean
      message?: string
      data?: {
        deletedCount?: number
      }
    }

    try {
      result =
        JSON.parse(
          responseText,
        )
    } catch {
      throw new Error(
        `服务器返回了无效响应（HTTP ${response.status}）`,
      )
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '批量删除产品失败',
      )
    }

    const deletedCount =
      result.data?.deletedCount ??
      count

    /*
     * 清空当前选择
     */
    selectedProductIds.value = []

    /*
     * 如果当前页的产品全部被删除，
     * 并且当前不是第一页，
     * 自动返回上一页。
     */
    if (
      products.value.length <=
        count &&
      currentPage.value > 1
    ) {
      currentPage.value -= 1
    }

    /*
     * 重新加载产品列表
     */
    await fetchProducts()

    showToast(
      `成功删除 ${deletedCount} 个产品`,
      'success',
    )
  } catch (error) {
    console.error(
      'Failed to batch delete products:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '批量删除产品失败'

    errorMessage.value = message

    showToast(
      message,
      'error',
      3500,
    )
  } finally {
    batchDeleting.value = false
  }
}


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getCategoryName(
  product: Product,
): string {
  return (
    product.category?.nameZh ||
    product.category?.nameEn ||
    '-'
  )
}

function getManufacturerName(
  product: Product,
): string {
  return (
    product.manufacturer?.name ||
    '-'
  )
}

function formatStock(
  product: Product,
): string {
  if (
    product.stockQuantity ===
      null ||
    product.stockQuantity ===
      undefined
  ) {
    return '-'
  }

  return `${product.stockQuantity.toLocaleString()} ${product.unit || 'pcs'}`
}

function getStartItem(): number {
  if (
    pagination.value.total === 0
  ) {
    return 0
  }

  return (
    (pagination.value.page -
      1) *
      pagination.value
        .pageSize +
    1
  )
}

function getEndItem(): number {
  return Math.min(
    pagination.value.page *
      pagination.value
        .pageSize,
    pagination.value.total,
  )
}

// ─────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    fetchManufacturers(),
    fetchCategories(),
    fetchProducts(),
  ])
})
</script>

<template>
  <!-- Product Form -->
  <AdminProductForm
    v-if="showProductForm"
    :product-id="editingProductId"
    @close="handleProductFormClose"
    @success="handleProductFormSuccess"
    @message="handleProductMessage"
  />

  <!-- Product View Modal -->
  <AdminProductViewModal
    v-if="showProductView"
    :product-id="viewingProductId"
    @close="handleProductViewClose"
  />

  <!-- Product List -->
  <div class="products-page">
    <!-- Toast Notification -->
    <transition name="toast">
      <div
        v-if="toast.visible"
        class="toast-notification"
        :class="`toast-${toast.type}`"
        role="status"
        aria-live="polite"
      >
        <span class="toast-icon">
          {{ getToastIcon(toast.type) }}
        </span>

        <span class="toast-message">
          {{ toast.message }}
        </span>

        <button
          type="button"
          class="toast-close"
          aria-label="关闭提示"
          @click="hideToast"
        >
          ×
        </button>
      </div>
    </transition>

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          产品管理
        </h1>

        <p class="page-description">
          管理电子元器件产品信息
        </p>
      </div>

      <div class="page-actions">
        <button
          type="button"
          class="btn btn-primary"
          @click="handleAddProduct"
        >
          <span class="btn-icon">
            ＋
          </span>

          新增产品
        </button>
      </div>
    </div>

    <!-- Search Panel -->
    <section class="search-panel">
      <div class="search-row">
        <!-- Keyword -->
        <div
          class="form-item keyword-item"
        >
          <label
            class="form-label"
            for="product-search"
          >
            关键词
          </label>

          <div class="input-wrapper">
            <span class="input-icon">
              🔍
            </span>

            <input
              id="product-search"
              v-model="searchKeyword"
              type="text"
              class="form-input search-input"
              placeholder="请输入产品型号、中文名称或英文名称"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <!-- Manufacturer -->
        <div class="form-item">
          <label
            class="form-label"
            for="manufacturer-filter"
          >
            厂商
          </label>

          <select
            id="manufacturer-filter"
            v-model="
              selectedManufacturerId
            "
            class="form-select"
          >
            <option value="">
              全部厂商
            </option>

            <option
              v-for="manufacturer in manufacturers"
              :key="manufacturer.id"
              :value="
                String(
                  manufacturer.id,
                )
              "
            >
              {{ manufacturer.name }}
            </option>
          </select>
        </div>

        <!-- Category -->
        <div class="form-item">
          <label
            class="form-label"
            for="category-filter"
          >
            分类
          </label>

          <select
            id="category-filter"
            v-model="
              selectedCategoryId
            "
            class="form-select"
          >
            <option value="">
              全部分类
            </option>

            <option
              v-for="category in categories"
              :key="category.id"
              :value="
                String(
                  category.id,
                )
              "
            >
              {{ category.nameZh }}
            </option>
          </select>
        </div>

        <!-- Status -->
        <div class="form-item">
          <label
            class="form-label"
            for="status-filter"
          >
            产品状态
          </label>

          <select
            id="status-filter"
            v-model="selectedStatus"
            class="form-select"
            @change="handleStatusChange"
          >
            <option value="">
              全部状态
            </option>

            <option value="In Stock">
              In Stock
            </option>

            <option value="Available">
              Available
            </option>

            <option value="Request Quote">
              Request Quote
            </option>

            <option value="Discontinued">
              Discontinued
            </option>
          </select>
        </div>

        <!-- Buttons -->
        <div class="search-actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading"
            @click="handleSearch"
          >
            {{ loading ? '查询中...' : '查询' }}
          </button>

          <button
            type="button"
            class="btn btn-default"
            :disabled="loading"
            @click="handleReset"
          >
            重置
          </button>
        </div>
      </div>
    </section>

    <!-- Toolbar -->
    <section class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="total-text">
            共

            <strong>
              {{ pagination.total }}
            </strong>

            个产品
          </span>

          <button
            v-if="hasSelectedProducts"
            type="button"
            class="btn btn-danger-outline"
            :disabled="batchDeleting"
            @click="handleBatchDelete"
          >
            {{
              batchDeleting
                ? '删除中...'
                : '批量删除'
            }}
          </button>
        </div>

        <div class="toolbar-right">
          <button
            type="button"
            class="refresh-button"
            title="刷新"
            :disabled="
              loading ||
              batchDeleting
            "
            @click="fetchProducts"
          >
            ↻
          </button>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="error-message"
      >
        <span class="error-icon">
          !
        </span>

        <span>
          {{ errorMessage }}
        </span>

        <button
          type="button"
          class="error-retry"
          :disabled="loading"
          @click="fetchProducts"
        >
          重试
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="products-table">
          <thead>
            <tr>
              <th
                class="checkbox-column"
              >
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :disabled="
                    products.length ===
                      0 ||
                    loading ||
                    batchDeleting
                  "
                  @change="
                    toggleSelectAll
                  "
                />
              </th>

              <th
                class="image-column"
              >
                图片
              </th>

              <th
                class="part-number-column"
              >
                产品型号
              </th>

              <th>
                中文名称
              </th>

              <th>
                英文名称
              </th>

              <th>
                厂商
              </th>

              <th>
                分类
              </th>

              <th>
                状态
              </th>

              <th>
                库存
              </th>

              <th
                class="action-column"
              >
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td
                colspan="10"
                class="loading-cell"
              >
                <div
                  class="loading-wrapper"
                >
                  <span
                    class="loading-spinner"
                  ></span>

                  <span>
                    正在加载产品数据...
                  </span>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr
              v-else-if="
                products.length ===
                0
              "
            >
              <td
                colspan="10"
                class="empty-cell"
              >
                <div
                  class="empty-wrapper"
                >
                  <div
                    class="empty-icon"
                  >
                    📦
                  </div>

                  <div
                    class="empty-title"
                  >
                    暂无产品数据
                  </div>

                  <div
                    class="empty-description"
                  >
                    没有找到符合条件的产品
                  </div>
                </div>
              </td>
            </tr>

            <!-- Products -->
            <tr
              v-for="product in products"
              v-else
              :key="product.id"
              class="product-row"
            >
              <!-- Checkbox -->
              <td
                class="checkbox-column"
              >
                <input
                  type="checkbox"
                  :checked="
                    selectedProductIds.includes(
                      product.id,
                    )
                  "
                  :disabled="
                    batchDeleting ||
                    deletingProductId !==
                      null
                  "
                  @change="
                    toggleProductSelection(
                      product.id,
                    )
                  "
                />
              </td>

              <!-- Image -->
              <td
                class="image-column"
              >
                <button
                  type="button"
                  class="product-image-button"
                  title="查看产品详情"
                  @click="
                    handleViewProduct(
                      product,
                    )
                  "
                >
                  <img
                    v-if="
                      product.imageUrl
                    "
                    :src="
                      getImageUrl(
                        product.imageUrl,
                      )
                    "
                    :alt="
                      product.partNumber
                    "
                    class="product-image"
                  />

                  <span
                    v-else
                    class="product-image-placeholder"
                  >
                    <span>
                      📦
                    </span>
                  </span>
                </button>
              </td>

              <!-- Part Number -->
              <td>
                <button
                  type="button"
                  class="part-number"
                  @click="
                    handleViewProduct(
                      product,
                    )
                  "
                >
                  {{
                    product.partNumber
                  }}
                </button>

                <span
                  v-if="
                    product.isFeatured
                  "
                  class="featured-badge"
                >
                  推荐
                </span>
              </td>

              <!-- Chinese -->
              <td>
                <div
                  class="product-title"
                >
                  {{
                    product.titleZh ||
                    '-'
                  }}
                </div>
              </td>

              <!-- English -->
              <td>
                <div
                  class="product-title-en"
                  :title="
                    product.titleEn
                  "
                >
                  {{
                    product.titleEn ||
                    '-'
                  }}
                </div>
              </td>

              <!-- Manufacturer -->
              <td>
                <span
                  v-if="
                    product.manufacturer
                  "
                  class="manufacturer-tag"
                >
                  {{
                    getManufacturerName(
                      product,
                    )
                  }}
                </span>

                <span
                  v-else
                  class="empty-value"
                >
                  -
                </span>
              </td>

              <!-- Category -->
              <td>
                <span
                  v-if="
                    product.category
                  "
                  class="category-tag"
                >
                  {{
                    getCategoryName(
                      product,
                    )
                  }}
                </span>

                <span
                  v-else
                  class="empty-value"
                >
                  -
                </span>
              </td>

              <!-- Status -->
              <td>
                <span
                  class="status-tag"
                  :class="
                    getStatusClass(
                      product.status,
                    )
                  "
                >
                  {{
                    getStatusLabel(
                      product.status,
                    )
                  }}
                </span>
              </td>

              <!-- Stock -->
              <td>
                <span
                  v-if="
                    product.stockQuantity !==
                      null &&
                    product.stockQuantity !==
                      undefined
                  "
                  class="stock-text"
                >
                  {{
                    formatStock(
                      product,
                    )
                  }}
                </span>

                <span
                  v-else
                  class="empty-value"
                >
                  -
                </span>
              </td>

              <!-- Actions -->
              <td
                class="action-column"
              >
                <div
                  class="row-actions"
                >
                  <button
                    type="button"
                    class="action-button view"
                    :disabled="
                      batchDeleting
                    "
                    @click="
                      handleViewProduct(
                        product,
                      )
                    "
                  >
                    查看
                  </button>

                  <button
                    type="button"
                    class="action-button edit"
                    :disabled="
                      deletingProductId !==
                        null ||
                      batchDeleting
                    "
                    @click="
                      handleEditProduct(
                        product,
                      )
                    "
                  >
                    编辑
                  </button>

                  <button
                    type="button"
                    class="action-button delete"
                    :disabled="
                      deletingProductId ===
                        product.id ||
                      batchDeleting
                    "
                    @click="
                      handleDeleteProduct(
                        product,
                      )
                    "
                  >
                    {{
                      deletingProductId ===
                      product.id
                        ? '删除中...'
                        : '删除'
                    }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="
          !loading &&
          pagination.total > 0
        "
        class="pagination-bar"
      >
        <div
          class="pagination-info"
        >
          显示

          <strong>
            {{ getStartItem() }}
          </strong>

          -

          <strong>
            {{ getEndItem() }}
          </strong>

          条，共

          <strong>
            {{ pagination.total }}
          </strong>

          条
        </div>

        <div
          class="pagination-controls"
        >
          <button
            type="button"
            class="page-button"
            :disabled="
              currentPage === 1 ||
              loading ||
              batchDeleting
            "
            @click="
              goToPreviousPage
            "
          >
            ‹
          </button>

          <template
            v-for="(
              page, index
            ) in visiblePages"
            :key="`${page}-${index}`"
          >
            <span
              v-if="
                page === '...'
              "
              class="page-ellipsis"
            >
              ...
            </span>

            <button
              v-else
              type="button"
              class="page-button"
              :class="{
                active:
                  page ===
                  currentPage,
              }"
              :disabled="
                loading ||
                batchDeleting
              "
              @click="
                goToPage(
                  page as number,
                )
              "
            >
              {{ page }}
            </button>
          </template>

          <button
            type="button"
            class="page-button"
            :disabled="
              currentPage ===
                pagination.totalPages ||
              loading ||
              batchDeleting
            "
            @click="
              goToNextPage
            "
          >
            ›
          </button>
        </div>

        <div
          class="page-size-control"
        >
          <span>每页</span>

          <select
            v-model.number="pageSize"
            class="page-size-select"
            :disabled="
              loading ||
              batchDeleting
            "
            @change="
              handlePageSizeChange
            "
          >
            <option :value="10">
              10 条
            </option>

            <option :value="20">
              20 条
            </option>

            <option :value="50">
              50 条
            </option>

            <option :value="100">
              100 条
            </option>
          </select>
        </div>
      </div>
    </section>

    <!-- Bottom Info -->
    <div
      class="page-footer-tip"
    >
      <span class="tip-icon">
        💡
      </span>

      <span>
        当前产品数据来自数据库
        <code>products</code>
        表。
      </span>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

.products-page {
  position: relative;

  min-height: 100%;

  padding: 24px;

  background: #f5f7fa;
}

/* ─────────────────────────────────────────────
   Toast Notification
───────────────────────────────────────────── */

.toast-notification {
  position: fixed;

  top: 24px;
  right: 24px;

  z-index: 3000;

  display: flex;
  align-items: center;

  min-width: 300px;
  max-width: 460px;
  min-height: 48px;

  padding: 0 14px;

  background: #fff;

  border-radius: 4px;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.06);

  font-size: 14px;
}

.toast-icon {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 22px;
  height: 22px;

  margin-right: 10px;

  border-radius: 50%;

  color: #fff;

  font-size: 14px;
  font-weight: 700;

  line-height: 1;
}

.toast-message {
  flex: 1;

  color: #606266;

  line-height: 1.5;
}

.toast-close {
  width: 28px;
  height: 28px;

  margin-left: 8px;

  padding: 0;

  color: #909399;

  background: transparent;

  border: 0;

  font-size: 20px;

  line-height: 28px;

  cursor: pointer;

  transition:
    color 0.2s,
    background-color 0.2s;
}

.toast-close:hover {
  color: #606266;

  background: #f5f7fa;

  border-radius: 3px;
}

.toast-success {
  border: 1px solid #e1f3d8;
}

.toast-success .toast-icon {
  background: #67c23a;
}

.toast-success .toast-message {
  color: #529b2e;
}

.toast-error {
  border: 1px solid #fde2e2;
}

.toast-error .toast-icon {
  background: #f56c6c;
}

.toast-error .toast-message {
  color: #c45656;
}

.toast-warning {
  border: 1px solid #faecd8;
}

.toast-warning .toast-icon {
  background: #e6a23c;
}

.toast-warning .toast-message {
  color: #b88230;
}

.toast-info {
  border: 1px solid #d9ecff;
}

.toast-info .toast-icon {
  background: #409eff;
}

.toast-info .toast-message {
  color: #337ecc;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;

  transform: translateY(-12px);
}

/* ─────────────────────────────────────────────
   Header
───────────────────────────────────────────── */

.page-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 20px;
}

.page-title {
  margin: 0;

  color: #303133;

  font-size: 22px;
  font-weight: 600;

  line-height: 1.4;
}

.page-description {
  margin: 7px 0 0;

  color: #909399;

  font-size: 13px;
}

.page-actions {
  display: flex;

  gap: 10px;
}

/* ─────────────────────────────────────────────
   Buttons
───────────────────────────────────────────── */

.btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  height: 36px;

  padding: 0 16px;

  border: 1px solid transparent;

  border-radius: 4px;

  font-size: 14px;

  cursor: pointer;

  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.btn-primary {
  color: #fff;

  background: #409eff;

  border-color: #409eff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;

  border-color: #66b1ff;
}

.btn-primary:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.btn-default {
  color: #606266;

  background: #fff;

  border-color: #dcdfe6;
}

.btn-default:hover:not(:disabled) {
  color: #409eff;

  border-color: #409eff;
}

.btn-default:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.btn-danger-outline {
  height: 32px;

  padding: 0 12px;

  color: #f56c6c;

  background: #fff;

  border: 1px solid #fbc4c4;

  border-radius: 4px;

  font-size: 13px;

  cursor: pointer;
}

.btn-danger-outline:hover:not(:disabled) {
  color: #fff;

  background: #f56c6c;

  border-color: #f56c6c;
}

.btn-danger-outline:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.btn-icon {
  margin-right: 5px;

  font-size: 18px;

  line-height: 1;
}

/* ─────────────────────────────────────────────
   Search
───────────────────────────────────────────── */

.search-panel {
  padding: 20px;

  margin-bottom: 20px;

  background: #fff;

  border: 1px solid #ebeef5;

  border-radius: 4px;

  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.03);
}

.search-row {
  display: flex;

  align-items: flex-end;

  gap: 16px;

  flex-wrap: wrap;
}

.form-item {
  min-width: 180px;
}

.keyword-item {
  flex: 1;

  min-width: 300px;
}

.form-label {
  display: block;

  margin-bottom: 8px;

  color: #606266;

  font-size: 13px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;

  top: 50%;
  left: 11px;

  color: #909399;

  font-size: 14px;

  transform: translateY(-50%);

  pointer-events: none;
}

.form-input,
.form-select {
  box-sizing: border-box;

  width: 100%;
  height: 36px;

  padding: 0 12px;

  color: #606266;

  background: #fff;

  border: 1px solid #dcdfe6;

  border-radius: 4px;

  outline: none;

  font-size: 13px;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.search-input {
  padding-left: 34px;
}

.form-input::placeholder {
  color: #c0c4cc;
}

.form-input:focus,
.form-select:focus {
  border-color: #409eff;

  box-shadow:
    0 0 0 2px
      rgba(64, 158, 255, 0.1);
}

.form-select:disabled {
  color: #c0c4cc;

  background: #f5f7fa;

  cursor: not-allowed;
}

.search-actions {
  display: flex;

  gap: 8px;
}

/* ─────────────────────────────────────────────
   Table Card
───────────────────────────────────────────── */

.table-card {
  overflow: hidden;

  background: #fff;

  border: 1px solid #ebeef5;

  border-radius: 4px;

  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.03);
}

.table-toolbar {
  display: flex;

  align-items: center;
  justify-content: space-between;

  min-height: 56px;

  padding: 0 18px;

  border-bottom: 1px solid #ebeef5;
}

.toolbar-left {
  display: flex;

  align-items: center;

  gap: 14px;
}

.toolbar-right {
  display: flex;

  align-items: center;
}

.total-text {
  color: #909399;

  font-size: 13px;
}

.total-text strong {
  color: #303133;

  font-weight: 600;
}

.refresh-button {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;

  padding: 0;

  color: #909399;

  background: transparent;

  border: 0;

  border-radius: 4px;

  font-size: 20px;

  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  color: #409eff;

  background: #f5f7fa;
}

.refresh-button:disabled {
  color: #c0c4cc;

  cursor: not-allowed;
}

/* ─────────────────────────────────────────────
   Error
───────────────────────────────────────────── */

.error-message {
  display: flex;

  align-items: center;

  gap: 8px;

  padding: 12px 18px;

  color: #f56c6c;

  background: #fef0f0;

  border-bottom: 1px solid #fde2e2;

  font-size: 13px;
}

.error-icon {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 18px;
  height: 18px;

  color: #fff;

  background: #f56c6c;

  border-radius: 50%;

  font-size: 12px;
  font-weight: 700;
}

.error-retry {
  margin-left: auto;

  padding: 0;

  color: #409eff;

  background: transparent;

  border: 0;

  font-size: 13px;

  cursor: pointer;
}

.error-retry:disabled {
  color: #c0c4cc;

  cursor: not-allowed;
}

/* ─────────────────────────────────────────────
   Table
───────────────────────────────────────────── */

.table-wrapper {
  overflow-x: auto;
}

.products-table {
  width: 100%;

  min-width: 1250px;

  border-collapse: collapse;

  table-layout: fixed;
}

.products-table th,
.products-table td {
  box-sizing: border-box;

  padding: 13px 14px;

  border-bottom: 1px solid #ebeef5;

  text-align: left;

  vertical-align: middle;
}

.products-table th {
  color: #606266;

  background: #fafafa;

  font-size: 13px;

  font-weight: 600;
}

.products-table td {
  color: #606266;

  font-size: 13px;
}

.products-table tbody tr:last-child td {
  border-bottom: 0;
}

.product-row {
  transition:
    background-color 0.15s;
}

.product-row:hover {
  background: #f5f7fa;
}

.checkbox-column {
  width: 52px;

  text-align: center !important;
}

.image-column {
  width: 76px;

  text-align: center !important;
}

.part-number-column {
  width: 155px;
}

.products-table th:nth-child(4) {
  width: 180px;
}

.products-table th:nth-child(5) {
  width: 220px;
}

.products-table th:nth-child(6) {
  width: 145px;
}

.products-table th:nth-child(7) {
  width: 150px;
}

.products-table th:nth-child(8) {
  width: 100px;
}

.products-table th:nth-child(9) {
  width: 110px;
}

.action-column {
  width: 190px;
}

.products-table
  input[type='checkbox'] {
  width: 14px;
  height: 14px;

  margin: 0;

  cursor: pointer;

  accent-color: #409eff;
}

.products-table
  input[type='checkbox']:disabled {
  cursor: not-allowed;

  opacity: 0.6;
}

/* ─────────────────────────────────────────────
   Product Image
───────────────────────────────────────────── */

.product-image-button {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  padding: 0;

  background: #fff;

  border: 1px solid #ebeef5;

  border-radius: 4px;

  overflow: hidden;

  cursor: pointer;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.product-image-button:hover {
  border-color: #409eff;

  box-shadow:
    0 0 0 2px
      rgba(64, 158, 255, 0.08);
}

.product-image {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;

  background: #fff;
}

.product-image-placeholder {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  color: #c0c4cc;

  background: #f5f7fa;

  font-size: 20px;
}

/* ─────────────────────────────────────────────
   Product
───────────────────────────────────────────── */

.part-number {
  display: inline-block;

  padding: 0;

  color: #409eff;

  background: transparent;

  border: 0;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;
}

.part-number:hover {
  color: #66b1ff;

  text-decoration: underline;
}

.featured-badge {
  display: inline-block;

  margin-left: 7px;

  padding: 2px 5px;

  color: #e6a23c;

  background: #fdf6ec;

  border: 1px solid #faecd8;

  border-radius: 3px;

  font-size: 11px;

  line-height: 1.2;
}

.product-title {
  overflow: hidden;

  color: #303133;

  line-height: 1.5;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.product-title-en {
  overflow: hidden;

  color: #606266;

  line-height: 1.5;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.manufacturer-tag {
  display: inline-block;

  padding: 3px 8px;

  color: #606266;

  background: #f4f4f5;

  border: 1px solid #e9e9eb;

  border-radius: 3px;

  font-size: 12px;
}

.category-tag {
  display: inline-block;

  padding: 3px 8px;

  color: #409eff;

  background: #ecf5ff;

  border: 1px solid #d9ecff;

  border-radius: 3px;

  font-size: 12px;
}

.empty-value {
  color: #c0c4cc;
}

/* ─────────────────────────────────────────────
   Status
───────────────────────────────────────────── */

.status-tag {
  display: inline-block;

  min-width: 54px;

  padding: 3px 7px;

  border: 1px solid transparent;

  border-radius: 3px;

  text-align: center;

  font-size: 12px;
}

.status-in-stock {
  color: #67c23a;

  background: #f0f9eb;

  border-color: #e1f3d8;
}

.status-available {
  color: #409eff;

  background: #ecf5ff;

  border-color: #d9ecff;
}

.status-request-quote {
  color: #e6a23c;

  background: #fdf6ec;

  border-color: #faecd8;
}

.status-discontinued {
  color: #909399;

  background: #f4f4f5;

  border-color: #e9e9eb;
}

.stock-text {
  color: #606266;

  font-size: 12px;

  white-space: nowrap;
}

/* ─────────────────────────────────────────────
   Actions
───────────────────────────────────────────── */

.row-actions {
  display: flex;

  align-items: center;

  gap: 12px;
}

.action-button {
  padding: 0;

  background: transparent;

  border: 0;

  font-size: 13px;

  cursor: pointer;
}

.action-button:disabled {
  color: #c0c4cc !important;

  cursor: not-allowed;
}

.action-button.view {
  color: #409eff;
}

.action-button.view:hover:not(:disabled) {
  color: #66b1ff;
}

.action-button.edit {
  color: #67c23a;
}

.action-button.edit:hover:not(:disabled) {
  color: #85ce61;
}

.action-button.delete {
  color: #f56c6c;
}

.action-button.delete:hover:not(:disabled) {
  color: #f78989;
}

/* ─────────────────────────────────────────────
   Loading
───────────────────────────────────────────── */

.loading-cell {
  height: 240px;

  text-align: center !important;
}

.loading-wrapper {
  display: inline-flex;

  align-items: center;

  gap: 10px;

  color: #909399;
}

.loading-spinner {
  display: inline-block;

  width: 16px;
  height: 16px;

  border: 2px solid #dcdfe6;

  border-top-color: #409eff;

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─────────────────────────────────────────────
   Empty
───────────────────────────────────────────── */

.empty-cell {
  height: 300px;

  text-align: center !important;
}

.empty-wrapper {
  display: flex;

  align-items: center;
  justify-content: center;

  flex-direction: column;
}

.empty-icon {
  margin-bottom: 12px;

  font-size: 42px;

  opacity: 0.6;
}

.empty-title {
  margin-bottom: 6px;

  color: #606266;

  font-size: 15px;
}

.empty-description {
  color: #c0c4cc;

  font-size: 13px;
}

/* ─────────────────────────────────────────────
   Pagination
───────────────────────────────────────────── */

.pagination-bar {
  display: flex;

  align-items: center;
  justify-content: space-between;

  min-height: 62px;

  padding: 0 18px;

  border-top: 1px solid #ebeef5;
}

.pagination-info {
  color: #909399;

  font-size: 13px;
}

.pagination-info strong {
  color: #606266;

  font-weight: 500;
}

.pagination-controls {
  display: flex;

  align-items: center;

  gap: 4px;
}

.page-button {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 30px;
  height: 30px;

  padding: 0 7px;

  color: #606266;

  background: #fff;

  border: 1px solid #dcdfe6;

  border-radius: 3px;

  font-size: 13px;

  cursor: pointer;

  transition:
    color 0.2s,
    background-color 0.2s,
    border-color 0.2s;
}

.page-button:hover:not(:disabled) {
  color: #409eff;

  border-color: #409eff;
}

.page-button.active {
  color: #fff;

  background: #409eff;

  border-color: #409eff;
}

.page-button:disabled {
  color: #c0c4cc;

  background: #f5f7fa;

  border-color: #ebeef5;

  cursor: not-allowed;
}

.page-ellipsis {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 30px;
  height: 30px;

  color: #909399;

  font-size: 13px;
}

.page-size-control {
  display: flex;

  align-items: center;

  gap: 8px;

  color: #909399;

  font-size: 13px;
}

.page-size-select {
  height: 30px;

  padding: 0 8px;

  color: #606266;

  background: #fff;

  border: 1px solid #dcdfe6;

  border-radius: 3px;

  outline: none;

  font-size: 13px;

  cursor: pointer;
}

.page-size-select:disabled {
  color: #c0c4cc;

  background: #f5f7fa;

  cursor: not-allowed;
}

/* ─────────────────────────────────────────────
   Footer Tip
───────────────────────────────────────────── */

.page-footer-tip {
  display: flex;

  align-items: center;

  gap: 7px;

  margin-top: 14px;

  color: #909399;

  font-size: 12px;
}

.tip-icon {
  font-size: 13px;
}

.page-footer-tip code {
  padding: 1px 4px;

  color: #606266;

  background: #f4f4f5;

  border-radius: 2px;

  font-family:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    monospace;
}

/* ─────────────────────────────────────────────
   Responsive
───────────────────────────────────────────── */

@media (max-width: 1200px) {
  .products-page {
    padding: 18px;
  }

  .pagination-bar {
    gap: 12px;

    flex-wrap: wrap;

    padding: 12px 18px;
  }
}

@media (max-width: 900px) {
  .search-row {
    align-items: stretch;

    flex-direction: column;
  }

  .form-item,
  .keyword-item {
    width: 100%;

    min-width: 0;
  }

  .search-actions {
    justify-content: flex-start;
  }

  .page-header {
    align-items: flex-start;

    gap: 15px;

    flex-direction: column;
  }

  .toast-notification {
    top: 16px;
    right: 16px;
    left: 16px;

    min-width: 0;
    max-width: none;
  }
}

@media (max-width: 700px) {
  .products-page {
    padding: 14px;
  }

  .page-title {
    font-size: 20px;
  }

  .table-toolbar {
    padding: 0 12px;
  }

  .pagination-bar {
    align-items: flex-start;

    flex-direction: column;
  }

  .pagination-controls {
    order: 2;
  }

  .page-size-control {
    order: 3;
  }
}
</style>
