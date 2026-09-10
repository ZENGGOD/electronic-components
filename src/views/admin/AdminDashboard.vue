<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface DashboardStats {
  products: number
  manufacturers: number
  categories: number
  technicalTopics: number
  quoteRequests: number
  contactMessages: number
}

const stats = ref<DashboardStats>({
  products: 0,
  manufacturers: 0,
  categories: 0,
  technicalTopics: 0,
  quoteRequests: 0,
  contactMessages: 0,
})

const loading = ref(true)
const errorMessage = ref('')

interface AdminUser {
  displayName: string | null
  username: string
  role: string
}

const adminUser = ref<AdminUser | null>(null)

function loadAdminUser() {
  const user = localStorage.getItem('admin_user')

  if (!user) {
    return
  }

  try {
    adminUser.value = JSON.parse(user)
  } catch {
    adminUser.value = null
  }
}

async function fetchDashboard() {
  loading.value = true
  errorMessage.value = ''

  const token = localStorage.getItem('admin_token')

  if (!token) {
    router.push('/admin/login')
    return
  }

  try {
    const response = await fetch(
      'http://localhost:3000/api/admin/dashboard',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')

        router.push('/admin/login')
        return
      }

      errorMessage.value =
        result.message ||
        '获取 Dashboard 数据失败'

      return
    }

    stats.value = result.data
  } catch (error) {
    console.error(
      'Failed to fetch dashboard:',
      error,
    )

    errorMessage.value =
      '无法连接服务器，请检查后端是否正在运行'
  } finally {
    loading.value = false
  }
}

function goTo(path: string) {
  router.push(path)
}

onMounted(() => {
  loadAdminUser()
  fetchDashboard()
})
</script>

<template>
  <div class="dashboard">

    <!-- 欢迎区域 -->
    <section class="welcome">
      <div>
        <h2>
          {{
            adminUser?.displayName ||
            adminUser?.username ||
            '管理员'
          }}，欢迎回来
        </h2>

        <p>
          Electronic Components 管理后台
        </p>
      </div>

      <div class="welcome-date">
        管理控制台
      </div>
    </section>

    <!-- Loading -->
    <div
      v-if="loading"
      class="state-card"
    >
      正在加载系统数据...
    </div>

    <!-- Error -->
    <div
      v-else-if="errorMessage"
      class="state-card error"
    >
      {{ errorMessage }}
    </div>

    <!-- Dashboard -->
    <template v-else>

      <!-- 数据统计 -->
      <section class="stats-grid">

        <div class="stat-card">
          <div class="stat-icon product">
            P
          </div>

          <div class="stat-content">
            <div class="stat-label">
              产品总数
            </div>

            <div class="stat-value">
              {{ stats.products }}
            </div>

            <div class="stat-link">
              产品管理
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon manufacturer">
            M
          </div>

          <div class="stat-content">
            <div class="stat-label">
              厂商数量
            </div>

            <div class="stat-value">
              {{ stats.manufacturers }}
            </div>

            <div class="stat-link">
              厂商管理
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon category">
            C
          </div>

          <div class="stat-content">
            <div class="stat-label">
              产品分类
            </div>

            <div class="stat-value">
              {{ stats.categories }}
            </div>

            <div class="stat-link">
              分类管理
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon technical">
            T
          </div>

          <div class="stat-content">
            <div class="stat-label">
              技术资料
            </div>

            <div class="stat-value">
              {{ stats.technicalTopics }}
            </div>

            <div class="stat-link">
              技术资料
            </div>
          </div>
        </div>

      </section>

      <!-- 第二行 -->
      <section class="stats-grid second-row">

        <div class="stat-card">
          <div class="stat-icon quote">
            Q
          </div>

          <div class="stat-content">
            <div class="stat-label">
              待处理询价
            </div>

            <div class="stat-value">
              {{ stats.quoteRequests }}
            </div>

            <div class="stat-link">
              询价管理
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon message">
            M
          </div>

          <div class="stat-content">
            <div class="stat-label">
              客户留言
            </div>

            <div class="stat-value">
              {{ stats.contactMessages }}
            </div>

            <div class="stat-link">
              客户留言
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-card">
          <div class="card-title">
            快捷操作
          </div>

          <div class="quick-actions">

            <button
              type="button"
              @click="goTo('/admin/products')"
            >
              产品管理
            </button>

            <button
              type="button"
              @click="goTo('/admin/manufacturers')"
            >
              厂商管理
            </button>

            <button
              type="button"
              @click="goTo('/admin/categories')"
            >
              分类管理
            </button>

            <button
              type="button"
              @click="goTo('/admin/technical')"
            >
              技术资料
            </button>

          </div>
        </div>

      </section>

      <!-- 系统信息 -->
      <section class="bottom-grid">

        <div class="info-card">
          <div class="card-title">
            系统信息
          </div>

          <div class="info-list">

            <div class="info-row">
              <span>系统名称</span>
              <strong>
                Electronic Components
              </strong>
            </div>

            <div class="info-row">
              <span>管理角色</span>
              <strong>
                {{ adminUser?.role || 'Admin' }}
              </strong>
            </div>

            <div class="info-row">
              <span>系统状态</span>
              <strong class="status">
                正常运行
              </strong>
            </div>

          </div>
        </div>

        <div class="info-card">
          <div class="card-title">
            管理提示
          </div>

          <div class="tips">

            <div class="tip">
              <span class="dot"></span>
              定期维护产品信息
            </div>

            <div class="tip">
              <span class="dot"></span>
              及时处理客户询价
            </div>

            <div class="tip">
              <span class="dot"></span>
              保持技术资料完整
            </div>

            <div class="tip">
              <span class="dot"></span>
              定期检查系统设置
            </div>

          </div>
        </div>

      </section>

    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1600px;
  margin: 0 auto;
}

