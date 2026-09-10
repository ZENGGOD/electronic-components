<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type ContactMessageStatus =
  | 'New'
  | 'Processing'
  | 'Replied'
  | 'Closed'

interface ContactMessage {
  id: number
  name: string
  company: string | null
  businessEmail: string
  phoneWhatsapp: string | null
  subject: string | null
  message: string
  status: ContactMessageStatus
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

interface ContactMessageListResponse {
  success: boolean
  data?: {
    items: ContactMessage[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  message?: string
}

interface ContactMessageDetailResponse {
  success: boolean
  data?: ContactMessage
  message?: string
}

interface ContactMessageUpdateResponse {
  success: boolean
  data?: ContactMessage
  message?: string
}

interface ContactMessageDeleteResponse {
  success: boolean
  message?: string
}

const API_BASE =
  '/api/admin/contact-messages'

const statuses: Array<{
  value: '' | ContactMessageStatus
  label: string
}> = [
  {
    value: '',
    label: '全部状态',
  },
  {
    value: 'New',
    label: '新留言',
  },
  {
    value: 'Processing',
    label: '处理中',
  },
  {
    value: 'Replied',
    label: '已回复',
  },
  {
    value: 'Closed',
    label: '已关闭',
  },
]

const messages =
  ref<ContactMessage[]>([])

const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const keyword = ref('')
const statusFilter =
  ref<'' | ContactMessageStatus>('')

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const selectedMessage =
  ref<ContactMessage | null>(null)

const showDetailModal = ref(false)

const editStatus =
  ref<ContactMessageStatus>('New')

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

const newCount = computed(() =>
  messages.value.filter(
    (item) =>
      item.status === 'New',
  ).length,
)

const processingCount = computed(() =>
  messages.value.filter(
    (item) =>
      item.status === 'Processing',
  ).length,
)

const repliedCount = computed(() =>
  messages.value.filter(
    (item) =>
      item.status === 'Replied',
  ).length,
)

const closedCount = computed(() =>
  messages.value.filter(
    (item) =>
      item.status === 'Closed',
  ).length,
)

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

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const contentType =
    response.headers.get(
      'content-type',
    ) ?? ''

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
        .startsWith('<!doctype html') ||
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
  status: ContactMessageStatus,
): string {
  const item =
    statuses.find(
      (entry) =>
        entry.value === status,
    )

  return item?.label ?? status
}

function getStatusClass(
  status: ContactMessageStatus,
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

function truncateMessage(
  value: string,
  maxLength = 55,
): string {
  if (
    value.length <= maxLength
  ) {
    return value
  }

  return `${value.slice(
    0,
    maxLength,
  )}...`
}

async function fetchMessages(): Promise<void> {
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
      await parseResponse<ContactMessageListResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '获取客户留言失败',
      )
    }

    if (
      !result.data ||
      !Array.isArray(
        result.data.items,
      )
    ) {
      console.error(
        'Invalid contact message list response:',
        result,
      )

      throw new Error(
        '服务器返回的数据格式错误：留言列表结构不正确',
      )
    }

    messages.value =
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
      'Fetch contact messages error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取客户留言失败',
      'error',
    )
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  page.value = 1
  fetchMessages()
}

function handleStatusChange(): void {
  page.value = 1
  fetchMessages()
}

function clearSearch(): void {
  keyword.value = ''
  statusFilter.value = ''
  page.value = 1

  fetchMessages()
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

  fetchMessages()
}

function previousPage(): void {
  changePage(page.value - 1)
}

function nextPage(): void {
  changePage(page.value + 1)
}

async function openDetail(
  id: number,
): Promise<void> {
  const token = getToken()

  if (!token) {
    handleUnauthorized()
    return
  }

  showDetailModal.value = true
  selectedMessage.value = null
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
      await parseResponse<ContactMessageDetailResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '获取留言详情失败',
      )
    }

    if (!result.data) {
      throw new Error(
        '留言详情不存在',
      )
    }

    selectedMessage.value =
      result.data

    editStatus.value =
      result.data.status

    editAdminNote.value =
      result.data.adminNote ?? ''
  } catch (error) {
    console.error(
      'Get contact message detail error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取留言详情失败',
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
  selectedMessage.value = null
}

async function saveMessage(): Promise<void> {
  if (!selectedMessage.value) {
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
        `${API_BASE}/${selectedMessage.value.id}`,
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
      await parseResponse<ContactMessageUpdateResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '更新留言失败',
      )
    }

    if (result.data) {
      selectedMessage.value =
        result.data

      editStatus.value =
        result.data.status

      editAdminNote.value =
        result.data.adminNote ?? ''
    }

    showToast(
      '客户留言更新成功',
      'success',
    )

    await fetchMessages()
  } catch (error) {
    console.error(
      'Update contact message error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '更新留言失败',
      'error',
    )
  } finally {
    saving.value = false
  }
}

