<script setup lang="ts">
import {
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

// ─────────────────────────────────────────────
// Props / Emits
// ─────────────────────────────────────────────

interface Props {
  productId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: [message: string]
  message: [
    payload: {
      type: 'success' | 'error' | 'warning'
      message: string
    },
  ]
}>()

const router = useRouter()

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

interface ProductDetail {
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

  status:
    | 'In Stock'
    | 'Available'
    | 'Request Quote'
    | 'Discontinued'

  stockQuantity: number | null
  unit: string

  datasheetUrl: string | null
  imageUrl: string | null

  isFeatured: number
  sortOrder: number
}

interface ProductForm {
  partNumber: string
  manufacturerId: string
  categoryId: string
  package: string

  titleZh: string
  titleEn: string

  descriptionZh: string
  descriptionEn: string

  status:
    | 'In Stock'
    | 'Available'
    | 'Request Quote'
    | 'Discontinued'

  stockQuantity: string
  unit: string

  datasheetUrl: string
  imageUrl: string

  isFeatured: boolean
  sortOrder: string
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const API_BASE_URL =
  'http://localhost:3000/api'

const SERVER_BASE_URL =
  'http://localhost:3000'

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024

const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const allowedImageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]

const statusOptions = [
  {
    value: 'In Stock',
    label: '现货',
  },
  {
    value: 'Available',
    label: '可供货',
  },
  {
    value: 'Request Quote',
    label: '询价',
  },
  {
    value: 'Discontinued',
    label: '已停产',
  },
] as const

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

const manufacturers =
  ref<Manufacturer[]>([])

const categories =
  ref<Category[]>([])

const loading = ref(false)
const submitting = ref(false)

const uploadingImage = ref(false)

const errorMessage = ref('')

const imageUploadError = ref('')

const imageFileInput =
  ref<HTMLInputElement | null>(null)

const form = ref<ProductForm>(
  createEmptyForm(),
)

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function createEmptyForm(): ProductForm {
  return {
    partNumber: '',
    manufacturerId: '',
    categoryId: '',
    package: '',

    titleZh: '',
    titleEn: '',

    descriptionZh: '',
    descriptionEn: '',

    status: 'Available',

    stockQuantity: '',
    unit: 'pcs',

    datasheetUrl: '',
    imageUrl: '',

    isFeatured: false,
    sortOrder: '0',
  }
}

function isEditMode(): boolean {
  return props.productId !== null
}

function getPageTitle(): string {
  return isEditMode()
    ? '编辑产品'
    : '新增产品'
}

// ─────────────────────────────────────────────
// Image URL
// ─────────────────────────────────────────────

function getImageUrl(
  imageUrl: string | null,
): string {
  if (!imageUrl) {
    return ''
  }

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl
  }

  if (
    imageUrl.startsWith('/')
  ) {
    return `${SERVER_BASE_URL}${imageUrl}`
  }

  return `${SERVER_BASE_URL}/${imageUrl}`
}

// ─────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem(
    'admin_token',
  )
}

function getAuthHeaders(): HeadersInit {
  const token = getToken()

  return {
    'Content-Type': 'application/json',

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  }
}

