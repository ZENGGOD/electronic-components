```vue
<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_BASE_URL =
  'http://localhost:3000/api'

interface Category {
  id: number
  parentId: number | null
  nameZh: string
  nameEn: string
  slug: string
  descriptionZh: string | null
  descriptionEn: string | null
  icon: string | null
  sortOrder: number
  status: number
  createdAt: string
  updatedAt: string
}

interface CategoryTreeNode
  extends Category {
  children: CategoryTreeNode[]
  level: number
  expanded: boolean
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface CategoryForm {
  parentId: number | null
  nameZh: string
  nameEn: string
  slug: string
  descriptionZh: string
  descriptionEn: string
  icon: string
  sortOrder: number
  status: number
}

const categories =
  ref<Category[]>([])

const loading =
  ref(false)

const submitting =
  ref(false)

const deletingCategoryId =
  ref<number | null>(null)

const showFormModal =
  ref(false)

const editingCategoryId =
  ref<number | null>(null)

const detailLoading =
  ref(false)

const keyword =
  ref('')

const statusFilter =
  ref('')

const currentPage =
  ref(1)

const pageSize =
  ref(20)

const pagination =
  ref<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  })

const form =
  ref<CategoryForm>({
    parentId: null,
    nameZh: '',
    nameEn: '',
    slug: '',
    descriptionZh: '',
    descriptionEn: '',
    icon: '',
    sortOrder: 0,
    status: 1,
  })

const formError =
  ref('')

const toast =
  ref({
    visible: false,
    type: 'success',
    message: '',
  })

/**
 * 记录当前展开的分类 ID
 *
 * 不能直接修改 computed 创建出来的 tree node，
 * 因为 treeData 每次重新计算都会创建新的 node 对象。
 *
 * 使用 Set 保存展开状态，可以保证：
 * 1. 单个展开/收起有效
 * 2. 全部展开有效
 * 3. 全部收起有效
 * 4. fetchCategories 后状态不会因为 computed 重建而丢失
 */
const expandedIds =
  ref<Set<number>>(
    new Set(),
  )

let toastTimer:
  ReturnType<typeof setTimeout> | null =
  null

const token = () =>
  localStorage.getItem(
    'admin_token',
  )

function handleUnauthorized() {
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

function showToast(
  message: string,
  type:
    | 'success'
    | 'error'
    | 'warning' = 'success',
) {
  toast.value = {
    visible: true,
    type,
    message,
  }

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer =
    setTimeout(() => {
      toast.value.visible = false
    }, 3000)
}

async function parseResponse(
  response: Response,
) {
  const text =
    await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      `服务器返回了无效响应 (${response.status})`,
    )
  }
}

async function fetchCategories() {
  loading.value = true

  try {
    const params =
      new URLSearchParams()

    params.set(
      'page',
      String(currentPage.value),
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

    if (
      statusFilter.value === '0' ||
      statusFilter.value === '1'
    ) {
      params.set(
        'status',
        statusFilter.value,
      )
    }

    const response =
      await fetch(
        `${API_BASE_URL}/admin/categories?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${token() || ''}`,
          },
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse(response)

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          '获取分类失败',
      )
    }

    const data =
      result.data || {}

    categories.value =
      Array.isArray(data.items)
        ? data.items
        : []

    pagination.value = {
      page:
        Number(data.page) ||
        currentPage.value,
      pageSize:
        Number(data.pageSize) ||
        pageSize.value,
      total:
        Number(data.total) || 0,
      totalPages:
        Math.max(
          Number(data.totalPages) || 1,
          1,
        ),
    }

    currentPage.value =
      pagination.value.page

    pageSize.value =
      pagination.value.pageSize

    /**
     * 清理已经不存在的 expanded ID。
     *
     * 例如删除分类后，Set 里面可能还保存着旧 ID，
     * 这里把不存在的 ID 移除。
     */
    const existingIds =
      new Set(
        categories.value.map(
          (category) =>
            category.id,
        ),
      )

    const nextExpandedIds =
      new Set<number>()

    expandedIds.value.forEach(
      (id) => {
        if (
          existingIds.has(id)
        ) {
          nextExpandedIds.add(id)
        }
      },
    )

    expandedIds.value =
      nextExpandedIds
  } catch (error) {
    console.error(
      'Failed to fetch categories:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取分类失败',
      'error',
    )
  } finally {
    loading.value = false
  }
}

function createTree(
  source: Category[],
): CategoryTreeNode[] {
  const nodeMap =
    new Map<
      number,
      CategoryTreeNode
    >()

  source.forEach((category) => {
    nodeMap.set(
      category.id,
      {
        ...category,
        children: [],
        level: 0,
        expanded:
          expandedIds.value.has(
            category.id,
          ),
      },
    )
  })

  const roots:
    CategoryTreeNode[] = []

  source.forEach((category) => {
    const node =
      nodeMap.get(category.id)

    if (!node) {
      return
    }

    if (
      category.parentId !== null &&
      nodeMap.has(category.parentId)
    ) {
      const parent =
        nodeMap.get(
          category.parentId,
        )

      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  function sortNodes(
    nodes: CategoryTreeNode[],
    level: number,
  ) {
    nodes.sort(
      (a, b) => {
        if (
          a.sortOrder !==
          b.sortOrder
        ) {
          return (
            a.sortOrder -
            b.sortOrder
          )
        }

        return a.id - b.id
      },
    )

    nodes.forEach((node) => {
      node.level = level

      if (node.children.length) {
        sortNodes(
          node.children,
          level + 1,
        )
      }
    })
  }

  sortNodes(roots, 0)

  return roots
}

const treeData =
  computed(() =>
    createTree(
      categories.value,
    ),
  )

const visibleNodes =
  computed(() => {
    const result:
      CategoryTreeNode[] = []

    function walk(
      nodes: CategoryTreeNode[],
    ) {
      nodes.forEach((node) => {
        result.push(node)

        if (
          expandedIds.value.has(
            node.id,
          ) &&
          node.children.length
        ) {
          walk(node.children)
        }
      })
    }

    walk(treeData.value)

    return result
  })

const parentCategoryOptions =
  computed(() => {
    return categories.value
      .filter(
        (category) =>
          category.id !==
          editingCategoryId.value,
      )
      .sort((a, b) => {
        if (
          a.sortOrder !==
          b.sortOrder
        ) {
          return (
            a.sortOrder -
            b.sortOrder
          )
        }

        return a.id - b.id
      })
  })

const visiblePages =
  computed(() => {
    const total =
      pagination.value.totalPages

    const current =
      pagination.value.page

    if (total <= 7) {
      return Array.from(
        { length: total },
        (_, index) =>
          index + 1,
      )
    }

    const pages: number[] = []

    pages.push(1)

    if (current > 4) {
      pages.push(-1)
    }

    const start =
      Math.max(2, current - 1)

    const end =
      Math.min(
        total - 1,
        current + 1,
      )

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      pages.push(page)
    }

    if (current < total - 3) {
      pages.push(-1)
    }

    pages.push(total)

    return pages
  })

function toggleNode(
  node: CategoryTreeNode,
) {
  const next =
    new Set(expandedIds.value)

  if (next.has(node.id)) {
    next.delete(node.id)
  } else {
    next.add(node.id)
  }

  expandedIds.value = next
}

function expandAll() {
  const next =
    new Set<number>()

  function walk(
    nodes: CategoryTreeNode[],
  ) {
    nodes.forEach((node) => {
      if (node.children.length) {
        next.add(node.id)

        walk(node.children)
      }
    })
  }

  walk(treeData.value)

  expandedIds.value = next
}

function collapseAll() {
  expandedIds.value =
    new Set<number>()
}

function handleSearch() {
  currentPage.value = 1

  fetchCategories()
}

function handleReset() {
  keyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1

  fetchCategories()
}

function changePage(
  page: number,
) {
  if (
    page < 1 ||
    page >
      pagination.value.totalPages
  ) {
    return
  }

  currentPage.value = page

  fetchCategories()
}

function changePageSize(
  event: Event,
) {
  const value =
    Number(
      (
        event.target as
          HTMLSelectElement
      ).value,
    )

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return
  }

  pageSize.value = value
  currentPage.value = 1

  fetchCategories()
}

function resetForm() {
  form.value = {
    parentId: null,
    nameZh: '',
    nameEn: '',
    slug: '',
    descriptionZh: '',
    descriptionEn: '',
    icon: '',
    sortOrder: 0,
    status: 1,
  }

  formError.value = ''
}

function openCreate(
  parentId: number | null = null,
) {
  editingCategoryId.value = null

  resetForm()

  form.value.parentId =
    parentId

  showFormModal.value = true
}

async function openEdit(
  category: CategoryTreeNode,
) {
  editingCategoryId.value =
    category.id

  resetForm()

  showFormModal.value = true
  detailLoading.value = true

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/categories/${category.id}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${token() || ''}`,
          },
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse(response)

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          '获取分类详情失败',
      )
    }

    const data =
      result.data

    form.value = {
      parentId:
        data.parentId ?? null,
      nameZh:
        data.nameZh || '',
      nameEn:
        data.nameEn || '',
      slug:
        data.slug || '',
      descriptionZh:
        data.descriptionZh || '',
      descriptionEn:
        data.descriptionEn || '',
      icon:
        data.icon || '',
      sortOrder:
        Number(data.sortOrder) || 0,
      status:
        Number(data.status) === 0
          ? 0
          : 1,
    }
  } catch (error) {
    console.error(
      'Failed to fetch category detail:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '获取分类详情失败',
      'error',
    )

    closeForm()
  } finally {
    detailLoading.value = false
  }
}

