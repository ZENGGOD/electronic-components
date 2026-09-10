<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Manufacturer {
  id: number

  name: string

  code: string | null

  logoUrl: string | null

  website: string | null

  description: string | null

  status: number

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

interface ManufacturerForm {
  name: string
  code: string
  logoUrl: string
  website: string
  description: string
  status: number
  sortOrder: number
}

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

const manufacturers =
  ref<Manufacturer[]>([])

const loading = ref(false)

const saving = ref(false)

const deletingManufacturerId =
  ref<number | null>(null)

const errorMessage = ref('')

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

const searchKeyword = ref('')

const selectedStatus =
  ref<string>('')

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

const currentPage = ref(1)

const pageSize = ref(10)

const pagination =
  ref<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

// ─────────────────────────────────────────────
// Form Modal
// ─────────────────────────────────────────────

const showFormModal =
  ref(false)

const editingManufacturerId =
  ref<number | null>(null)

const form =
  ref<ManufacturerForm>({
    name: '',
    code: '',
    logoUrl: '',
    website: '',
    description: '',
    status: 1,
    sortOrder: 0,
})

// ─────────────────────────────────────────────
// Toast
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

const isEditMode =
  computed(() => {
    return (
      editingManufacturerId.value !==
      null
    )
  })

const modalTitle =
  computed(() => {
    return isEditMode.value
      ? '编辑厂商'
      : '新增厂商'
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
// Load manufacturers
// ─────────────────────────────────────────────

async function fetchManufacturers(): Promise<void> {
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
        'keyword',
        searchKeyword.value.trim(),
      )
    }

    if (selectedStatus.value) {
      params.set(
        'status',
        selectedStatus.value,
      )
    }

    const response =
      await fetch(
        `${API_BASE_URL}/admin/manufacturers?${params.toString()}`,
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
          'Failed to fetch manufacturers',
      )
    }

    const data =
      result.data

    manufacturers.value =
      data?.items ?? []

    pagination.value = {
      page:
        data?.page ??
        currentPage.value,

      pageSize:
        data?.pageSize ??
        pageSize.value,

      total:
        data?.total ??
        0,

      totalPages:
        data?.totalPages ??
        0,
    }
  } catch (error) {
    console.error(
      'Failed to fetch manufacturers:',
      error,
    )

    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取厂商列表失败'
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

function handleSearch(): void {
  currentPage.value = 1

  fetchManufacturers()
}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────

function handleReset(): void {
  searchKeyword.value = ''

  selectedStatus.value = ''

  currentPage.value = 1

  fetchManufacturers()
}

// ─────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────

function handleStatusChange(): void {
  currentPage.value = 1

  fetchManufacturers()
}

function getStatusLabel(
  status: number,
): string {
  return status === 1
    ? '启用'
    : '禁用'
}

function getStatusClass(
  status: number,
): string {
  return status === 1
    ? 'status-enabled'
    : 'status-disabled'
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

  fetchManufacturers()
}

function goToPreviousPage(): void {
  if (currentPage.value <= 1) {
    return
  }

  currentPage.value -= 1

  fetchManufacturers()
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

  fetchManufacturers()
}

function handlePageSizeChange(): void {
  currentPage.value = 1

  fetchManufacturers()
}

// ─────────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────────

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
// Form
// ─────────────────────────────────────────────

function resetForm(): void {
  form.value = {
    name: '',
    code: '',
    logoUrl: '',
    website: '',
    description: '',
    status: 1,
    sortOrder: 0,
  }
}

function handleAddManufacturer(): void {
  editingManufacturerId.value =
    null

  resetForm()

  showFormModal.value = true
}

async function handleEditManufacturer(
  manufacturer: Manufacturer,
): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  loading.value = true

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/manufacturers/${manufacturer.id}`,
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

    const result =
      await response.json()

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '获取厂商详情失败',
      )
    }

    const data =
      result.data

    editingManufacturerId.value =
      data.id

    form.value = {
      name: data.name ?? '',
      code: data.code ?? '',
      logoUrl:
        data.logoUrl ?? '',
      website:
        data.website ?? '',
      description:
        data.description ?? '',
      status:
        data.status === 0
          ? 0
          : 1,
      sortOrder:
        Number.isInteger(
          data.sortOrder,
        )
          ? data.sortOrder
          : 0,
    }

    showFormModal.value = true
  } catch (error) {
    console.error(
      'Failed to get manufacturer:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取厂商详情失败',
      'error',
      3500,
    )
  } finally {
    loading.value = false
  }
}

function handleFormClose(): void {
  if (saving.value) {
    return
  }

  showFormModal.value = false

  editingManufacturerId.value =
    null

  resetForm()
}

// ─────────────────────────────────────────────
// Save manufacturer
// ─────────────────────────────────────────────

async function handleSaveManufacturer(): Promise<void> {
  const name =
    form.value.name.trim()

  if (!name) {
    showToast(
      '请输入厂商名称',
      'warning',
    )

    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  saving.value = true

  try {
    const payload = {
      name,

      code:
        form.value.code.trim() ||
        null,

      logoUrl:
        form.value.logoUrl.trim() ||
        null,

      website:
        form.value.website.trim() ||
        null,

      description:
        form.value.description.trim() ||
        null,

      status:
        form.value.status === 0
          ? 0
          : 1,

      sortOrder:
        Number.isInteger(
          form.value.sortOrder,
        )
          ? form.value.sortOrder
          : 0,
    }

    const isEdit =
      editingManufacturerId.value !==
      null

    const url = isEdit
      ? `${API_BASE_URL}/admin/manufacturers/${editingManufacturerId.value}`
      : `${API_BASE_URL}/admin/manufacturers`

    const response =
      await fetch(
        url,
        {
          method: isEdit
            ? 'PUT'
            : 'POST',

          headers:
            getAuthHeaders(),

          body: JSON.stringify(
            payload,
          ),
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()

      return
    }

    const responseText =
      await response.text()

    let result: {
      success: boolean
      message?: string
      data?: Manufacturer
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
          (isEdit
            ? '修改厂商失败'
            : '新增厂商失败'),
      )
    }

    showFormModal.value = false

    editingManufacturerId.value =
      null

    resetForm()

    await fetchManufacturers()

    showToast(
      isEdit
        ? '厂商修改成功'
        : '厂商新增成功',
      'success',
    )
  } catch (error) {
    console.error(
      'Failed to save manufacturer:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '保存厂商失败',
      'error',
      3500,
    )
  } finally {
    saving.value = false
  }
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

async function handleDeleteManufacturer(
  manufacturer: Manufacturer,
): Promise<void> {
  if (
    deletingManufacturerId.value !==
    null
  ) {
    return
  }

  const confirmed =
    window.confirm(
      `确定要删除厂商「${manufacturer.name}」吗？\n\n删除后无法恢复，请确认。`,
    )

  if (!confirmed) {
    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  deletingManufacturerId.value =
    manufacturer.id

  errorMessage.value = ''

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/manufacturers/${manufacturer.id}`,
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

    const responseText =
      await response.text()

    let result: {
      success: boolean
      message?: string
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
          '删除厂商失败',
      )
    }

    if (
      manufacturers.value.length ===
        1 &&
      currentPage.value > 1
    ) {
      currentPage.value -= 1
    }

    await fetchManufacturers()

    showToast(
      `厂商「${manufacturer.name}」删除成功`,
      'success',
    )
  } catch (error) {
    console.error(
      'Failed to delete manufacturer:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '删除厂商失败'

    errorMessage.value = message

    showToast(
      message,
      'error',
      3500,
    )
  } finally {
    deletingManufacturerId.value =
      null
  }
}