function getUploadHeaders(): HeadersInit {
  const token = getToken()

  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
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
// Reset
// ─────────────────────────────────────────────

function resetForm(): void {
  form.value = createEmptyForm()

  errorMessage.value = ''

  imageUploadError.value = ''

  if (imageFileInput.value) {
    imageFileInput.value.value = ''
  }
}

// ─────────────────────────────────────────────
// Image Upload
// ─────────────────────────────────────────────

function openImageFilePicker(): void {
  if (
    submitting.value ||
    uploadingImage.value
  ) {
    return
  }

  imageUploadError.value = ''

  imageFileInput.value?.click()
}

function validateImageFile(
  file: File,
): string | null {
  const fileName =
    file.name.toLowerCase()

  const lastDotIndex =
    fileName.lastIndexOf('.')

  const extension =
    lastDotIndex >= 0
      ? fileName.slice(
          lastDotIndex,
        )
      : ''

  const isValidMimeType =
    allowedImageTypes.includes(
      file.type,
    )

  const isValidExtension =
    allowedImageExtensions.includes(
      extension,
    )

  if (
    !isValidMimeType ||
    !isValidExtension
  ) {
    return '仅支持 JPG、JPEG、PNG、WEBP 格式的图片'
  }

  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {
    return '图片大小不能超过 10MB'
  }

  return null
}

async function handleImageSelect(
  event: Event,
): Promise<void> {
  const input =
    event.target as HTMLInputElement

  const file =
    input.files?.[0]

  if (!file) {
    return
  }

  imageUploadError.value = ''

  const validationError =
    validateImageFile(file)

  if (validationError) {
    imageUploadError.value =
      validationError

    emit('message', {
      type: 'warning',
      message: validationError,
    })

    input.value = ''

    return
  }

  await uploadImage(file)
}

async function uploadImage(
  file: File,
): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  uploadingImage.value = true

  imageUploadError.value = ''

  try {
    const formData =
      new FormData()

    formData.append(
      'image',
      file,
    )

    const response =
      await fetch(
        `${API_BASE_URL}/admin/products/upload-image`,
        {
          method: 'POST',

          headers:
            getUploadHeaders(),

          body: formData,
        },
      )

    if (
      response.status === 401
    ) {
      handleUnauthorized()
      return
    }

    let result: {
      success?: boolean
      message?: string
      data?: {
        imageUrl?: string
      }
    }

    try {
      result =
        await response.json()
    } catch {
      throw new Error(
        '图片上传失败：服务器返回了无效数据',
      )
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '图片上传失败',
      )
    }

    const imageUrl =
      result.data?.imageUrl

    if (!imageUrl) {
      throw new Error(
        '图片上传成功，但服务器没有返回图片地址',
      )
    }

    form.value.imageUrl =
      imageUrl

    imageUploadError.value = ''

    emit('message', {
      type: 'success',
      message:
        '产品图片上传成功',
    })
  } catch (error) {
    console.error(
      'Failed to upload product image:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '图片上传失败'

    imageUploadError.value =
      message

    emit('message', {
      type: 'error',
      message,
    })
  } finally {
    uploadingImage.value = false

    if (imageFileInput.value) {
      imageFileInput.value.value = ''
    }
  }
}

// ─────────────────────────────────────────────
// Load manufacturers
// ─────────────────────────────────────────────

async function fetchManufacturers(): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/manufacturers`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(
        '获取厂商列表失败',
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          '获取厂商列表失败',
      )
    }

    const data = result.data

    if (Array.isArray(data)) {
      manufacturers.value = data
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

    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取厂商列表失败'

    emit('message', {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : '获取厂商列表失败',
    })
  }
}

// ─────────────────────────────────────────────
// Load categories
// ─────────────────────────────────────────────

async function fetchCategories(): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/categories`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error(
        '获取分类列表失败',
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          '获取分类列表失败',
      )
    }

    const data = result.data

    if (Array.isArray(data)) {
      categories.value = data
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

    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取分类列表失败'

    emit('message', {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : '获取分类列表失败',
    })
  }
}

// ─────────────────────────────────────────────
// Load product detail
// ─────────────────────────────────────────────

