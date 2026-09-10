<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type QuoteRequestStatus =
  | 'New'
  | 'Processing'
  | 'Quoted'
  | 'Completed'
  | 'Cancelled'

interface QuoteRequestItem {
  id: number
  quoteRequestId: number
  productId: number | null
  partNumber: string
  manufacturer: string | null
  quantity: number | null
  unit: string
  targetPrice: number | null
  deliveryDate: string | null
  technicalRequirements: string | null
  productTitleZh: string | null
  productTitleEn: string | null
  createdAt: string
}

interface QuoteRequest {
  id: number
  quoteNo: string
  company: string | null
  contactName: string
  businessEmail: string
  phone: string | null
  requirements: string | null
  status: QuoteRequestStatus
  adminNote: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface QuoteRequestDetail
  extends QuoteRequest {
  items: QuoteRequestItem[]
}

interface QuoteListResponse {
  success: boolean
  data?: {
    items: QuoteRequest[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  message?: string
}

interface QuoteDetailResponse {
  success: boolean
  data?: QuoteRequestDetail
  message?: string
}

interface QuoteUpdateResponse {
  success: boolean
  data?: QuoteRequestDetail
  message?: string
}

interface QuoteDeleteResponse {
  success: boolean
  message?: string
}

const API_BASE =
  '/api/admin/quote-requests'

const statuses: Array<{
  value: '' | QuoteRequestStatus
  label: string
}> = [
  {
    value: '',
    label: '全部状态',
  },
  {
    value: 'New',
    label: '新询价',
  },
  {
    value: 'Processing',
    label: '处理中',
  },
  {
    value: 'Quoted',
    label: '已报价',
  },
  {
    value: 'Completed',
    label: '已完成',
  },
  {
    value: 'Cancelled',
    label: '已取消',
  },
]

const quoteRequests =
  ref<QuoteRequest[]>([])

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const keyword = ref('')
const statusFilter =
  ref<'' | QuoteRequestStatus>('')

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const selectedQuote =
  ref<QuoteRequestDetail | null>(null)

const showDetailModal = ref(false)

const editStatus =
  ref<QuoteRequestStatus>('New')

const editAdminNote = ref('')

const toastMessage = ref('')
const toastType =
  ref<'success' | 'error'>('success')

let toastTimer:
  ReturnType<typeof setTimeout> | null =
  null

const pageNumbers = computed(() => {
  const current = page.value
  const last = totalPages.value

  if (last <= 1) {
    return [1]
  }

  const result: number[] = []

  const start = Math.max(
    1,
    current - 2,
  )

  const end = Math.min(
    last,
    current + 2,
  )

  for (
    let index = start;
    index <= end;
    index += 1
  ) {
    result.push(index)
  }

  return result
})

function getToken(): string | null {
  return localStorage.getItem(
    'admin_token',
  )
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

/**
 * 统一解析服务器响应
 *
 * 后端正常返回：
 * {
 *   "success": true,
 *   "data": {
 *     "items": [],
 *     "total": 2,
 *     "page": 1,
 *     "pageSize": 20,
 *     "totalPages": 1
 *   }
 * }
 */
async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get(
      'content-type',
    ) ?? ''

  /*
   * 后端 API 应该返回 application/json。
   *
   * 如果返回 text/html，
   * 通常说明请求被 Vite fallback 成 index.html，
   * 或者请求没有正确进入后端 API。
   */
  if (
    !contentType
      .toLowerCase()
      .includes('application/json')
  ) {
    const text =
      await response.text()

    console.error(
      'Unexpected response content type:',
      contentType,
    )

    console.error(
      'Response status:',
      response.status,
      response.statusText,
    )

    console.error(
      'Response body:',
      text,
    )

    if (
      text
        .trim()
        .toLowerCase()
        .startsWith('<!doctype html')
      ||
      text
        .trim()
        .toLowerCase()
        .startsWith('<html')
    ) {
      throw new Error(
        'API 返回了 HTML 页面，而不是 JSON，请检查 Vite API 代理和后端服务是否正常运行',
      )
    }

    throw new Error(
      '服务器返回的不是 JSON 数据',
    )
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.error(
      'JSON parse error:',
      error,
    )

    throw new Error(
      '服务器返回的数据格式错误',
    )
  }
}

function showToast(
  message: string,
  type: 'success' | 'error' = 'success',
): void {
  toastMessage.value = message
  toastType.value = type

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

function getStatusLabel(
  status: QuoteRequestStatus,
): string {
  const item =
    statuses.find(
      (entry) =>
        entry.value === status,
    )

  return item?.label ?? status
}

function getStatusClass(
  status: QuoteRequestStatus,
): string {
  return `status-${status.toLowerCase()}`
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

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
      hour12: false,
    },
  )
}

function formatDateOnly(
  value: string | null | undefined,
): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'zh-CN',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  )
}