/* Welcome */

.welcome {
  min-height: 100px;
  margin-bottom: 20px;
  padding: 24px 28px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome h2 {
  margin: 0;
  font-size: 21px;
  font-weight: 500;
  color: #303133;
}

.welcome p {
  margin: 9px 0 0;
  color: #909399;
  font-size: 13px;
}

.welcome-date {
  color: #909399;
  font-size: 13px;
}

/* Stats */

.stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.second-row {
  margin-top: 18px;
}

.stat-card {
  min-height: 128px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 18px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.stat-icon.product {
  background: #ecf5ff;
  color: #409eff;
}

.stat-icon.manufacturer {
  background: #f0f9eb;
  color: #67c23a;
}

.stat-icon.category {
  background: #fdf6ec;
  color: #e6a23c;
}

.stat-icon.technical {
  background: #f4f4f5;
  color: #909399;
}

.stat-icon.quote {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-icon.message {
  background: #f0f9ff;
  color: #36a3f7;
}

.stat-content {
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 500;
  color: #303133;
}

.stat-link {
  margin-top: 6px;
  font-size: 12px;
  color: #409eff;
}

/* Quick */

.quick-card {
  grid-column: span 2;
  min-height: 128px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.card-title {
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.quick-actions {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.quick-actions button {
  height: 38px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  color: #606266;
  cursor: pointer;
  font-size: 13px;
}

.quick-actions button:hover {
  border-color: #409eff;
  color: #409eff;
}

/* Bottom */

.bottom-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.info-card {
  padding: 22px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.info-list {
  border-top: 1px solid #f2f6fc;
}

.info-row {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f2f6fc;
  font-size: 13px;
}

.info-row span {
  color: #909399;
}

.info-row strong {
  font-weight: 400;
  color: #606266;
}

.info-row .status {
  color: #67c23a;
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: #606266;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #409eff;
}

/* State */

.state-card {
  padding: 50px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  color: #909399;
}

.state-card.error {
  color: #f56c6c;
}

/* Responsive */

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .quick-card {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }

  .sidebar .menu-item {
    justify-content: center;
    padding: 0;
  }

  .logo-text {
    display: none;
  }

  .stats-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .quick-card {
    grid-column: span 1;
  }

  .quick-actions {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .welcome-date {
    display: none;
  }
}
</style>
