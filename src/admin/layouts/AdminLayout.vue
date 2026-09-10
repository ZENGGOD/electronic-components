<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const sidebarCollapsed = ref(false)

interface AdminUser {
  id: number
  username: string
  displayName: string | null
  email: string | null
  role: 'Super Admin' | 'Admin' | 'Editor'
}

const adminUser = computed<AdminUser | null>(() => {
  const user = localStorage.getItem('admin_user')

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user) as AdminUser
  } catch {
    return null
  }
})

const currentMenu = computed(() => {
  const path = route.path

  if (path === '/admin') {
    return '首页'
  }

  if (path.startsWith('/admin/products')) {
    return '产品管理'
  }

  if (path.startsWith('/admin/manufacturers')) {
    return '厂商管理'
  }

  if (path.startsWith('/admin/categories')) {
    return '分类管理'
  }

  if (path.startsWith('/admin/technical')) {
    return '技术资料'
  }

  if (path.startsWith('/admin/quotes')) {
    return '询价管理'
  }

  if (path.startsWith('/admin/messages')) {
    return '客户留言'
  }

  if (path.startsWith('/admin/settings')) {
    return '系统设置'
  }

  return '首页'
})

function handleLogout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')

  router.push('/admin/login')
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="admin-layout">

    <!-- 左侧菜单 -->
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
    >
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo-icon">
          EC
        </div>

        <span
          v-if="!sidebarCollapsed"
          class="logo-text"
        >
          Electronic
        </span>
      </div>

      <!-- 菜单 -->
      <nav class="menu">

        <RouterLink
          to="/admin"
          class="menu-item"
          :class="{ active: route.path === '/admin' }"
        >
          <span class="menu-icon">⌂</span>
          <span v-if="!sidebarCollapsed">
            首页
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/products"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/products'),
          }"
        >
          <span class="menu-icon">▣</span>
          <span v-if="!sidebarCollapsed">
            产品管理
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/manufacturers"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/manufacturers'),
          }"
        >
          <span class="menu-icon">▤</span>
          <span v-if="!sidebarCollapsed">
            厂商管理
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/categories"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/categories'),
          }"
        >
          <span class="menu-icon">▦</span>
          <span v-if="!sidebarCollapsed">
            分类管理
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/technical"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/technical'),
          }"
        >
          <span class="menu-icon">▤</span>
          <span v-if="!sidebarCollapsed">
            技术资料
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/quotes"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/quotes'),
          }"
        >
          <span class="menu-icon">◇</span>
          <span v-if="!sidebarCollapsed">
            询价管理
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/messages"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/messages'),
          }"
        >
          <span class="menu-icon">□</span>
          <span v-if="!sidebarCollapsed">
            客户留言
          </span>
        </RouterLink>

        <RouterLink
          to="/admin/settings"
          class="menu-item"
          :class="{
            active: route.path.startsWith('/admin/settings'),
          }"
        >
          <span class="menu-icon">⚙</span>
          <span v-if="!sidebarCollapsed">
            系统设置
          </span>
        </RouterLink>

      </nav>
    </aside>

    <!-- 右侧区域 -->
    <div class="main-area">

      <!-- 顶部栏 -->
      <header class="topbar">

        <div class="topbar-left">
          <button
            type="button"
            class="collapse-button"
            @click="toggleSidebar"
          >
            {{ sidebarCollapsed ? '☰' : '☰' }}
          </button>

          <div class="breadcrumb">
            {{ currentMenu }}
          </div>
        </div>

        <div class="topbar-right">

          <div class="user-info">
            <div class="avatar">
              {{
                (
                  adminUser?.displayName ||
                  adminUser?.username ||
                  'A'
                ).charAt(0).toUpperCase()
              }}
            </div>

            <div
              v-if="!sidebarCollapsed"
              class="user-text"
            >
              <div class="user-name">
                {{
                  adminUser?.displayName ||
                  adminUser?.username ||
                  '管理员'
                }}
              </div>

              <div class="user-role">
                {{ adminUser?.role || 'Admin' }}
              </div>
            </div>
          </div>

          <button
            type="button"
            class="logout-button"
            @click="handleLogout"
          >
            退出
          </button>

        </div>
      </header>

      <!-- 标签/当前页面
      <div class="page-tab">
        <span>首页</span>
        <span class="tab-close">×</span>
      </div>-->

      <!-- 内容 -->
      <main class="content">
        <RouterView />
      </main>

    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #f5f7fa;
  color: #303133;
}

/* Sidebar */

.sidebar {
  width: 220px;
  min-height: 100vh;
  flex-shrink: 0;
  background: #304156;
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 10px;
  background: #2b3a4b;
}

.logo-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.logo-text {
  white-space: nowrap;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
}

.menu {
  padding-top: 10px;
}

.menu-item {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  color: #bfcbd9;
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
  transition:
    background 0.2s,
    color 0.2s;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 0;
}

.menu-item:hover {
  background: #263445;
  color: #ffffff;
}

.menu-item.active {
  background: #409eff;
  color: #ffffff;
}

.menu-icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  font-size: 16px;
}

/* Main */

.main-area {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Topbar */

.topbar {
  height: 60px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.collapse-button {
  border: none;
  background: transparent;
  color: #606266;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.collapse-button:hover {
  color: #409eff;
}

.breadcrumb {
  font-size: 14px;
  color: #606266;
}

.breadcrumb span {
  margin: 0 10px;
  color: #c0c4cc;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 9px;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.user-text {
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  color: #303133;
}

.user-role {
  margin-top: 2px;
  font-size: 11px;
  color: #909399;
}

.logout-button {
  border: none;
  background: transparent;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
}

.logout-button:hover {
  color: #f56c6c;
}

/* Page Tab */

.page-tab {
  height: 40px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}

.tab-close {
  color: #909399;
  cursor: pointer;
}

/* Content */

.content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