async function deleteMessage(
  message: ContactMessage,
): Promise<void> {
  const confirmed =
    window.confirm(
      `确定要删除 ${message.name} 的留言吗？\n\n删除后该留言将无法恢复。`,
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
        `${API_BASE}/${message.id}`,
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
      await parseResponse<ContactMessageDeleteResponse>(
        response,
      )

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          '删除留言失败',
      )
    }

    showToast(
      '客户留言删除成功',
      'success',
    )

    if (
      showDetailModal.value &&
      selectedMessage.value?.id ===
        message.id
    ) {
      closeDetail()
    }

    if (
      messages.value.length === 1 &&
      page.value > 1
    ) {
      page.value -= 1
    }

    await fetchMessages()
  } catch (error) {
    console.error(
      'Delete contact message error:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '删除留言失败',
      'error',
    )
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<template>
  <div class="message-page">
    <div class="page-header">
      <div>
        <h1>客户留言</h1>

        <p>
          管理客户通过联系我们提交的商务咨询与留言
        </p>
      </div>

      <button
        class="refresh-btn"
        type="button"
        :disabled="loading"
        @click="fetchMessages"
      >
        <span
          v-if="loading"
          class="loading-spinner small"
        ></span>

        <span v-else>↻</span>

        刷新
      </button>
    </div>

    <section class="search-panel">
      <div class="search-row">
        <div
          class="search-field keyword-field"
        >
          <label>关键词</label>

          <input
            v-model="keyword"
            type="text"
            placeholder="姓名 / 公司 / 邮箱 / 电话 / 主题 / 留言内容"
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
          新留言
        </div>

        <div class="stat-value">
          {{ newCount }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          处理中
        </div>

        <div class="stat-value">
          {{ processingCount }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          已回复
        </div>

        <div class="stat-value">
          {{ repliedCount }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">
          已关闭
        </div>

        <div class="stat-value">
          {{ closedCount }}
        </div>
      </div>
    </div>

    <section class="table-panel">
      <div class="table-wrapper">
        <table class="message-table">
          <thead>
            <tr>
              <th>客户</th>
              <th>公司</th>
              <th>联系方式</th>
              <th>主题 / 留言</th>
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

                  正在加载客户留言...
                </div>
              </td>
            </tr>

            <tr
              v-else-if="
                messages.length === 0
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
                    暂无客户留言
                  </div>

                  <small>
                    尝试修改搜索条件
                  </small>
                </div>
              </td>
            </tr>

            <tr
              v-for="message in messages"
              v-else
              :key="message.id"
            >
              <td>
                <div class="customer-cell">
                  <strong>
                    {{ message.name }}
                  </strong>

                  <span>
                    ID #{{ message.id }}
                  </span>
                </div>
              </td>

              <td>
                <div class="company-cell">
                  {{
                    message.company ||
                    '个人客户'
                  }}
                </div>
              </td>

              <td>
                <div class="contact-cell">
                  <span>
                    {{
                      message.businessEmail
                    }}
                  </span>

                  <span
                    v-if="
                      message.phoneWhatsapp
                    "
                  >
                    {{
                      message.phoneWhatsapp
                    }}
                  </span>
                </div>
              </td>

              <td>
                <div class="message-preview">
                  <strong>
                    {{
                      message.subject ||
                      '无主题'
                    }}
                  </strong>

                  <span>
                    {{
                      truncateMessage(
                        message.message,
                      )
                    }}
                  </span>
                </div>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    getStatusClass(
                      message.status,
                    )
                  "
                >
                  {{
                    getStatusLabel(
                      message.status,
                    )
                  }}
                </span>
              </td>

              <td>
                <span class="date-text">
                  {{
                    formatDate(
                      message.createdAt,
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
                        message.id,
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
                      deleteMessage(
                        message,
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
                selectedMessage
                  ? selectedMessage.subject ||
                    '客户留言'
                  : '留言详情'
              }}
            </h2>

            <p
              v-if="selectedMessage"
            >
              提交于
              {{
                formatDate(
                  selectedMessage.createdAt,
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

          正在加载留言详情...
        </div>

        <div
          v-else-if="selectedMessage"
          class="modal-body"
        >
          <section class="detail-section">
            <div
              class="section-title"
            >
              客户信息
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>
                  姓名
                </label>

                <span>
                  {{
                    selectedMessage.name
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  公司
                </label>

                <span>
                  {{
                    selectedMessage.company ||
                    '-'
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  商务邮箱
                </label>

                <span>
                  {{
                    selectedMessage.businessEmail
                  }}
                </span>
              </div>

              <div class="info-item">
                <label>
                  电话 / WhatsApp
                </label>

                <span>
                  {{
                    selectedMessage.phoneWhatsapp ||
                    '-'
                  }}
                </span>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <div
              class="section-title"
            >
              留言主题
            </div>

            <div class="subject-box">
              {{
                selectedMessage.subject ||
                '无主题'
              }}
            </div>
          </section>

          <section class="detail-section">
            <div
              class="section-title"
            >
              留言内容
            </div>

            <div class="message-box">
              {{
                selectedMessage.message
              }}
            </div>
          </section>

          <section class="detail-section">
            <div
              class="section-title"
            >
              处理信息
            </div>

            <div class="edit-grid">
              <div class="edit-field">
                <label>
                  留言状态
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
                      selectedMessage.updatedAt,
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
                placeholder="填写客户沟通记录、处理情况等内部备注..."
              ></textarea>
            </div>
          </section>
        </div>

        <div
          v-if="
            selectedMessage &&
            !detailLoading
          "
          class="modal-footer"
        >
          <button
            class="danger-btn"
            type="button"
            :disabled="deleting"
            @click="
              deleteMessage(
                selectedMessage,
              )
            "
          >
            {{
              deleting
                ? '删除中...'
                : '删除留言'
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
              @click="saveMessage"
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
.message-page {
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

.statistics {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
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

.table-panel {
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.table-wrapper {
  overflow-x: auto;
}

.message-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1250px;
}

.message-table th {
  padding: 14px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.message-table td {
  padding: 15px 16px;
  border-bottom: 1px solid #eef0f3;
  color: #374151;
  font-size: 14px;
  vertical-align: middle;
}

.message-table tbody tr:hover {
  background: #fafbfc;
}

.message-table tbody tr:last-child td {
  border-bottom: 0;
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
  color: #9ca3af;
  font-size: 12px;
}

.company-cell {
  max-width: 220px;
  color: #374151;
  line-height: 1.5;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #4b5563;
  font-size: 13px;
}

.message-preview {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 390px;
}

.message-preview strong {
  overflow: hidden;
  color: #1f2937;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-preview span {
  overflow: hidden;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 5px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-new {
  background: #eff6ff;
  color: #2563eb;
}

.status-processing {
  background: #fff7ed;
  color: #ea580c;
}

.status-replied {
  background: #f0fdf4;
  color: #16a34a;
}

.status-closed {
  background: #f3f4f6;
  color: #6b7280;
}

.date-text {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
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
  width: min(1050px, 100%);
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
  width: 120px;
  flex-shrink: 0;
  color: #6b7280;
  font-size: 13px;
}

.info-item span {
  color: #374151;
  font-size: 14px;
  word-break: break-all;
}

.subject-box {
  padding: 13px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.message-box {
  min-height: 120px;
  padding: 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
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

.edit-field textarea,
.edit-field select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  outline: none;
}

.edit-field select {
  height: 40px;
  padding: 0 12px;
}

.edit-field textarea {
  min-height: 110px;
  padding: 10px 12px;
  line-height: 1.6;
  resize: vertical;
}

.edit-field select:focus,
.edit-field textarea:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px
    rgba(37, 99, 235, 0.1);
}

.edit-field label {
  color: #374151;
  font-size: 13px;
  font-weight: 600;
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

@media (max-width: 1100px) {
  .statistics {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .message-page {
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