function formatPrice(
  value: number | null,
): string {
  if (value === null) {
    return '-'
  }

  return Number(value).toFixed(6)
}

/**
 * 获取询价列表
 */
async function fetchQuoteRequests(): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  loading.value = true

  try {
    const params =
      new URLSearchParams()

    params.set(
      'page',
      String(page.value),
    )

    params.set(
      'pageSize',
      String(pageSize.value),
    )

    if (keyword.value.trim()) {
      params.set(
        'keyword',
        keyword.value.trim(),
      )
    }

    if (statusFilter.value) {
      params.set(
        'status',
        statusFilter.value,
      )
    }

    const response =
      await fetch(
        `${API_BASE}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
            'Cache-Control':
              'no-cache',
          },
          cache: 'no-store',
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse<QuoteListResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '获取询价列表失败',
      )
    }

    /*
     * 严格检查后端 data 结构
     */
    if (
      !result.data ||
      !Array.isArray(
        result.data.items,
      )
    ) {
      console.error(
        'Invalid quote list response:',
        result,
      )

      throw new Error(
        '服务器返回的数据格式错误：询价列表结构不正确',
      )
    }

    quoteRequests.value =
      result.data.items

    total.value =
      result.data.total

    page.value =
      result.data.page

    pageSize.value =
      result.data.pageSize

    totalPages.value =
      result.data.totalPages
  } catch (error) {
    console.error(
      'Fetch quote requests error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取询价列表失败',
      'error',
    )
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  fetchQuoteRequests()
}

function handleStatusChange(): void {
  page.value = 1
  fetchQuoteRequests()
}

function clearSearch(): void {
  keyword.value = ''
  statusFilter.value = ''
  page.value = 1

  fetchQuoteRequests()
}

function changePage(
  nextPage: number,
): void {
  if (
    nextPage < 1 ||
    nextPage > totalPages.value ||
    nextPage === page.value
  ) {
    return
  }

  page.value = nextPage

  fetchQuoteRequests()
}

function previousPage(): void {
  changePage(page.value - 1)
}

function nextPage(): void {
  changePage(page.value + 1)
}

/**
 * 获取询价详情
 */
async function openDetail(
  id: number,
): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  showDetailModal.value = true
  selectedQuote.value = null
  detailLoading.value = true

  try {
    const response =
      await fetch(
        `${API_BASE}/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
            'Cache-Control':
              'no-cache',
          },
          cache: 'no-store',
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse<QuoteDetailResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '获取询价详情失败',
      )
    }

    if (!result.data) {
      throw new Error(
        '询价详情不存在',
      )
    }

    if (
      !Array.isArray(
        result.data.items,
      )
    ) {
      console.error(
        'Invalid quote detail response:',
        result,
      )

      throw new Error(
        '服务器返回的数据格式错误：询价产品明细结构不正确',
      )
    }

    selectedQuote.value =
      result.data

    editStatus.value =
      result.data.status

    editAdminNote.value =
      result.data.adminNote ?? ''
  } catch (error) {
    console.error(
      'Get quote detail error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取询价详情失败',
      'error',
    )

    showDetailModal.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetail(): void {
  if (saving.value) {
    return
  }

  showDetailModal.value = false
  selectedQuote.value = null
}

/**
 * 保存询价处理信息
 */
async function saveQuote(): Promise<void> {
  if (!selectedQuote.value) {
    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  saving.value = true

  try {
    const response =
      await fetch(
        `${API_BASE}/${selectedQuote.value.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            'Cache-Control':
              'no-cache',
          },
          cache: 'no-store',
          body: JSON.stringify({
            status:
              editStatus.value,
            adminNote:
              editAdminNote.value.trim() ||
              null,
          }),
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse<QuoteUpdateResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '更新询价失败',
      )
    }

    if (
      result.data &&
      Array.isArray(
        result.data.items,
      )
    ) {
      selectedQuote.value =
        result.data

      editStatus.value =
        result.data.status

      editAdminNote.value =
        result.data.adminNote ?? ''
    }

    showToast(
      '询价信息更新成功',
      'success',
    )

    await fetchQuoteRequests()
  } catch (error) {
    console.error(
      'Update quote request error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '更新询价失败',
      'error',
    )
  } finally {
    saving.value = false
  }
}

/**
 * 删除询价
 */
async function deleteQuote(
  quote: QuoteRequest,
): Promise<void> {
  const confirmed =
    window.confirm(
      `确定要删除询价单 ${quote.quoteNo} 吗？\n\n删除后对应的询价产品明细也将无法恢复。`,
    )

  if (!confirmed) {
    return
  }

  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  deleting.value = true

  try {
    const response =
      await fetch(
        `${API_BASE}/${quote.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              'application/json',
            'Cache-Control':
              'no-cache',
          },
          cache: 'no-store',
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse<QuoteDeleteResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '删除询价失败',
      )
    }

    showToast(
      '询价单删除成功',
      'success',
    )

    if (
      showDetailModal.value &&
      selectedQuote.value?.id ===
        quote.id
    ) {
      closeDetail()
    }

    if (
      quoteRequests.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1
    }

    await fetchQuoteRequests()
  } catch (error) {
    console.error(
      'Delete quote request error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '删除询价失败',
      'error',
    )
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchQuoteRequests()
})
</script>

<template>
  <div class="quote-page">
    <div class="page-header">
      <div>
        <h1>询价管理</h1>

        <p>
          管理客户提交的询价单、产品明细及处理状态
        </p>
      </div>

      <button
        class="refresh-btn"
        type="button"
        :disabled="loading"
        @click="fetchQuoteRequests"
      >
        <span
          v-if="loading"
          class="loading-spinner small"
        ></span>

        <span v-else>↻</span>

        刷新
      </button>
    </div>

    <!-- Search -->
    <section class="search-panel">
      <div class="search-row">
        <div
          class="search-field keyword-field"
        >
          <label>关键词</label>

          <input
            v-model="keyword"
            type="text"
            placeholder="询价单号 / 公司 / 联系人 / 邮箱 / 电话 / 型号 / 厂商"
            @keyup.enter="handleSearch"
          />
        </div>

        <div
          class="search-field status-field"
        >
          <label>状态</label>

          <select
            v-model="statusFilter"
            @change="handleStatusChange"
          >
            <option
              v-for="item in statuses"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select>
        </div>

        <div class="search-actions">
          <button
            class="primary-btn"
            type="button"
            @click="handleSearch"
          >
            搜索
          </button>

          <button
            class="secondary-btn"
            type="button"
            @click="clearSearch"
          >
            重置
          </button>
        </div>
      </div>
    </section>

    <!-- Statistics -->
    <div class="statistics">
      <div class="stat-card">
        <div class="stat-label">
          当前结果
        </div>

        <div class="stat-value">
          {{ total }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          新询价
        </div>

        <div class="stat-value">
          {{
            quoteRequests.filter(
              (item) =>
                item.status === 'New',
            ).length
          }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          处理中
        </div>

        <div class="stat-value">
          {{
            quoteRequests.filter(
              (item) =>
                item.status ===
                'Processing',
            ).length
          }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          已完成
        </div>

        <div class="stat-value">
          {{
            quoteRequests.filter(
              (item) =>
                item.status ===
                'Completed',
            ).length
          }}
        </div>
      </div>
    </div>

    <!-- Table -->
    <section class="table-panel">
      <div class="table-wrapper">
        <table class="quote-table">
          <thead>
            <tr>
              <th>询价单号</th>
              <th>客户 / 公司</th>
              <th>联系方式</th>
              <th>产品数量</th>
              <th>状态</th>
              <th>提交时间</th>
              <th class="action-column">
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td
                colspan="7"
                class="empty-cell"
              >
                <div class="loading-state">
                  <span
                    class="loading-spinner"
                  ></span>

                  正在加载询价数据...
                </div>
              </td>
            </tr>

            <tr
              v-else-if="
                quoteRequests.length === 0
              "
            >
              <td
                colspan="7"
                class="empty-cell"
              >
                <div class="empty-state">
                  <div class="empty-icon">
                    ♢
                  </div>

                  <div>
                    暂无询价记录
                  </div>

                  <small>
                    尝试修改搜索条件
                  </small>
                </div>
              </td>
            </tr>

            <tr
              v-for="quote in quoteRequests"
              v-else
              :key="quote.id"
            >
              <td>
                <div class="quote-no">
                  {{ quote.quoteNo }}
                </div>
              </td>

              <td>
                <div class="customer-cell">
                  <strong>
                    {{
                      quote.company ||
                      '个人客户'
                    }}
                  </strong>

                  <span>
                    {{ quote.contactName }}
                  </span>
                </div>
              </td>

              <td>
                <div class="contact-cell">
                  <span>
                    {{ quote.businessEmail }}
                  </span>

                  <span
                    v-if="quote.phone"
                  >
                    {{ quote.phone }}
                  </span>
                </div>
              </td>

              <td>
                <span class="item-count">
                  {{ quote.itemCount }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    getStatusClass(
                      quote.status,
                    )
                  "
                >
                  {{
                    getStatusLabel(
                      quote.status,
                    )
                  }}
                </span>
              </td>

              <td>
                <span class="date-text">
                  {{
                    formatDate(
                      quote.createdAt,
                    )
                  }}
                </span>
              </td>

              <td
                class="action-column"
              >
                <div class="actions">
                  <button
                    class="action-btn view"
                    type="button"
                    @click="
                      openDetail(
                        quote.id,
                      )
                    "
                  >
                    查看
                  </button>

                  <button
                    class="action-btn delete"
                    type="button"
                    :disabled="deleting"
                    @click="
                      deleteQuote(
                        quote,
                      )
                    "
                  >
                    删除
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
          totalPages > 0
        "
        class="pagination"
      >
        <div class="pagination-info">
          共
          <strong>{{ total }}</strong>
          条，第
          <strong>{{ page }}</strong>
          /
          <strong>{{ totalPages }}</strong>
          页
        </div>

        <div class="pagination-buttons">
          <button
            type="button"
            :disabled="page <= 1"
            @click="previousPage"
          >
            上一页
          </button>

          <button
            v-for="pageNumber in pageNumbers"
            :key="pageNumber"
            type="button"
            :class="{
              active:
                pageNumber === page,
            }"
            @click="
              changePage(
                pageNumber,
              )
            "
          >
            {{ pageNumber }}
          </button>

          <button
            type="button"
            :disabled="
              page >= totalPages
            "
            @click="nextPage"
          >
            下一页
          </button>
        </div>
      </div>
    </section>

    <!-- Detail Modal -->
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div class="detail-modal">
        <div class="modal-header">
          <div>
            <h2>
              {{
                selectedQuote
                  ? selectedQuote.quoteNo
                  : '询价详情'
              }}
            </h2>

            <p
              v-if="selectedQuote"
            >
              创建于
              {{
                formatDate(
                  selectedQuote.createdAt,
                )
              }}
            </p>
          </div>

          <button
            class="close-btn"
            type="button"
            :disabled="saving"
            @click="closeDetail"
          >
            ×
          </button>
        </div>

        <div
          v-if="detailLoading"
          class="modal-loading"
        >
          <span
            class="loading-spinner"
          ></span>

          正在加载询价详情...
        </div>

        <div
          v-else-if="selectedQuote"
          class="modal-body"
        >
          <!-- Customer -->
          <section class="detail-section">
            <div
              class="section-title"
            >
              客户信息
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>
                  公司名称
                </label>

                <span>
                  {{
                    selectedQuote.company ||
                    '-'
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  联系人
                </label>

                <span>
                  {{
                    selectedQuote.contactName
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  商务邮箱
                </label>

                <span>
                  {{
                    selectedQuote.businessEmail
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  联系电话
                </label>

                <span>
                  {{
                    selectedQuote.phone ||
                    '-'
                  }}
                </span>
              </div>
            </div>
          </section>

          <!-- Requirements -->
          <section class="detail-section">
            <div
              class="section-title"
            >
              客户需求
            </div>

            <div class="requirements-box">
              {{
                selectedQuote.requirements ||
                '客户未填写具体需求'
              }}
            </div>
          </section>

          <!-- Items -->
          <section class="detail-section">
            <div
              class="section-title"
            >
              询价产品

              <span>
                {{
                  selectedQuote.items.length
                }}
                项
              </span>
            </div>

            <div
              class="items-table-wrapper"
            >
              <table class="items-table">
                <thead>
                  <tr>
                    <th>产品型号</th>
                    <th>厂商</th>
                    <th>数量</th>
                    <th>目标价格</th>
                    <th>交期</th>
                    <th>
                      技术要求
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="item in selectedQuote.items"
                    :key="item.id"
                  >
                    <td>
                      <strong>
                        {{
                          item.partNumber
                        }}
                      </strong>

                      <small
                        v-if="
                          item.productTitleZh
                        "
                      >
                        {{
                          item.productTitleZh
                        }}
                      </small>
                    </td>

                    <td>
                      {{
                        item.manufacturer ||
                        '-'
                      }}
                    </td>

                    <td>
                      {{
                        item.quantity ??
                        '-'
                      }}

                      {{ item.unit }}
                    </td>

                    <td>
                      {{
                        formatPrice(
                          item.targetPrice,
                        )
                      }}
                    </td>

                    <td>
                      {{
                        formatDateOnly(
                          item.deliveryDate,
                        )
                      }}
                    </td>

                    <td>
                      {{
                        item.technicalRequirements ||
                        '-'
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Processing -->
          <section class="detail-section">
            <div
              class="section-title"
            >
              处理信息
            </div>

            <div class="edit-grid">
              <div class="edit-field">
                <label>
                  询价状态
                </label>

                <select
                  v-model="editStatus"
                >
                  <option
                    v-for="item in statuses.slice(
                      1,
                    )"
                    :key="item.value"
                    :value="
                      item.value
                    "
                  >
                    {{ item.label }}
                  </option>
                </select>
              </div>

              <div class="edit-field">
                <label>
                  更新时间
                </label>

                <div
                  class="readonly-value"
                >
                  {{
                    formatDate(
                      selectedQuote.updatedAt,
                    )
                  }}
                </div>
              </div>
            </div>

            <div
              class="edit-field note-field"
            >
              <label>
                管理员备注
              </label>

              <textarea
                v-model="editAdminNote"
                rows="5"
                placeholder="填写报价、沟通记录、客户反馈等内部备注..."
              ></textarea>
            </div>
          </section>
        </div>

        <div
          v-if="
            selectedQuote &&
            !detailLoading
          "
          class="modal-footer"
        >
          <button
            class="danger-btn"
            type="button"
            :disabled="deleting"
            @click="
              deleteQuote(
                selectedQuote,
              )
            "
          >
            {{
              deleting
                ? '删除中...'
                : '删除询价'
            }}
          </button>

          <div class="footer-right">
            <button
              class="secondary-btn"
              type="button"
              :disabled="saving"
              @click="closeDetail"
            >
              关闭
            </button>

            <button
              class="primary-btn"
              type="button"
              :disabled="saving"
              @click="saveQuote"
            >
              {{
                saving
                  ? '保存中...'
                  : '保存修改'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div
        v-if="toastMessage"
        class="toast"
        :class="toastType"
      >
        <span>
          {{
            toastType ===
            'success'
              ? '✓'
              : '!'
          }}
        </span>

        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.quote-page {
  min-height: 100%;
  padding: 28px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 26px;
  font-weight: 700;
}

.page-header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.refresh-btn,
.primary-btn,
.secondary-btn,
.danger-btn {
  border: 0;
  border-radius: 7px;
  padding: 9px 16px;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #d9dee7;
}

.refresh-btn:hover {
  background: #f3f4f6;
}

.primary-btn {
  background: #2563eb;
  color: #ffffff;
}

.primary-btn:hover {
  background: #1d4ed8;
}

.secondary-btn {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.secondary-btn:hover {
  background: #f9fafb;
}

.danger-btn {
  background: #dc2626;
  color: #ffffff;
}

.danger-btn:hover {
  background: #b91c1c;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* Search */

.search-panel {
  margin-bottom: 20px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.search-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.keyword-field {
  flex: 1;
}

.status-field {
  width: 180px;
}

.search-field label,
.edit-field label {
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.search-field input,
.search-field select,
.edit-field select,
.edit-field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.search-field input,
.search-field select,
.edit-field select {
  height: 40px;
  padding: 0 12px;
}

.search-field input:focus,
.search-field select:focus,
.edit-field select:focus,
.edit-field textarea:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px
    rgba(37, 99, 235, 0.1);
}

.search-actions {
  display: flex;
  gap: 8px;
}

/* Statistics */

.statistics {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.stat-label {
  color: #6b7280;
  font-size: 13px;
}

.stat-value {
  margin-top: 7px;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
}

/* Table */

.table-panel {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.table-wrapper {
  overflow-x: auto;
}

.quote-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.quote-table th {
  padding: 14px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.quote-table td {
  padding: 15px 16px;
  border-bottom: 1px solid #eef0f3;
  color: #374151;
  font-size: 14px;
  vertical-align: middle;
}

.quote-table tbody tr:hover {
  background: #fafbfc;
}

.quote-table tbody tr:last-child td {
  border-bottom: 0;
}

.quote-no {
  color: #2563eb;
  font-weight: 600;
  white-space: nowrap;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.customer-cell strong {
  color: #1f2937;
  font-size: 14px;
}

.customer-cell span {
  color: #6b7280;
  font-size: 12px;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
  font-size: 13px;
}

.item-count {
  display: inline-flex;
  min-width: 30px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background: #f3f4f6;
  border-radius: 14px;
  color: #374151;
  font-weight: 600;
}

.date-text {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-new {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-processing {
  background: #fef3c7;
  color: #92400e;
}

.status-quoted {
  background: #ede9fe;
  color: #6d28d9;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.action-column {
  width: 140px;
  text-align: center !important;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.action-btn {
  border: 0;
  border-radius: 5px;
  padding: 6px 11px;
  font-size: 12px;
  cursor: pointer;
}

.action-btn.view {
  background: #eff6ff;
  color: #2563eb;
}

.action-btn.view:hover {
  background: #dbeafe;
}

.action-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fee2e2;
}

/* Loading */

.empty-cell {
  height: 280px;
  text-align: center;
}

.loading-state,
.modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
}

.loading-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 4px;
  color: #9ca3af;
  font-size: 34px;
}

.empty-state small {
  color: #9ca3af;
}

/* Pagination */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-top: 1px solid #eef0f3;
}

.pagination-info {
  color: #6b7280;
  font-size: 13px;
}

.pagination-info strong {
  color: #374151;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination-buttons button {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
}

.pagination-buttons button:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-buttons button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.pagination-buttons button:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

/* Modal */

.modal-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: rgba(15, 23, 42, 0.55);
}

.detail-modal {
  display: flex;
  flex-direction: column;
  width: min(1180px, 100%);
  max-height: calc(100vh - 60px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 12px;
  box-shadow:
    0 20px 60px
    rgba(15, 23, 42, 0.25);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}

.modal-header p {
  margin: 6px 0 0;
  color: #9ca3af;
  font-size: 12px;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-loading {
  min-height: 300px;
}

.detail-section {
  margin-bottom: 26px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.section-title span {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 14px;
  background: #fafbfc;
}

.info-item label {
  width: 90px;
  flex-shrink: 0;
  color: #6b7280;
  font-size: 13px;
}

.info-item span {
  color: #374151;
  font-size: 14px;
  word-break: break-all;
}

.requirements-box {
  min-height: 70px;
  padding: 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.items-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.items-table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
}

.items-table th {
  padding: 11px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

.items-table td {
  padding: 12px;
  border-bottom: 1px solid #eef0f3;
  color: #374151;
  font-size: 13px;
  vertical-align: top;
}

.items-table tbody tr:last-child td {
  border-bottom: 0;
}

.items-table td strong {
  display: block;
  color: #1f2937;
}

.items-table td small {
  display: block;
  margin-top: 4px;
  color: #9ca3af;
}

.edit-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.edit-field select {
  background: #ffffff;
}

.readonly-value {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #f9fafb;
  color: #6b7280;
  font-size: 13px;
}

.note-field {
  margin-top: 16px;
}

.edit-field textarea {
  min-height: 110px;
  resize: vertical;
  padding: 10px 12px;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* Toast */

.toast {
  position: fixed;
  z-index: 2000;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 240px;
  max-width: 420px;
  padding: 13px 17px;
  border-radius: 8px;
  box-shadow:
    0 8px 25px
    rgba(0, 0, 0, 0.12);
  color: #ffffff;
  font-size: 14px;
}

.toast.success {
  background: #16a34a;
}

.toast.error {
  background: #dc2626;
}

.toast > span {
  font-weight: 700;
  font-size: 16px;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 900px) {
  .quote-page {
    padding: 18px;
  }

  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .status-field {
    width: auto;
  }

  .statistics {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .pagination {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .detail-modal {
    max-height: calc(100vh - 24px);
  }

  .info-grid,
  .edit-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .footer-right {
    justify-content: flex-end;
  }
}
</style>