async function fetchProductDetail(): Promise<void> {
  if (props.productId === null) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${props.productId}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (response.status === 404) {
      throw new Error(
        '产品不存在或已经被删除',
      )
    }

    if (!response.ok) {
      throw new Error(
        `获取产品详情失败（${response.status}）`,
      )
    }

    const result =
      await response.json()

    if (!result.success) {
      throw new Error(
        result.message ||
          '获取产品详情失败',
      )
    }

    const product =
      result.data as ProductDetail

    form.value = {
      partNumber:
        product.partNumber ?? '',

      manufacturerId:
        product.manufacturer?.id
          ? String(
              product.manufacturer.id,
            )
          : '',

      categoryId:
        product.category?.id
          ? String(
              product.category.id,
            )
          : '',

      package:
        product.package ?? '',

      titleZh:
        product.titleZh ?? '',

      titleEn:
        product.titleEn ?? '',

      descriptionZh:
        product.descriptionZh ?? '',

      descriptionEn:
        product.descriptionEn ?? '',

      status:
        product.status ??
        'Available',

      stockQuantity:
        product.stockQuantity !==
          null &&
        product.stockQuantity !==
          undefined
          ? String(
              product.stockQuantity,
            )
          : '',

      unit:
        product.unit ?? 'pcs',

      datasheetUrl:
        product.datasheetUrl ?? '',

      imageUrl:
        product.imageUrl ?? '',

      isFeatured:
        Number(
          product.isFeatured ?? 0,
        ) === 1,

      sortOrder:
        String(
          product.sortOrder ?? 0,
        ),
    }
  } catch (error) {
    console.error(
      'Failed to fetch product detail:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '获取产品详情失败'

    errorMessage.value = message

    emit('message', {
      type: 'error',
      message,
    })
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

function validateForm(): string | null {
  if (!form.value.partNumber.trim()) {
    return '请输入产品型号'
  }

  if (!form.value.titleZh.trim()) {
    return '请输入中文名称'
  }

  if (!form.value.titleEn.trim()) {
    return '请输入英文名称'
  }

  if (!form.value.manufacturerId) {
    return '请选择厂商'
  }

  if (!form.value.categoryId) {
    return '请选择分类'
  }

  const stockValue = String(
    form.value.stockQuantity ?? '',
  ).trim()

  if (
    stockValue !== '' &&
    !/^\d+$/.test(stockValue)
  ) {
    return '库存必须是非负整数'
  }

  const sortValue = String(
    form.value.sortOrder ?? '',
  ).trim()

  if (
    sortValue !== '' &&
    !/^\d+$/.test(sortValue)
  ) {
    return '排序必须是非负整数'
  }

  return null
}

// ─────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
  const validationError =
    validateForm()

  if (validationError) {
    errorMessage.value =
      validationError

    emit('message', {
      type: 'warning',
      message: validationError,
    })

    return
  }

  if (uploadingImage.value) {
    const message =
      '图片正在上传，请稍候'

    errorMessage.value = message

    emit('message', {
      type: 'warning',
      message,
    })

    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const stockValue = String(
    form.value.stockQuantity ?? '',
  ).trim()

  const sortValue = String(
    form.value.sortOrder ?? '',
  ).trim()

  const payload = {
    partNumber:
      form.value.partNumber.trim(),

    manufacturerId: Number(
      form.value.manufacturerId,
    ),

    categoryId: Number(
      form.value.categoryId,
    ),

    package:
      form.value.package.trim() ||
      null,

    titleZh:
      form.value.titleZh.trim(),

    titleEn:
      form.value.titleEn.trim(),

    descriptionZh:
      form.value.descriptionZh.trim() ||
      null,

    descriptionEn:
      form.value.descriptionEn.trim() ||
      null,

    status:
      form.value.status,

    stockQuantity:
      stockValue === ''
        ? null
        : Number(stockValue),

    unit:
      form.value.unit.trim() ||
      'pcs',

    datasheetUrl:
      form.value.datasheetUrl.trim() ||
      null,

    imageUrl:
      form.value.imageUrl.trim() ||
      null,

    isFeatured:
      form.value.isFeatured
        ? 1
        : 0,

    sortOrder:
      sortValue === ''
        ? 0
        : Number(sortValue),
  }

  const isEditing =
    props.productId !== null

  try {
    const url = isEditing
      ? `${API_BASE_URL}/admin/products/${props.productId}`
      : `${API_BASE_URL}/admin/products`

    const response = await fetch(
      url,
      {
        method: isEditing
          ? 'PUT'
          : 'POST',

        headers:
          getAuthHeaders(),

        body: JSON.stringify(
          payload,
        ),
      },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    let result: {
      success?: boolean
      message?: string
      data?: unknown
    }

    try {
      result =
        await response.json()
    } catch {
      throw new Error(
        isEditing
          ? '修改产品失败：服务器返回了无效数据'
          : '新增产品失败：服务器返回了无效数据',
      )
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          (isEditing
            ? '修改产品失败'
            : '新增产品失败'),
      )
    }

    const successMessage =
      isEditing
        ? '产品修改成功'
        : '产品新增成功'

    emit(
      'success',
      successMessage,
    )

    emit('message', {
      type: 'success',
      message: successMessage,
    })
  } catch (error) {
    console.error(
      'Failed to submit product:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : isEditing
          ? '修改产品失败'
          : '新增产品失败'

    errorMessage.value = message

    emit('message', {
      type: 'error',
      message,
    })
  } finally {
    submitting.value = false
  }
}

// ─────────────────────────────────────────────
// Cancel
// ─────────────────────────────────────────────

function handleCancel(): void {
  if (
    submitting.value ||
    uploadingImage.value
  ) {
    return
  }

  emit('close')
}

// ─────────────────────────────────────────────
// Overlay click
// ─────────────────────────────────────────────

function handleOverlayClick(
  event: MouseEvent,
): void {
  if (
    event.target ===
    event.currentTarget
  ) {
    handleCancel()
  }
}

// ─────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────

async function initialize(): Promise<void> {
  resetForm()

  loading.value = true

  try {
    await Promise.all([
      fetchManufacturers(),
      fetchCategories(),
    ])

    await fetchProductDetail()
  } finally {
    if (props.productId === null) {
      loading.value = false
    }
  }
}

onMounted(() => {
  initialize()
})

watch(
  () => props.productId,
  () => {
    initialize()
  },
)
</script>

<template>
  <div
    class="modal-overlay"
    @mousedown="handleOverlayClick"
  >
    <section
      class="product-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="getPageTitle()"
    >
      <!-- Header -->
      <header class="modal-header">
        <div>
          <h1 class="modal-title">
            {{ getPageTitle() }}
          </h1>

          <p class="modal-description">
            {{
              isEditMode()
                ? '修改产品完整信息'
                : '创建新的电子元器件产品'
            }}
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          :disabled="
            submitting ||
            uploadingImage
          "
          aria-label="关闭"
          @click="handleCancel"
        >
          ×
        </button>
      </header>

      <!-- Loading -->
      <div
        v-if="loading"
        class="loading-container"
      >
        <span
          class="loading-spinner"
        ></span>

        <span>
          正在加载产品数据...
        </span>
      </div>

      <!-- Body -->
      <div
        v-else
        class="modal-body"
      >
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
        </div>

        <!-- Basic Information -->
        <section class="form-section">
          <div class="section-title">
            基本信息
          </div>

          <div class="form-grid">
            <!-- Part Number -->
            <div class="form-item">
              <label
                class="form-label required"
                for="part-number"
              >
                产品型号
              </label>

              <input
                id="part-number"
                v-model="
                  form.partNumber
                "
                type="text"
                class="form-input"
                placeholder="请输入产品型号"
                maxlength="150"
                :disabled="submitting"
              />
            </div>

            <!-- Package -->
            <div class="form-item">
              <label
                class="form-label"
                for="package"
              >
                封装
              </label>

              <input
                id="package"
                v-model="form.package"
                type="text"
                class="form-input"
                placeholder="例如：LQFP-100、SOP-14"
                maxlength="100"
                :disabled="submitting"
              />
            </div>

            <!-- Manufacturer -->
            <div class="form-item">
              <label
                class="form-label required"
                for="manufacturer"
              >
                厂商
              </label>

              <select
                id="manufacturer"
                v-model="
                  form.manufacturerId
                "
                class="form-select"
                :disabled="submitting"
              >
                <option value="">
                  请选择厂商
                </option>

                <option
                  v-for="manufacturer in manufacturers"
                  :key="
                    manufacturer.id
                  "
                  :value="
                    String(
                      manufacturer.id,
                    )
                  "
                >
                  {{
                    manufacturer.name
                  }}
                </option>
              </select>
            </div>

            <!-- Category -->
            <div class="form-item">
              <label
                class="form-label required"
                for="category"
              >
                分类
              </label>

              <select
                id="category"
                v-model="
                  form.categoryId
                "
                class="form-select"
                :disabled="submitting"
              >
                <option value="">
                  请选择分类
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
          </div>
        </section>

        <!-- Product Name -->
        <section class="form-section">
          <div class="section-title">
            产品名称
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label
                class="form-label required"
                for="title-zh"
              >
                中文名称
              </label>

              <input
                id="title-zh"
                v-model="form.titleZh"
                type="text"
                class="form-input"
                placeholder="请输入中文产品名称"
                maxlength="255"
                :disabled="submitting"
              />
            </div>

            <div class="form-item">
              <label
                class="form-label required"
                for="title-en"
              >
                英文名称
              </label>

              <input
                id="title-en"
                v-model="form.titleEn"
                type="text"
                class="form-input"
                placeholder="请输入英文产品名称"
                maxlength="255"
                :disabled="submitting"
              />
            </div>
          </div>
        </section>

        <!-- Description -->
        <section class="form-section">
          <div class="section-title">
            产品描述
          </div>

          <div class="description-grid">
            <div class="form-item">
              <label
                class="form-label"
                for="description-zh"
              >
                中文描述
              </label>

              <textarea
                id="description-zh"
                v-model="
                  form.descriptionZh
                "
                class="form-textarea"
                rows="5"
                placeholder="请输入产品中文描述"
                :disabled="submitting"
              ></textarea>
            </div>

            <div class="form-item">
              <label
                class="form-label"
                for="description-en"
              >
                英文描述
              </label>

              <textarea
                id="description-en"
                v-model="
                  form.descriptionEn
                "
                class="form-textarea"
                rows="5"
                placeholder="请输入产品英文描述"
                :disabled="submitting"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Supply -->
        <section class="form-section">
          <div class="section-title">
            供货信息
          </div>

          <div class="form-grid form-grid-4">
            <!-- Status -->
            <div class="form-item">
              <label
                class="form-label"
                for="status"
              >
                供货状态
              </label>

              <select
                id="status"
                v-model="form.status"
                class="form-select"
                :disabled="submitting"
              >
                <option
                  v-for="status in statusOptions"
                  :key="
                    status.value
                  "
                  :value="
                    status.value
                  "
                >
                  {{ status.label }}
                </option>
              </select>
            </div>

            <!-- Stock -->
            <div class="form-item">
              <label
                class="form-label"
                for="stock-quantity"
              >
                库存
              </label>

              <input
                id="stock-quantity"
                v-model="
                  form.stockQuantity
                "
                type="number"
                min="0"
                step="1"
                class="form-input"
                placeholder="例如：1000"
                :disabled="submitting"
              />
            </div>

            <!-- Unit -->
            <div class="form-item">
              <label
                class="form-label"
                for="unit"
              >
                单位
              </label>

              <input
                id="unit"
                v-model="form.unit"
                type="text"
                class="form-input"
                placeholder="pcs"
                maxlength="30"
                :disabled="submitting"
              />
            </div>

            <!-- Sort -->
            <div class="form-item">
              <label
                class="form-label"
                for="sort-order"
              >
                排序
              </label>

              <input
                id="sort-order"
                v-model="
                  form.sortOrder
                "
                type="number"
                min="0"
                step="1"
                class="form-input"
                placeholder="0"
                :disabled="submitting"
              />
            </div>
          </div>
        </section>

        <!-- Resources -->
        <section class="form-section">
          <div class="section-title">
            产品资料
          </div>

          <div class="form-grid">
            <!-- Datasheet -->
            <div class="form-item">
              <label
                class="form-label"
                for="datasheet-url"
              >
                Datasheet URL
              </label>

              <input
                id="datasheet-url"
                v-model="
                  form.datasheetUrl
                "
                type="url"
                class="form-input"
                placeholder="https://..."
                maxlength="1000"
                :disabled="submitting"
              />
            </div>

            <!-- Product Image -->
            <div class="form-item">
              <label class="form-label">
                产品图片
              </label>

              <div class="image-upload-area">
                <input
                  ref="imageFileInput"
                  type="file"
                  class="image-file-input"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  :disabled="
                    submitting ||
                    uploadingImage
                  "
                  @change="
                    handleImageSelect
                  "
                />

                <button
                  type="button"
                  class="image-upload-button"
                  :disabled="
                    submitting ||
                    uploadingImage
                  "
                  @click="
                    openImageFilePicker
                  "
                >
                  <span
                    v-if="
                      uploadingImage
                    "
                    class="upload-spinner"
                  ></span>

                  <span
                    v-else
                    class="upload-icon"
                  >
                    ↑
                  </span>

                  {{
                    uploadingImage
                      ? '正在上传...'
                      : form.imageUrl
                        ? '重新上传'
                        : '上传图片'
                  }}
                </button>

                <div class="image-upload-hint">
                  支持 JPG、JPEG、PNG、WEBP
                </div>

                <div class="image-upload-hint">
                  图片大小不超过 10MB
                </div>

                <div
                  v-if="
                    imageUploadError
                  "
                  class="image-upload-error"
                >
                  {{ imageUploadError }}
                </div>
              </div>
            </div>
          </div>

          <!-- Image Preview -->
          <div
            v-if="form.imageUrl"
            class="image-preview-wrapper"
          >
            <div
              class="image-preview-label"
            >
              图片预览
            </div>

            <div class="image-preview">
              <img
                :src="
                  getImageUrl(
                    form.imageUrl,
                  )
                "
                alt="产品图片预览"
                @error="
                  ($event) =>
                    (
                      $event.target as HTMLImageElement
                    ).style.display =
                      'none'
                "
              />
            </div>
          </div>
        </section>

        <!-- Other -->
        <section
          class="form-section last-section"
        >
          <div class="section-title">
            其他设置
          </div>

          <label class="featured-option">
            <input
              v-model="
                form.isFeatured
              "
              type="checkbox"
              :disabled="submitting"
            />

            <span>
              设为推荐产品
            </span>

            <small>
              推荐产品可以在首页或产品推荐区域展示
            </small>
          </label>
        </section>
      </div>

      <!-- Footer -->
      <footer class="modal-footer">
        <button
          type="button"
          class="btn btn-default"
          :disabled="
            submitting ||
            uploadingImage
          "
          @click="handleCancel"
        >
          取消
        </button>

        <button
          type="button"
          class="btn btn-primary"
          :disabled="
            submitting ||
            loading ||
            uploadingImage
          "
          @click="handleSubmit"
        >
          <span
            v-if="submitting"
            class="button-spinner"
          ></span>

          {{
            submitting
              ? '正在保存...'
              : '保存产品'
          }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────
   Modal Overlay
───────────────────────────────────────────── */

.modal-overlay {
  position: fixed;
  z-index: 2000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */

.product-modal {
  display: flex;
  overflow: hidden;
  width: min(1080px, 100%);
  max-height: calc(100vh - 48px);
  flex-direction: column;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  box-shadow:
    0 12px 40px
      rgba(0, 0, 0, 0.18);
}

/* ─────────────────────────────────────────────
   Header
───────────────────────────────────────────── */

.modal-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.modal-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

.modal-description {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.close-button {
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
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.close-button:hover:not(:disabled) {
  color: #606266;
  background: #f5f7fa;
}

.close-button:disabled {
  cursor: not-allowed;
}

/* ─────────────────────────────────────────────
   Body
───────────────────────────────────────────── */

.modal-body {
  overflow-y: auto;
  min-height: 0;
  background: #f5f7fa;
}

/* ─────────────────────────────────────────────
   Loading
───────────────────────────────────────────── */

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 360px;
  color: #909399;
  background: #f5f7fa;
  font-size: 13px;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #dcdfe6;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ─────────────────────────────────────────────
   Error
───────────────────────────────────────────── */

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 20px 0;
  padding: 12px 14px;
  color: #f56c6c;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  font-size: 13px;
}

.error-icon {
  display: inline-flex;
  flex-shrink: 0;
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

/* ─────────────────────────────────────────────
   Sections
───────────────────────────────────────────── */

.form-section {
  padding: 20px 24px;
  margin: 16px 20px 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 5px;
}

.last-section {
  margin-bottom: 16px;
}

.section-title {
  margin-bottom: 18px;
  color: #303133;
  font-size: 15px;
  font-weight: 600;
}

/* ─────────────────────────────────────────────
   Form Grid
───────────────────────────────────────────── */

.form-grid {
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, 1fr)
  );
  gap: 18px 20px;
}

.form-grid-4 {
  grid-template-columns: repeat(
    4,
    minmax(0, 1fr)
  );
}

.description-grid {
  display: grid;
  grid-template-columns: repeat(
    2,
    minmax(0, 1fr)
  );
  gap: 20px;
}

.form-item {
  min-width: 0;
}

/* ─────────────────────────────────────────────
   Labels
───────────────────────────────────────────── */

.form-label {
  display: block;
  margin-bottom: 7px;
  color: #606266;
  font-size: 13px;
}

.form-label.required::before {
  content: '*';
  margin-right: 4px;
  color: #f56c6c;
}

/* ─────────────────────────────────────────────
   Inputs
───────────────────────────────────────────── */

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
  padding: 0 11px;
}

.form-textarea {
  min-height: 130px;
  padding: 9px 11px;
  resize: vertical;
  line-height: 1.6;
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
  color: #909399;
  background: #f5f7fa;
  cursor: not-allowed;
}

/* ─────────────────────────────────────────────
   Image Upload
───────────────────────────────────────────── */

.image-upload-area {
  display: flex;
  min-height: 92px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.image-file-input {
  display: none;
}

.image-upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  height: 36px;
  padding: 0 16px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s;
}

.image-upload-button:hover:not(
    :disabled
  ) {
  color: #409eff;
  border-color: #409eff;
  background: #f5faff;
}

.image-upload-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-icon {
  margin-right: 7px;
  font-size: 17px;
  line-height: 1;
}

.upload-spinner {
  width: 14px;
  height: 14px;
  margin-right: 7px;
  border: 2px solid #dcdfe6;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.image-upload-hint {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.image-upload-error {
  margin-top: 7px;
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
}

/* ─────────────────────────────────────────────
   Image Preview
───────────────────────────────────────────── */

.image-preview-wrapper {
  margin-top: 18px;
}

.image-preview-label {
  margin-bottom: 8px;
  color: #606266;
  font-size: 13px;
}

.image-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 120px;
  overflow: hidden;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.image-preview img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ─────────────────────────────────────────────
   Featured
───────────────────────────────────────────── */

.featured-option {
  display: grid;
  grid-template-columns:
    18px auto 1fr;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
}

.featured-option input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #409eff;
}

.featured-option small {
  color: #909399;
  font-size: 12px;
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */

.modal-footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

/* ─────────────────────────────────────────────
   Buttons
───────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-width: 80px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-default {
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
}

.btn-default:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.button-spinner {
  width: 14px;
  height: 14px;
  margin-right: 7px;
  border: 2px solid
    rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ─────────────────────────────────────────────
   Animation
───────────────────────────────────────────── */

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─────────────────────────────────────────────
   Responsive
───────────────────────────────────────────── */

@media (max-width: 900px) {
  .modal-overlay {
    padding: 12px;
  }

  .product-modal {
    max-height: calc(100vh - 24px);
  }

  .form-grid-4 {
    grid-template-columns: repeat(
      2,
      minmax(0, 1fr)
    );
  }
}

@media (max-width: 700px) {
  .modal-header {
    padding: 16px 18px;
  }

  .form-section {
    padding: 18px;
    margin: 12px 12px 0;
  }

  .error-message {
    margin: 12px 12px 0;
  }

  .form-grid,
  .description-grid,
  .form-grid-4 {
    grid-template-columns: 1fr;
  }

  .featured-option {
    grid-template-columns:
      18px auto;
  }

  .featured-option small {
    grid-column: 2;
  }

  .modal-footer {
    padding: 14px 18px;
  }
}
</style>