function closeForm() {
  showFormModal.value = false
  editingCategoryId.value = null
  detailLoading.value = false
  formError.value = ''
}

function validateForm(): string {
  if (
    !form.value.nameZh.trim()
  ) {
    return '请输入中文分类名称'
  }

  if (
    !form.value.nameEn.trim()
  ) {
    return '请输入英文分类名称'
  }

  if (
    !form.value.slug.trim()
  ) {
    return '请输入分类 Slug'
  }

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      form.value.slug.trim(),
    )
  ) {
    return 'Slug 只能使用小写字母、数字和连字符，例如：power-management'
  }

  if (
    form.value.parentId !== null &&
    form.value.parentId ===
      editingCategoryId.value
  ) {
    return '分类不能设置自己为父级分类'
  }

  if (
    !Number.isInteger(
      Number(form.value.sortOrder),
    )
  ) {
    return '排序必须是整数'
  }

  if (
    form.value.status !== 0 &&
    form.value.status !== 1
  ) {
    return '请选择有效的分类状态'
  }

  return ''
}

async function submitForm() {
  formError.value = ''

  const validationError =
    validateForm()

  if (validationError) {
    formError.value =
      validationError

    return
  }

  submitting.value = true

  try {
    const isEditing =
      editingCategoryId.value !==
      null

    const payload = {
      parentId:
        form.value.parentId,
      nameZh:
        form.value.nameZh.trim(),
      nameEn:
        form.value.nameEn.trim(),
      slug:
        form.value.slug.trim(),
      descriptionZh:
        form.value.descriptionZh.trim() ||
        null,
      descriptionEn:
        form.value.descriptionEn.trim() ||
        null,
      icon:
        form.value.icon.trim() ||
        null,
      sortOrder:
        Number(form.value.sortOrder),
      status:
        Number(form.value.status),
    }

    const url =
      isEditing
        ? `${API_BASE_URL}/admin/categories/${editingCategoryId.value}`
        : `${API_BASE_URL}/admin/categories`

    const response =
      await fetch(url, {
        method: isEditing
          ? 'PUT'
          : 'POST',
        headers: {
          Authorization:
            `Bearer ${token() || ''}`,
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          payload,
        ),
      })

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse(response)

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          '保存分类失败',
      )
    }

    showToast(
      isEditing
        ? '分类更新成功'
        : '分类创建成功',
      'success',
    )

    closeForm()

    await fetchCategories()
  } catch (error) {
    console.error(
      'Failed to save category:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : '保存分类失败'

    formError.value = message

    showToast(
      message,
      'error',
    )
  } finally {
    submitting.value = false
  }
}

