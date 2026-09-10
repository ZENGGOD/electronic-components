<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')

const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true

  try {
    const response = await fetch(
      'http://localhost:3000/api/admin/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      },
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      errorMessage.value =
        result.message || '登录失败'
      return
    }

    localStorage.setItem(
      'admin_token',
      result.data.token,
    )

    localStorage.setItem(
      'admin_user',
      JSON.stringify(result.data.admin),
    )

    await router.push('/admin')
  } catch (error) {
    console.error(
      'Admin login failed:',
      error,
    )

    errorMessage.value =
      '无法连接服务器，请检查后端是否正在运行'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="panel">

      <h1>Electronic Components</h1>

      <p class="sub">
        管理后台登录
      </p>

      <form
        class="login-form"
        @submit.prevent="handleLogin"
      >

        <!-- 用户名 -->
        <div class="form-item">
          <label for="username">
            用户名
          </label>

          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </div>

        <!-- 密码 -->
        <div class="form-item">
          <label for="password">
            密码
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </div>

        <!-- 错误信息 -->
        <div
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </div>

        <!-- 登录 -->
        <button
          type="submit"
          class="submit"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

      </form>

    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.panel {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 8px;
  padding: 40px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.06);
}

.panel h1 {
  margin: 0;
  text-align: center;
  font-size: 26px;
  font-weight: 600;
  color: #303133;
}

.sub {
  margin: 10px 0 32px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 22px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.form-item input {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  background: #ffffff;
  color: #303133;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-item input::placeholder {
  color: #c0c4cc;
}

.form-item input:hover {
  border-color: #c0c4cc;
}

.form-item input:focus {
  border-color: #409eff;
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.1);
}

.submit {
  width: 100%;
  height: 40px;
  margin-top: 4px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.submit:hover {
  background: #66b1ff;
}

.submit:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 13px;
}
</style>
