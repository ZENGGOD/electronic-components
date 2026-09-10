<script setup lang="ts">
import {
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

// ─────────────────────────────────────────────
// Props / Emits
// ─────────────────────────────────────────────

const props = defineProps<{
  productId: number | null
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ProductStatus =
  | 'In Stock'
  | 'Available'
  | 'Request Quote'
  | 'Discontinued'

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

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

const loading = ref(false)

const errorMessage = ref('')

const product =
  ref<ProductDetail | null>(null)

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
// Format
// ─────────────────────────────────────────────

function formatStock(): string {
  if (
    !product.value ||
    product.value.stockQuantity ===
      null ||
    product.value.stockQuantity ===
      undefined
  ) {
    return '-'
  }

  return `${product.value.stockQuantity.toLocaleString()} ${product.value.unit || 'pcs'}`
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return '-'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  )
}

// ─────────────────────────────────────────────
// Load Product
// ─────────────────────────────────────────────

async function fetchProduct(): Promise<void> {
  if (!props.productId) {
    product.value = null

    errorMessage.value =
      '产品不存在'

    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()

    return
  }

  loading.value = true

  errorMessage.value = ''

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/products/${props.productId}`,
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

    if (
      response.status === 404
    ) {
      errorMessage.value =
        '产品不存在'

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
          '获取产品详情失败',
      )
    }

    product.value =
      result.data ?? null

    if (!product.value) {
      errorMessage.value =
        '产品不存在'
    }
  } catch (error) {
    console.error(
      'Failed to fetch product detail:',
      error,
    )

    errorMessage.value =
      error instanceof Error
        ? error.message
        : '获取产品详情失败'
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────
// Close
// ─────────────────────────────────────────────

function handleClose(): void {
  emit('close')
}

function handleBackdropClick(
  event: MouseEvent,
): void {
  if (
    event.target ===
    event.currentTarget
  ) {
    handleClose()
  }
}

// ─────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <div
    class="product-view-overlay"
    @click="handleBackdropClick"
  >
    <div
      class="product-view-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-view-title"
    >
      <!-- Header -->
      <div
        class="modal-header"
      >
        <div>
          <h2
            id="product-view-title"
            class="modal-title"
          >
            产品详情
          </h2>

          <p
            v-if="product"
            class="modal-subtitle"
          >
            {{ product.partNumber }}
          </p>
        </div>

        <button
          type="button"
          class="modal-close"
          aria-label="关闭"
          @click="handleClose"
        >
          ×
        </button>
      </div>

      <!-- Body -->
      <div
        class="modal-body"
      >
        <!-- Loading -->
        <div
          v-if="loading"
          class="loading-state"
        >
          <span
            class="loading-spinner"
          ></span>

          <span>
            正在加载产品详情...
          </span>
        </div>

        <!-- Error -->
        <div
          v-else-if="
            errorMessage
          "
          class="error-state"
        >
          <div
            class="error-state-icon"
          >
            !
          </div>

          <div
            class="error-state-title"
          >
            无法加载产品详情
          </div>

          <div
            class="error-state-message"
          >
            {{ errorMessage }}
          </div>

          <button
            type="button"
            class="retry-button"
            @click="fetchProduct"
          >
            重新加载
          </button>
        </div>

        <!-- Product -->
        <div
          v-else-if="product"
          class="product-detail"
        >
          <!-- Product Top -->
          <div
            class="product-top"
          >
            <!-- Image -->
            <div
              class="product-image-section"
            >
              <div
                class="product-image-frame"
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
                  class="product-main-image"
                />

                <div
                  v-else
                  class="product-image-empty"
                >
                  <div
                    class="image-empty-icon"
                  >
                    📦
                  </div>

                  <div
                    class="image-empty-text"
                  >
                    暂无产品图片
                  </div>
                </div>
              </div>
            </div>

            <!-- Basic -->
            <div
              class="product-basic"
            >
              <div
                class="product-part-number"
              >
                {{ product.partNumber }}
              </div>

              <h3
                class="product-title-zh"
              >
                {{
                  product.titleZh ||
                  '-'
                }}
              </h3>

              <div
                class="product-title-en"
              >
                {{
                  product.titleEn ||
                  '-'
                }}
              </div>

              <div
                class="product-status-row"
              >
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

                <span
                  v-if="
                    product.isFeatured
                  "
                  class="featured-tag"
                >
                  ★ 推荐产品
                </span>
              </div>
            </div>
          </div>

          <!-- Basic Information -->
          <section
            class="detail-section"
          >
            <div
              class="section-title"
            >
              基本信息
            </div>

            <div
              class="detail-grid"
            >
              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  产品型号
                </div>

                <div
                  class="detail-value part-number-value"
                >
                  {{
                    product.partNumber ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  厂商
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    product
                      .manufacturer
                      ?.name ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  分类
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    product
                      .category
                      ?.nameZh ||
                    product
                      .category
                      ?.nameEn ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  英文分类
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    product
                      .category
                      ?.nameEn ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  封装
                </div>

                <div
                  class="detail-value package-value"
                >
                  {{
                    product.package ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  状态
                </div>

                <div
                  class="detail-value"
                >
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
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  库存
                </div>

                <div
                  class="detail-value stock-value"
                >
                  {{ formatStock() }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  单位
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    product.unit ||
                    '-'
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  推荐产品
                </div>

                <div
                  class="detail-value"
                >
                  <span
                    v-if="
                      product.isFeatured
                    "
                    class="boolean-yes"
                  >
                    是
                  </span>

                  <span
                    v-else
                    class="boolean-no"
                  >
                    否
                  </span>
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  排序
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    product.sortOrder
                  }}
                </div>
              </div>
            </div>
          </section>

          <!-- Product Names -->
          <section
            class="detail-section"
          >
            <div
              class="section-title"
            >
              产品名称
            </div>

            <div
              class="text-detail"
            >
              <div
                class="text-detail-label"
              >
                中文名称
              </div>

              <div
                class="text-detail-content"
              >
                {{
                  product.titleZh ||
                  '-'
                }}
              </div>
            </div>

            <div
              class="text-detail"
            >
              <div
                class="text-detail-label"
              >
                英文名称
              </div>

              <div
                class="text-detail-content"
              >
                {{
                  product.titleEn ||
                  '-'
                }}
              </div>
            </div>
          </section>

          <!-- Description -->
          <section
            class="detail-section"
          >
            <div
              class="section-title"
            >
              产品描述
            </div>

            <div
              class="description-block"
            >
              <div
                class="description-label"
              >
                中文描述
              </div>

              <div
                class="description-content"
              >
                {{
                  product.descriptionZh ||
                  '暂无中文描述'
                }}
              </div>
            </div>

            <div
              class="description-block"
            >
              <div
                class="description-label"
              >
                English Description
              </div>

              <div
                class="description-content english"
              >
                {{
                  product.descriptionEn ||
                  'No English description'
                }}
              </div>
            </div>
          </section>

          <!-- Datasheet -->
          <section
            class="detail-section"
          >
            <div
              class="section-title"
            >
              技术资料
            </div>

            <div
              class="datasheet-row"
            >
              <div
                class="datasheet-label"
              >
                数据手册
              </div>

              <div
                class="datasheet-value"
              >
                <a
                  v-if="
                    product.datasheetUrl
                  "
                  :href="
                    product.datasheetUrl
                  "
                  target="_blank"
                  rel="noopener noreferrer"
                  class="datasheet-link"
                >
                  查看数据手册
                  ↗
                </a>

                <span
                  v-else
                  class="empty-value"
                >
                  暂无数据手册
                </span>
              </div>
            </div>
          </section>

          <!-- System Information -->
          <section
            class="detail-section system-section"
          >
            <div
              class="section-title"
            >
              系统信息
            </div>

            <div
              class="detail-grid system-grid"
            >
              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  产品 ID
                </div>

                <div
                  class="detail-value"
                >
                  {{ product.id }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  创建时间
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    formatDate(
                      product.createdAt,
                    )
                  }}
                </div>
              </div>

              <div
                class="detail-item"
              >
                <div
                  class="detail-label"
                >
                  更新时间
                </div>

                <div
                  class="detail-value"
                >
                  {{
                    formatDate(
                      product.updatedAt,
                    )
                  }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="modal-footer"
      >
        <div
          class="readonly-tip"
        >
          <span
            class="readonly-icon"
          >
            i
          </span>

          <span>
            当前为只读查看模式
          </span>
        </div>

        <button
          type="button"
          class="close-button"
          @click="handleClose"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────
   Overlay
───────────────────────────────────────────── */

.product-view-overlay {
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

  animation:
    overlay-fade-in 0.2s ease;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ─────────────────────────────────────────────
   Modal
───────────────────────────────────────────── */

.product-view-modal {
  display: flex;

  width: 100%;

  max-width: 920px;

  max-height: calc(
    100vh - 48px
  );

  flex-direction: column;

  background: #fff;

  border-radius: 6px;

  box-shadow:
    0 12px 40px
      rgba(0, 0, 0, 0.18),
    0 4px 12px
      rgba(0, 0, 0, 0.08);

  overflow: hidden;

  animation:
    modal-slide-in 0.22s ease;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;

    transform:
      translateY(12px)
      scale(0.985);
  }

  to {
    opacity: 1;

    transform:
      translateY(0)
      scale(1);
  }
}

/* ─────────────────────────────────────────────
   Header
───────────────────────────────────────────── */

.modal-header {
  display: flex;

  align-items: center;
  justify-content: space-between;

  min-height: 68px;

  padding: 0 24px;

  border-bottom: 1px solid #ebeef5;

  background: #fff;

  flex-shrink: 0;
}

.modal-title {
  margin: 0;

  color: #303133;

  font-size: 18px;

  font-weight: 600;

  line-height: 1.4;
}

.modal-subtitle {
  margin: 4px 0 0;

  color: #909399;

  font-family:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    monospace;

  font-size: 12px;
}

.modal-close {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  padding: 0;

  color: #909399;

  background: transparent;

  border: 0;

  border-radius: 4px;

  font-size: 24px;

  line-height: 1;

  cursor: pointer;

  transition:
    color 0.2s,
    background-color 0.2s;
}

.modal-close:hover {
  color: #606266;

  background: #f5f7fa;
}

/* ─────────────────────────────────────────────
   Body
───────────────────────────────────────────── */

.modal-body {
  flex: 1;

  min-height: 0;

  padding: 24px;

  overflow-y: auto;

  background: #fff;
}

/* ─────────────────────────────────────────────
   Loading
───────────────────────────────────────────── */

.loading-state {
  display: flex;

  align-items: center;
  justify-content: center;

  min-height: 420px;

  gap: 10px;

  color: #909399;

  font-size: 13px;
}

.loading-spinner {
  display: inline-block;

  width: 18px;
  height: 18px;

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
   Error
───────────────────────────────────────────── */

.error-state {
  display: flex;

  align-items: center;
  justify-content: center;

  min-height: 420px;

  flex-direction: column;

  text-align: center;
}

.error-state-icon {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  margin-bottom: 14px;

  color: #fff;

  background: #f56c6c;

  border-radius: 50%;

  font-size: 22px;

  font-weight: 600;
}

.error-state-title {
  margin-bottom: 6px;

  color: #606266;

  font-size: 15px;

  font-weight: 500;
}

.error-state-message {
  max-width: 500px;

  color: #909399;

  font-size: 13px;

  line-height: 1.6;
}

.retry-button {
  height: 34px;

  margin-top: 18px;

  padding: 0 16px;

  color: #409eff;

  background: #fff;

  border: 1px solid #b3d8ff;

  border-radius: 4px;

  font-size: 13px;

  cursor: pointer;
}

.retry-button:hover {
  background: #ecf5ff;

  border-color: #409eff;
}

/* ─────────────────────────────────────────────
   Product Top
───────────────────────────────────────────── */

.product-top {
  display: flex;

  gap: 28px;

  padding-bottom: 24px;

  border-bottom: 1px solid #ebeef5;
}

.product-image-section {
  width: 220px;

  flex-shrink: 0;
}

.product-image-frame {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 220px;
  height: 220px;

  background: #fafafa;

  border: 1px solid #ebeef5;

  border-radius: 5px;

  overflow: hidden;
}

.product-main-image {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;

  background: #fff;
}

.product-image-empty {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  flex-direction: column;

  background: #f5f7fa;
}

.image-empty-icon {
  margin-bottom: 10px;

  color: #c0c4cc;

  font-size: 42px;

  opacity: 0.75;
}

.image-empty-text {
  color: #c0c4cc;

  font-size: 13px;
}

.product-basic {
  min-width: 0;

  padding-top: 4px;
}

.product-part-number {
  margin-bottom: 10px;

  color: #409eff;

  font-family:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    monospace;

  font-size: 16px;

  font-weight: 600;

  line-height: 1.5;
}

.product-title-zh {
  margin: 0 0 8px;

  color: #303133;

  font-size: 22px;

  font-weight: 600;

  line-height: 1.45;
}

.product-title-en {
  color: #606266;

  font-size: 15px;

  line-height: 1.6;
}

.product-status-row {
  display: flex;

  align-items: center;

  gap: 8px;

  margin-top: 18px;

  flex-wrap: wrap;
}

/* ─────────────────────────────────────────────
   Status
───────────────────────────────────────────── */

.status-tag {
  display: inline-block;

  min-width: 58px;

  padding: 4px 9px;

  border: 1px solid transparent;

  border-radius: 3px;

  text-align: center;

  font-size: 12px;

  line-height: 1.3;
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

.featured-tag {
  display: inline-block;

  padding: 4px 9px;

  color: #e6a23c;

  background: #fdf6ec;

  border: 1px solid #faecd8;

  border-radius: 3px;

  font-size: 12px;

  line-height: 1.3;
}

/* ─────────────────────────────────────────────
   Detail Section
───────────────────────────────────────────── */

.detail-section {
  padding: 22px 0;

  border-bottom: 1px solid #ebeef5;
}

.detail-section:last-child {
  border-bottom: 0;
}

.section-title {
  position: relative;

  margin-bottom: 18px;

  padding-left: 10px;

  color: #303133;

  font-size: 15px;

  font-weight: 600;

  line-height: 1.4;
}

.section-title::before {
  position: absolute;

  top: 2px;
  bottom: 2px;
  left: 0;

  width: 3px;

  background: #409eff;

  border-radius: 2px;

  content: '';
}

.detail-grid {
  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );

  column-gap: 36px;

  row-gap: 0;
}

.detail-item {
  display: grid;

  grid-template-columns: 90px minmax(
      0,
      1fr
    );

  min-height: 42px;

  align-items: center;

  border-bottom: 1px dashed #f0f0f0;
}

.detail-label {
  color: #909399;

  font-size: 13px;
}

.detail-value {
  min-width: 0;

  color: #606266;

  font-size: 13px;

  line-height: 1.5;

  word-break: break-word;
}

.part-number-value {
  color: #409eff;

  font-family:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    monospace;

  font-weight: 500;
}

.package-value {
  font-family:
    'SFMono-Regular',
    Consolas,
    'Liberation Mono',
    monospace;
}

.stock-value {
  color: #303133;

  font-weight: 500;
}

.boolean-yes {
  color: #67c23a;

  font-weight: 500;
}

.boolean-no {
  color: #909399;
}

/* ─────────────────────────────────────────────
   Text Detail
───────────────────────────────────────────── */

.text-detail {
  display: grid;

  grid-template-columns: 90px minmax(
      0,
      1fr
    );

  padding: 10px 0;

  border-bottom: 1px dashed #f0f0f0;
}

.text-detail:last-child {
  border-bottom: 0;
}

.text-detail-label {
  color: #909399;

  font-size: 13px;
}

.text-detail-content {
  min-width: 0;

  color: #606266;

  font-size: 13px;

  line-height: 1.6;

  word-break: break-word;
}

/* ─────────────────────────────────────────────
   Description
───────────────────────────────────────────── */

.description-block {
  margin-bottom: 18px;
}

.description-block:last-child {
  margin-bottom: 0;
}

.description-label {
  margin-bottom: 8px;

  color: #909399;

  font-size: 13px;
}

.description-content {
  min-height: 46px;

  padding: 12px 14px;

  color: #606266;

  background: #fafafa;

  border: 1px solid #ebeef5;

  border-radius: 4px;

  font-size: 13px;

  line-height: 1.7;

  white-space: pre-wrap;

  word-break: break-word;
}

.description-content.english {
  font-family:
    Arial,
    'Helvetica Neue',
    sans-serif;
}

/* ─────────────────────────────────────────────
   Datasheet
───────────────────────────────────────────── */

.datasheet-row {
  display: grid;

  grid-template-columns: 90px minmax(
      0,
      1fr
    );

  align-items: center;
}

.datasheet-label {
  color: #909399;

  font-size: 13px;
}

.datasheet-value {
  min-width: 0;
}

.datasheet-link {
  color: #409eff;

  font-size: 13px;

  text-decoration: none;
}

.datasheet-link:hover {
  color: #66b1ff;

  text-decoration: underline;
}

.empty-value {
  color: #c0c4cc;
}

/* ─────────────────────────────────────────────
   System
───────────────────────────────────────────── */

.system-section {
  padding-bottom: 4px;
}

.system-grid {
  grid-template-columns:
    repeat(
      3,
      minmax(0, 1fr)
    );
}

.system-grid
  .detail-item {
  grid-template-columns: 70px minmax(
      0,
      1fr
    );
}

/* ─────────────────────────────────────────────
   Footer
───────────────────────────────────────────── */

.modal-footer {
  display: flex;

  align-items: center;
  justify-content: space-between;

  min-height: 64px;

  padding: 0 24px;

  background: #fafafa;

  border-top: 1px solid #ebeef5;

  flex-shrink: 0;
}

.readonly-tip {
  display: flex;

  align-items: center;

  gap: 7px;

  color: #909399;

  font-size: 12px;
}

.readonly-icon {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  width: 17px;
  height: 17px;

  color: #fff;

  background: #909399;

  border-radius: 50%;

  font-size: 11px;

  font-weight: 600;
}

.close-button {
  height: 34px;

  padding: 0 18px;

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

.close-button:hover {
  color: #409eff;

  background: #fff;

  border-color: #409eff;
}

/* ─────────────────────────────────────────────
   Responsive
───────────────────────────────────────────── */

@media (max-width: 800px) {
  .product-view-overlay {
    padding: 12px;
  }

  .product-view-modal {
    max-height: calc(
      100vh - 24px
    );
  }

  .modal-header,
  .modal-footer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .modal-body {
    padding: 18px;
  }

  .product-top {
    gap: 18px;
  }

  .product-image-section,
  .product-image-frame {
    width: 170px;
    height: 170px;
  }

  .product-title-zh {
    font-size: 19px;
  }

  .detail-grid,
  .system-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .product-top {
    align-items: center;

    flex-direction: column;
  }

  .product-image-section,
  .product-image-frame {
    width: 180px;
    height: 180px;
  }

  .product-basic {
    width: 100%;

    text-align: center;
  }

  .product-status-row {
    justify-content: center;
  }

  .detail-item,
  .text-detail,
  .datasheet-row {
    grid-template-columns: 80px minmax(
        0,
        1fr
      );
  }

  .modal-footer {
    align-items: flex-start;

    gap: 12px;

    flex-direction: column;

    padding-top: 12px;
    padding-bottom: 12px;
  }

  .close-button {
    width: 100%;
  }
}
</style>