async function handleDelete(
  category: CategoryTreeNode,
) {
  if (
    deletingCategoryId.value !==
    null
  ) {
    return
  }

  const hasChildren =
    category.children.length > 0

  if (hasChildren) {
    showToast(
      '该分类存在子分类，请先删除子分类',
      'warning',
    )

    return
  }

  const confirmed =
    window.confirm(
      `确定要删除分类“${category.nameZh}”吗？\n\n删除后无法恢复。`,
    )

  if (!confirmed) {
    return
  }

  deletingCategoryId.value =
    category.id

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/admin/categories/${category.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization:
              `Bearer ${token() || ''}`,
          },
        },
      )

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    const result =
      await parseResponse(response)

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
          '删除分类失败',
      )
    }

    /**
     * 删除后同步清理展开状态
     */
    const nextExpandedIds =
      new Set(expandedIds.value)

    nextExpandedIds.delete(
      category.id,
    )

    expandedIds.value =
      nextExpandedIds

    showToast(
      '分类删除成功',
      'success',
    )

    if (
      currentPage.value >
        1 &&
      categories.value.length ===
        1
    ) {
      currentPage.value -= 1
    }

    await fetchCategories()
  } catch (error) {
    console.error(
      'Failed to delete category:',
      error,
    )

    showToast(
      error instanceof Error
        ? error.message
        : '删除分类失败',
      'error',
    )
  } finally {
    deletingCategoryId.value =
      null
  }
}