// ─────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────

onMounted(() => {
  fetchManufacturers()
})
</script>

<template>
  <!-- ─────────────────────────────────────────
       Toast
  ───────────────────────────────────────── -->

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

  <!-- ─────────────────────────────────────────
       Manufacturer Form Modal
  ───────────────────────────────────────── -->

  <transition name="modal">
    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="handleFormClose"
    >
      <div class="manufacturer-modal">
        <!-- Modal Header -->
        <div class="modal-header">
          <div>
            <h2 class="modal-title">
              {{ modalTitle }}
            </h2>

            <p class="modal-description">
              {{
                isEditMode
                  ? '修改厂商基本信息'
                  : '添加新的电子元器件厂商'
              }}
            </p>
          </div>

          <button
            type="button"
            class="modal-close"
            :disabled="saving"
            aria-label="关闭"
            @click="handleFormClose"
          >
            ×
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Name -->
          <div class="form-field">
            <label class="form-label">
              厂商名称
              <span class="required">*</span>
            </label>

            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="例如：Texas Instruments"
              :disabled="saving"
              maxlength="100"
            />
          </div>

          <!-- Code -->
          <div class="form-field">
            <label class="form-label">
              厂商代码
            </label>

            <input
              v-model="form.code"
              type="text"
              class="form-input"
              placeholder="例如：TI"
              :disabled="saving"
              maxlength="50"
            />

            <div class="field-tip">
              厂商代码必须保持唯一。
            </div>
          </div>

          <!-- Website -->
          <div class="form-field">
            <label class="form-label">
              官方网站
            </label>

            <input
              v-model="form.website"
              type="url"
              class="form-input"
              placeholder="https://www.example.com"
              :disabled="saving"
              maxlength="500"
            />
          </div>

          <!-- Logo -->
          <div class="form-field">
            <label class="form-label">
              Logo 地址
            </label>

            <input
              v-model="form.logoUrl"
              type="url"
              class="form-input"
              placeholder="https://www.example.com/logo.png"
              :disabled="saving"
              maxlength="500"
            />

            <div
              v-if="form.logoUrl"
              class="logo-preview"
            >
              <img
                :src="
                  getImageUrl(
                    form.logoUrl,
                  )
                "
                alt="Logo preview"
                @error="
                  (
                    $event.target as HTMLImageElement
                  ).style.display = 'none'
                "
              />
            </div>
          </div>

          <!-- Description -->
          <div class="form-field">
            <label class="form-label">
              厂商描述
            </label>

            <textarea
              v-model="form.description"
              class="form-textarea"
              placeholder="请输入厂商简介..."
              :disabled="saving"
              rows="5"
            ></textarea>
          </div>

          <!-- Status + Sort -->
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">
                状态
              </label>

              <select
                v-model.number="form.status"
                class="form-select"
                :disabled="saving"
              >
                <option :value="1">
                  启用
                </option>

                <option :value="0">
                  禁用
                </option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">
                排序
              </label>

              <input
                v-model.number="
                  form.sortOrder
                "
                type="number"
                class="form-input"
                placeholder="0"
                :disabled="saving"
                step="1"
              />
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-default"
            :disabled="saving"
            @click="handleFormClose"
          >
            取消
          </button>

          <button
            type="button"
            class="btn btn-primary"
            :disabled="
              saving ||
              !form.name.trim()
            "
            @click="
              handleSaveManufacturer
            "
          >
            {{
              saving
                ? '保存中...'
                : '保存'
            }}
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- ─────────────────────────────────────────
       Page
  ───────────────────────────────────────── -->

  <div class="manufacturers-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          厂商管理
        </h1>

        <p class="page-description">
          管理电子元器件厂商信息
        </p>
      </div>

      <div class="page-actions">
        <button
          type="button"
          class="btn btn-primary"
          @click="
            handleAddManufacturer
          "
        >
          <span class="btn-icon">
            ＋
          </span>

          新增厂商
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
            for="manufacturer-search"
          >
            关键词
          </label>

          <div class="input-wrapper">
            <span class="input-icon">
              🔍
            </span>

            <input
              id="manufacturer-search"
              v-model="
                searchKeyword
              "
              type="text"
              class="form-input search-input"
              placeholder="请输入厂商名称或厂商代码"
              @keyup.enter="
                handleSearch
              "
            />
          </div>
        </div>

        <!-- Status -->
        <div class="form-item">
          <label
            class="form-label"
            for="manufacturer-status"
          >
            状态
          </label>

          <select
            id="manufacturer-status"
            v-model="selectedStatus"
            class="form-select"
            @change="
              handleStatusChange
            "
          >
            <option value="">
              全部状态
            </option>

            <option value="1">
              启用
            </option>

            <option value="0">
              禁用
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
            {{
              loading
                ? '查询中...'
                : '查询'
            }}
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

    <!-- Table Card -->
    <section class="table-card">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="total-text">
            共

            <strong>
              {{ pagination.total }}
            </strong>

            个厂商
          </span>
        </div>

        <div class="toolbar-right">
          <button
            type="button"
            class="refresh-button"
            title="刷新"
            :disabled="loading"
            @click="
              fetchManufacturers
            "
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
          @click="
            fetchManufacturers
          "
        >
          重试
        </button>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="manufacturers-table">
          <thead>
            <tr>
              <th
                class="id-column"
              >
                ID
              </th>

              <th
                class="logo-column"
              >
                Logo
              </th>

              <th
                class="name-column"
              >
                厂商名称
              </th>

              <th
                class="code-column"
              >
                厂商代码
              </th>

              <th
                class="website-column"
              >
                官方网站
              </th>

              <th>
                描述
              </th>

              <th
                class="status-column"
              >
                状态
              </th>

              <th
                class="sort-column"
              >
                排序
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
                colspan="9"
                class="loading-cell"
              >
                <div
                  class="loading-wrapper"
                >
                  <span
                    class="loading-spinner"
                  ></span>

                  <span>
                    正在加载厂商数据...
                  </span>
                </div>
              </td>
            </tr>

            <!-- Empty -->
            <tr
              v-else-if="
                manufacturers.length ===
                0
              "
            >
              <td
                colspan="9"
                class="empty-cell"
              >
                <div
                  class="empty-wrapper"
                >
                  <div
                    class="empty-icon"
                  >
                    🏭
                  </div>

                  <div
                    class="empty-title"
                  >
                    暂无厂商数据
                  </div>

                  <div
                    class="empty-description"
                  >
                    没有找到符合条件的厂商
                  </div>
                </div>
              </td>
            </tr>

            <!-- Manufacturers -->
            <tr
              v-for="manufacturer in manufacturers"
              v-else
              :key="manufacturer.id"
              class="manufacturer-row"
            >
              <!-- ID -->
              <td>
                <span class="id-text">
                  {{ manufacturer.id }}
                </span>
              </td>

              <!-- Logo -->
              <td
                class="logo-column"
              >
                <div
                  class="manufacturer-logo"
                >
                  <img
                    v-if="
                      manufacturer.logoUrl
                    "
                    :src="
                      getImageUrl(
                        manufacturer.logoUrl,
                      )
                    "
                    :alt="
                      manufacturer.name
                    "
                    @error="
                      (
                        $event.target as HTMLImageElement
                      ).style.display = 'none'
                    "
                  />

                  <span
                    v-else
                    class="logo-placeholder"
                  >
                    🏭
                  </span>
                </div>
              </td>

              <!-- Name -->
              <td>
                <div
                  class="manufacturer-name"
                >
                  {{
                    manufacturer.name
                  }}
                </div>
              </td>

              <!-- Code -->
              <td>
                <span
                  v-if="
                    manufacturer.code
                  "
                  class="code-tag"
                >
                  {{
                    manufacturer.code
                  }}
                </span>

                <span
                  v-else
                  class="empty-value"
                >
                  -
                </span>
              </td>

              <!-- Website -->
              <td>
                <a
                  v-if="
                    manufacturer.website
                  "
                  :href="
                    manufacturer.website
                  "
                  target="_blank"
                  rel="noopener noreferrer"
                  class="website-link"
                  :title="
                    manufacturer.website
                  "
                >
                  {{
                    manufacturer.website
                  }}
                </a>

                <span
                  v-else
                  class="empty-value"
                >
                  -
                </span>
              </td>

              <!-- Description -->
              <td>
                <div
                  class="description-text"
                  :title="
                    manufacturer.description ||
                    ''
                  "
                >
                  {{
                    manufacturer.description ||
                    '-'
                  }}
                </div>
              </td>

              <!-- Status -->
              <td>
                <span
                  class="status-tag"
                  :class="
                    getStatusClass(
                      manufacturer.status,
                    )
                  "
                >
                  {{
                    getStatusLabel(
                      manufacturer.status,
                    )
                  }}
                </span>
              </td>

              <!-- Sort -->
              <td>
                <span class="sort-text">
                  {{
                    manufacturer.sortOrder
                  }}
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
                    class="action-button edit"
                    :disabled="
                      loading ||
                      deletingManufacturerId !==
                        null
                    "
                    @click="
                      handleEditManufacturer(
                        manufacturer,
                      )
                    "
                  >
                    编辑
                  </button>

                  <button
                    type="button"
                    class="action-button delete"
                    :disabled="
                      deletingManufacturerId ===
                        manufacturer.id ||
                      loading
                    "
                    @click="
                      handleDeleteManufacturer(
                        manufacturer,
                      )
                    "
                  >
                    {{
                      deletingManufacturerId ===
                      manufacturer.id
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
              loading
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
              :disabled="loading"
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
              loading
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
            :disabled="loading"
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
        当前厂商数据来自数据库
        <code>manufacturers</code>
        表。
      </span>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

.manufacturers-page {
  position: relative;

  min-height: 100%;

  padding: 24px;

  background: #f5f7fa;
}

/* ─────────────────────────────────────────────
   Toast
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

.required {
  color: #f56c6c;
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
.form-select,
.form-textarea {
  box-sizing: border-box;

  width: 100%;

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

.form-input,
.form-select {
  height: 36px;

  padding: 0 12px;
}

.form-textarea {
  display: block;

  min-height: 100px;

  padding: 10px 12px;

  resize: vertical;

  font-family: inherit;

  line-height: 1.6;
}

.search-input {
  padding-left: 34px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #c0c4cc;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #409eff;

  box-shadow:
    0 0 0 2px
      rgba(64, 158, 255, 0.1);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  color: #c0c4cc;

  background: #f5f7fa;

  cursor: not-allowed;
}

.search-actions {
  display: flex;

  gap: 8px;
}

/* ─────────────────────────────────────────────
   Table
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

.toolbar-left,
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
   Table Layout
───────────────────────────────────────────── */

.table-wrapper {
  overflow-x: auto;
}

.manufacturers-table {
  width: 100%;

  min-width: 1180px;

  border-collapse: collapse;

  table-layout: fixed;
}

.manufacturers-table th,
.manufacturers-table td {
  box-sizing: border-box;

  padding: 13px 14px;

  border-bottom: 1px solid #ebeef5;

  text-align: left;

  vertical-align: middle;
}

.manufacturers-table th {
  color: #606266;

  background: #fafafa;

  font-size: 13px;

  font-weight: 600;
}

.manufacturers-table td {
  color: #606266;

  font-size: 13px;
}

.manufacturers-table tbody tr:last-child td {
  border-bottom: 0;
}

.manufacturer-row {
  transition:
    background-color 0.15s;
}

.manufacturer-row:hover {
  background: #f5f7fa;
}

.id-column {
  width: 60px;

  text-align: center !important;
}

.logo-column {
  width: 82px;

  text-align: center !important;
}

.name-column {
  width: 190px;
}

.code-column {
  width: 130px;
}

.website-column {
  width: 210px;
}

.status-column {
  width: 90px;
}

.sort-column {
  width: 70px;

  text-align: center !important;
}

.action-column {
  width: 120px;
}

/* ─────────────────────────────────────────────
   Manufacturer
───────────────────────────────────────────── */

.id-text {
  color: #909399;

  font-family:
    'SFMono-Regular',
    Consolas,
    monospace;

  font-size: 12px;
}

.manufacturer-logo {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  overflow: hidden;

  background: #fff;

  border: 1px solid #ebeef5;

  border-radius: 4px;
}

.manufacturer-logo img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;
}

.logo-placeholder {
  color: #c0c4cc;

  font-size: 20px;
}

.manufacturer-name {
  overflow: hidden;

  color: #303133;

  font-size: 14px;
  font-weight: 500;

  line-height: 1.5;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.code-tag {
  display: inline-block;

  padding: 3px 8px;

  color: #606266;

  background: #f4f4f5;

  border: 1px solid #e9e9eb;

  border-radius: 3px;

  font-family:
    'SFMono-Regular',
    Consolas,
    monospace;

  font-size: 12px;
}

.website-link {
  display: block;

  overflow: hidden;

  color: #409eff;

  white-space: nowrap;

  text-overflow: ellipsis;

  text-decoration: none;
}

.website-link:hover {
  color: #66b1ff;

  text-decoration: underline;
}

.description-text {
  overflow: hidden;

  color: #606266;

  line-height: 1.5;

  white-space: nowrap;

  text-overflow: ellipsis;
}

.empty-value {
  color: #c0c4cc;
}

.sort-text {
  color: #606266;

  font-family:
    'SFMono-Regular',
    Consolas,
    monospace;

  font-size: 12px;
}

/* ─────────────────────────────────────────────
   Status
───────────────────────────────────────────── */

.status-tag {
  display: inline-block;

  min-width: 42px;

  padding: 3px 7px;

  border: 1px solid transparent;

  border-radius: 3px;

  text-align: center;

  font-size: 12px;
}

.status-enabled {
  color: #67c23a;

  background: #f0f9eb;

  border-color: #e1f3d8;
}

.status-disabled {
  color: #909399;

  background: #f4f4f5;

  border-color: #e9e9eb;
}

/* ─────────────────────────────────────────────
   Actions
───────────────────────────────────────────── */

.row-actions {
  display: flex;

  align-items: center;

  gap: 14px;
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
   Modal
───────────────────────────────────────────── */

.modal-overlay {
  position: fixed;

  inset: 0;

  z-index: 2000;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(
    0,
    0,
    0,
    0.45
  );
}

.manufacturer-modal {
  width: 100%;

  max-width: 620px;

  max-height: calc(100vh - 48px);

  overflow: hidden;

  background: #fff;

  border-radius: 6px;

  box-shadow:
    0 8px 30px
      rgba(0, 0, 0, 0.18);

  display: flex;

  flex-direction: column;
}

.modal-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  padding: 20px 24px;

  border-bottom: 1px solid #ebeef5;
}

.modal-title {
  margin: 0;

  color: #303133;

  font-size: 18px;
  font-weight: 600;
}

.modal-description {
  margin: 6px 0 0;

  color: #909399;

  font-size: 12px;
}

.modal-close {
  width: 32px;
  height: 32px;

  padding: 0;

  color: #909399;

  background: transparent;

  border: 0;

  font-size: 24px;

  line-height: 32px;

  cursor: pointer;
}

.modal-close:hover:not(:disabled) {
  color: #606266;

  background: #f5f7fa;

  border-radius: 4px;
}

.modal-close:disabled {
  color: #c0c4cc;

  cursor: not-allowed;
}

.modal-body {
  overflow-y: auto;

  padding: 22px 24px;
}

.form-field {
  margin-bottom: 18px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.field-tip {
  margin-top: 6px;

  color: #909399;

  font-size: 12px;
}

.form-row {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 16px;
}

.logo-preview {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 72px;
  height: 72px;

  margin-top: 10px;

  overflow: hidden;

  background: #fafafa;

  border: 1px solid #ebeef5;

  border-radius: 4px;
}

.logo-preview img {
  display: block;

  max-width: 100%;
  max-height: 100%;

  object-fit: contain;
}

.modal-footer {
  display: flex;

  align-items: center;
  justify-content: flex-end;

  gap: 10px;

  padding: 14px 24px;

  border-top: 1px solid #ebeef5;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* ─────────────────────────────────────────────
   Footer
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
  .manufacturers-page {
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
  .manufacturers-page {
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

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    align-items: flex-start;

    padding: 14px;
  }

  .manufacturer-modal {
    max-height: calc(100vh - 28px);
  }

  .modal-header {
    padding: 16px 18px;
  }

  .modal-body {
    padding: 18px;
  }

  .modal-footer {
    padding: 12px 18px;
  }
}
</style>