function getParentName(
  parentId: number | null,
): string {
  if (parentId === null) {
    return '一级分类'
  }

  const parent =
    categories.value.find(
      (category) =>
        category.id === parentId,
    )

  return (
    parent?.nameZh ||
    `分类 #${parentId}`
  )
}

function getStatusText(
  status: number,
): string {
  return status === 1
    ? '启用'
    : '禁用'
}

function formatDate(
  value: string,
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
    },
  )
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="admin-categories">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1>分类管理</h1>

        <p>
          管理产品分类及父子分类关系
        </p>
      </div>

      <button
        class="primary-button"
        type="button"
        @click="openCreate()"
      >
        <span class="button-icon">+</span>
        新增分类
      </button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div
        class="search-item keyword-item"
      >
        <label>关键词</label>

        <input
          v-model="keyword"
          type="text"
          placeholder="分类名称 / 英文名称 / Slug"
          @keyup.enter="handleSearch"
        />
      </div>

      <div
        class="search-item status-item"
      >
        <label>状态</label>

        <select
          v-model="statusFilter"
        >
          <option value="">
            全部
          </option>

          <option value="1">
            启用
          </option>

          <option value="0">
            禁用
          </option>
        </select>
      </div>

      <div class="search-actions">
        <button
          class="primary-button small"
          type="button"
          @click="handleSearch"
        >
          查询
        </button>

        <button
          class="secondary-button small"
          type="button"
          @click="handleReset"
        >
          重置
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="result-count">
          共
          <strong>
            {{ pagination.total }}
          </strong>
          个分类
        </span>

        <button
          class="text-button"
          type="button"
          @click="expandAll"
        >
          全部展开
        </button>

        <button
          class="text-button"
          type="button"
          @click="collapseAll"
        >
          全部收起
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div
        v-if="loading"
        class="loading-state"
      >
        <div
          class="loading-spinner"
        ></div>

        <span>
          正在加载分类...
        </span>
      </div>

      <div
        v-else-if="
          visibleNodes.length === 0
        "
        class="empty-state"
      >
        <div class="empty-icon">
          📂
        </div>

        <div class="empty-title">
          暂无分类
        </div>

        <div
          class="empty-description"
        >
          当前没有符合条件的分类
        </div>

        <button
          class="primary-button"
          type="button"
          @click="openCreate()"
        >
          新增分类
        </button>
      </div>

      <div
        v-else
        class="table-wrapper"
      >
        <table>
          <thead>
            <tr>
              <th class="id-column">
                ID
              </th>

              <th class="name-column">
                分类名称
              </th>

              <th class="english-column">
                英文名称
              </th>

              <th class="slug-column">
                Slug
              </th>

              <th class="parent-column">
                父级分类
              </th>

              <th class="status-column">
                状态
              </th>

              <th class="sort-column">
                排序
              </th>

              <th class="time-column">
                更新时间
              </th>

              <th class="action-column">
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="node in visibleNodes"
              :key="node.id"
              :class="{
                'child-row':
                  node.level > 0,
              }"
            >
              <td>
                <span
                  class="category-id"
                >
                  {{ node.id }}
                </span>
              </td>

              <td>
                <div
                  class="category-name-cell"
                  :style="{
                    paddingLeft:
                      `${node.level * 28}px`,
                  }"
                >
                  <button
                    v-if="
                      node.children
                        .length
                    "
                    class="expand-button"
                    type="button"
                    :title="
                      expandedIds.has(
                        node.id,
                      )
                        ? '收起'
                        : '展开'
                    "
                    @click="
                      toggleNode(node)
                    "
                  >
                    <span
                      :class="[
                        'expand-arrow',
                        {
                          expanded:
                            expandedIds.has(
                              node.id,
                            ),
                        },
                      ]"
                    >
                      ›
                    </span>
                  </button>

                  <span
                    v-else
                    class="tree-placeholder"
                  ></span>

                  <span
                    v-if="
                      node.level > 0
                    "
                    class="tree-branch"
                  >
                    └
                  </span>

                  <div
                    class="category-main"
                  >
                    <span
                      class="category-title"
                    >
                      {{ node.nameZh }}
                    </span>

                    <span
                      v-if="
                        node.level ===
                        0
                      "
                      class="level-tag"
                    >
                      一级
                    </span>

                    <span
                      v-else
                      class="level-tag child"
                    >
                      二级
                    </span>
                  </div>
                </div>
              </td>

              <td>
                <span
                  class="english-name"
                >
                  {{ node.nameEn }}
                </span>
              </td>

              <td>
                <code class="slug">
                  {{ node.slug }}
                </code>
              </td>

              <td>
                <span
                  class="parent-name"
                >
                  {{
                    getParentName(
                      node.parentId,
                    )
                  }}
                </span>
              </td>

              <td>
                <span
                  :class="[
                    'status-badge',
                    node.status === 1
                      ? 'enabled'
                      : 'disabled',
                  ]"
                >
                  <span
                    class="status-dot"
                  ></span>

                  {{
                    getStatusText(
                      node.status,
                    )
                  }}
                </span>
              </td>

              <td>
                <span
                  class="sort-value"
                >
                  {{ node.sortOrder }}
                </span>
              </td>

              <td>
                <span
                  class="date-text"
                >
                  {{
                    formatDate(
                      node.updatedAt,
                    )
                  }}
                </span>
              </td>

              <td>
                <div
                  class="action-buttons"
                >
                  <button
                    class="action-button edit"
                    type="button"
                    @click="
                      openEdit(node)
                    "
                  >
                    编辑
                  </button>

                  <button
                    v-if="
                      node.level === 0
                    "
                    class="action-button add-child"
                    type="button"
                    @click="
                      openCreate(
                        node.id,
                      )
                    "
                  >
                    子分类
                  </button>

                  <button
                    class="action-button delete"
                    type="button"
                    :disabled="
                      deletingCategoryId ===
                      node.id
                    "
                    @click="
                      handleDelete(
                        node,
                      )
                    "
                  >
                    {{
                      deletingCategoryId ===
                      node.id
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
    </div>

    <!-- Pagination -->
    <div
      v-if="
        !loading &&
        pagination.total > 0
      "
      class="pagination"
    >
      <div class="page-size">
        每页

        <select
          :value="pageSize"
          @change="changePageSize"
        >
          <option :value="10">
            10
          </option>

          <option :value="20">
            20
          </option>

          <option :value="50">
            50
          </option>

          <option :value="100">
            100
          </option>
        </select>

        条
      </div>

      <div class="page-info">
        第
        {{ pagination.page }}
        /
        {{ pagination.totalPages }}
        页
      </div>

      <div class="page-buttons">
        <button
          class="page-button"
          type="button"
          :disabled="
            pagination.page <= 1
          "
          @click="
            changePage(
              pagination.page - 1,
            )
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
            v-if="page === -1"
            class="page-ellipsis"
          >
            ...
          </span>

          <button
            v-else
            class="page-button"
            :class="{
              active:
                page ===
                pagination.page,
            }"
            type="button"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </template>

        <button
          class="page-button"
          type="button"
          :disabled="
            pagination.page >=
            pagination.totalPages
          "
          @click="
            changePage(
              pagination.page + 1,
            )
          "
        >
          ›
        </button>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      v-if="showFormModal"
      class="modal-overlay"
      @click.self="closeForm"
    >
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>
              {{
                editingCategoryId !==
                null
                  ? '编辑分类'
                  : '新增分类'
              }}
            </h2>

            <p>
              {{
                editingCategoryId !==
                null
                  ? '修改分类信息'
                  : '创建新的产品分类'
              }}
            </p>
          </div>

          <button
            class="modal-close"
            type="button"
            @click="closeForm"
          >
            ×
          </button>
        </div>

        <div
          v-if="detailLoading"
          class="modal-loading"
        >
          <div
            class="loading-spinner"
          ></div>

          正在加载分类信息...
        </div>

        <form
          v-else
          class="category-form"
          @submit.prevent="submitForm"
        >
          <div
            v-if="formError"
            class="form-error"
          >
            {{ formError }}
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                父级分类
              </label>

              <select
                v-model="
                  form.parentId
                "
              >
                <option :value="null">
                  无（一级分类）
                </option>

                <option
                  v-for="category in parentCategoryOptions"
                  :key="category.id"
                  :value="category.id"
                >
                  {{
                    category.nameZh
                  }}
                  -
                  {{
                    category.nameEn
                  }}
                </option>
              </select>

              <span class="field-tip">
                不选择父级分类时，将创建一级分类
              </span>
            </div>

            <div class="form-group">
              <label>
                状态
              </label>

              <select
                v-model.number="
                  form.status
                "
              >
                <option :value="1">
                  启用
                </option>

                <option :value="0">
                  禁用
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                中文名称

                <span class="required">
                  *
                </span>
              </label>

              <input
                v-model="
                  form.nameZh
                "
                type="text"
                maxlength="100"
                placeholder="例如：微控制器"
              />
            </div>

            <div class="form-group">
              <label>
                英文名称

                <span class="required">
                  *
                </span>
              </label>

              <input
                v-model="
                  form.nameEn
                "
                type="text"
                maxlength="100"
                placeholder="例如：Microcontrollers"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                Slug

                <span class="required">
                  *
                </span>
              </label>

              <input
                v-model="
                  form.slug
                "
                type="text"
                maxlength="120"
                placeholder="例如：microcontrollers"
              />

              <span class="field-tip">
                只能使用小写字母、数字和连字符
              </span>
            </div>

            <div class="form-group">
              <label>
                排序
              </label>

              <input
                v-model.number="
                  form.sortOrder
                "
                type="number"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          <div class="form-group">
            <label>
              Icon
            </label>

            <input
              v-model="form.icon"
              type="text"
              maxlength="255"
              placeholder="例如：microchip、cpu"
            />
          </div>

          <div class="form-group">
            <label>
              中文描述
            </label>

            <textarea
              v-model="
                form.descriptionZh
              "
              rows="4"
              placeholder="请输入分类中文描述"
            ></textarea>
          </div>

          <div class="form-group">
            <label>
              英文描述
            </label>

            <textarea
              v-model="
                form.descriptionEn
              "
              rows="4"
              placeholder="Please enter the English category description"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button
              class="secondary-button"
              type="button"
              :disabled="submitting"
              @click="closeForm"
            >
              取消
            </button>

            <button
              class="primary-button"
              type="submit"
              :disabled="submitting"
            >
              {{
                submitting
                  ? '保存中...'
                  : '保存'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast -->
    <transition name="toast">
      <div
        v-if="toast.visible"
        :class="[
          'toast',
          toast.type,
        ]"
      >
        <span class="toast-icon">
          {{
            toast.type ===
            'success'
              ? '✓'
              : toast.type ===
                'warning'
                ? '!'
                : '×'
          }}
        </span>

        <span>
          {{ toast.message }}
        </span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.admin-categories {
  min-height: 100%;
  padding: 24px;
  background: #f5f7fa;
  color: #303133;
}

/* Page Header */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}

/* Buttons */

.primary-button,
.secondary-button {
  height: 40px;
  padding: 0 18px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.primary-button {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.primary-button:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary-button.small,
.secondary-button.small {
  height: 36px;
  padding: 0 16px;
}

.secondary-button {
  color: #606266;
  background: #fff;
  border-color: #dcdfe6;
}

.secondary-button:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.button-icon {
  margin-right: 5px;
  font-size: 18px;
  line-height: 1;
}

/* Search */

.search-card {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.search-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-item label {
  font-size: 13px;
  color: #606266;
}

.keyword-item {
  width: 360px;
}

.status-item {
  width: 160px;
}

.search-item input,
.search-item select,
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #303133;
  outline: none;
  transition: border-color 0.2s;
}

.search-item input,
.search-item select {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
}

.search-item input:focus,
.search-item select:focus,
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #409eff;
}

.search-actions {
  display: flex;
  gap: 10px;
}

/* Toolbar */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  margin-bottom: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.result-count {
  color: #909399;
  font-size: 14px;
}

.result-count strong {
  color: #409eff;
  font-weight: 600;
}

.text-button {
  padding: 0;
  border: none;
  background: transparent;
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
}

.text-button:hover {
  color: #66b1ff;
}

/* Table */

.table-card {
  position: relative;
  overflow: hidden;
  min-height: 260px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1250px;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: #f5f7fa;
}

th {
  height: 48px;
  padding: 0 14px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

td {
  height: 68px;
  padding: 10px 14px;
  color: #606266;
  font-size: 13px;
  border-bottom: 1px solid #ebeef5;
}

tbody tr:hover {
  background: #fafafa;
}

tbody tr:last-child td {
  border-bottom: none;
}

.id-column {
  width: 60px;
}

.name-column {
  width: 245px;
}

.english-column {
  width: 190px;
}

.slug-column {
  width: 165px;
}

.parent-column {
  width: 145px;
}

.status-column {
  width: 90px;
}

.sort-column {
  width: 70px;
}

.time-column {
  width: 145px;
}

.action-column {
  width: 190px;
}

.category-id {
  color: #909399;
  font-family: monospace;
}

.category-name-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 5px;
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.expand-button:hover {
  background: #ecf5ff;
}

.expand-arrow {
  display: inline-block;
  color: #909399;
  font-size: 22px;
  line-height: 1;
  transform: rotate(0deg);
  transition: transform 0.2s;
}

.expand-arrow.expanded {
  transform: rotate(90deg);
}

.tree-placeholder {
  display: block;
  width: 24px;
  height: 24px;
}

.tree-branch {
  margin-right: 3px;
  color: #c0c4cc;
  font-size: 15px;
}

.category-main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.category-title {
  overflow: hidden;
  color: #303133;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-tag {
  flex-shrink: 0;
  padding: 2px 6px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 3px;
  font-size: 11px;
}

.level-tag.child {
  color: #67c23a;
  background: #f0f9eb;
}

.english-name {
  display: block;
  overflow: hidden;
  color: #606266;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slug {
  display: inline-block;
  max-width: 150px;
  padding: 3px 7px;
  overflow: hidden;
  color: #606266;
  background: #f4f4f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.parent-name {
  display: block;
  overflow: hidden;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.enabled {
  color: #67c23a;
  background: #f0f9eb;
}

.status-badge.disabled {
  color: #909399;
  background: #f4f4f5;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.sort-value {
  color: #606266;
}

.date-text {
  color: #909399;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  padding: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}

.action-button.edit {
  color: #409eff;
}

.action-button.edit:hover {
  color: #66b1ff;
}

.action-button.add-child {
  color: #67c23a;
}

.action-button.add-child:hover {
  color: #85ce61;
}

.action-button.delete {
  color: #f56c6c;
}

.action-button.delete:hover {
  color: #f78989;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 260px;
  color: #909399;
  font-size: 14px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #dcdfe6;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 40px;
}

.empty-icon {
  margin-bottom: 12px;
  font-size: 42px;
  opacity: 0.65;
}

.empty-title {
  margin-bottom: 8px;
  color: #606266;
  font-size: 16px;
}

.empty-description {
  margin-bottom: 20px;
  color: #909399;
  font-size: 13px;
}

/* Pagination */

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 22px;
  padding: 18px 4px;
}

.page-size,
.page-info {
  color: #606266;
  font-size: 13px;
}

.page-size select {
  height: 32px;
  margin: 0 4px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  background: #fff;
  outline: none;
}

.page-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-button {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  color: #606266;
  background: transparent;
  cursor: pointer;
}

.page-button:hover:not(:disabled) {
  color: #409eff;
  background: #ecf5ff;
}

.page-button.active {
  color: #fff;
  background: #409eff;
}

.page-button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 32px;
  text-align: center;
  color: #909399;
}

/* Modal */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.modal {
  width: min(760px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px;
  border-bottom: 1px solid #ebeef5;
}

.modal-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.modal-header p {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.modal-close {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: #909399;
  background: transparent;
  font-size: 25px;
  line-height: 28px;
  cursor: pointer;
}

.modal-close:hover {
  color: #606266;
  background: #f5f7fa;
}

.category-form {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-group label {
  color: #606266;
  font-size: 13px;
}

.required {
  margin-left: 2px;
  color: #f56c6c;
}

.form-group input,
.form-group select {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
}

.form-group textarea {
  min-height: 90px;
  padding: 10px 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.field-tip {
  color: #909399;
  font-size: 12px;
}

.form-error {
  margin-bottom: 18px;
  padding: 10px 12px;
  border: 1px solid #fbc4c4;
  border-radius: 5px;
  color: #f56c6c;
  background: #fef0f0;
  font-size: 13px;
  line-height: 1.5;
}

.modal-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 360px;
  color: #909399;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

/* Toast */

.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 220px;
  max-width: 420px;
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 14px;
}

.toast.success {
  border-color: #b3e19d;
  color: #67c23a;
  background: #f0f9eb;
}

.toast.error {
  border-color: #fbc4c4;
  color: #f56c6c;
  background: #fef0f0;
}

.toast.warning {
  border-color: #f3d19e;
  color: #e6a23c;
  background: #fdf6ec;
}

.toast-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-weight: 700;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */

@media (max-width: 900px) {
  .search-card {
    flex-wrap: wrap;
  }

  .keyword-item {
    width: 100%;
  }

  .status-item {
    flex: 1;
  }

  .search-actions {
    flex: 1;
  }

  .search-actions button {
    flex: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .admin-categories {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header .primary-button {
    width: 100%;
  }

  .search-card {
    flex-direction: column;
    align-items: stretch;
  }

  .status-item {
    width: 100%;
  }

  .search-actions {
    width: 100%;
  }

  .toolbar-left {
    flex-wrap: wrap;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal {
    max-height: calc(100vh - 20px);
  }

  .category-form {
    padding: 18px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
