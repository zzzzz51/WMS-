<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bg-shape shape1"></div>
      <div class="bg-shape shape2"></div>
      <div class="bg-shape shape3"></div>
    </div>
    
    <div class="login-box">
      <div class="login-left">
        <div class="brand">
          <el-icon :size="60" color="#409eff"><Box /></el-icon>
          <h1>WMS仓储管理系统</h1>
          <p>Warehouse Management System</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24"><Checked /></el-icon>
            <span>智能库存管理</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Checked /></el-icon>
            <span>条码/RFID支持</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Checked /></el-icon>
            <span>实时数据分析</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><Checked /></el-icon>
            <span>移动端PDA操作</span>
          </div>
        </div>
      </div>
      
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2>用户登录</h2>
          <p class="subtitle">欢迎回来，请登录您的账户</p>
          
          <el-form :model="loginForm" :rules="loginRules" ref="formRef" class="login-form">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" 
                prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
            </el-form-item>
            <el-form-item prop="captcha" v-if="showCaptcha">
              <div class="captcha-row">
                <el-input v-model="loginForm.captcha" placeholder="验证码" size="large" style="flex: 1" />
                <div class="captcha-img" @click="refreshCaptcha">
                  <span>{{ captchaText }}</span>
                </div>
              </div>
            </el-form-item>
            
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>
            
            <el-button type="primary" class="login-btn" size="large" :loading="loading" @click="handleLogin">
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>
          
          <div class="login-footer">
            <span>演示账号：admin / admin123</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="copyright">
      © 2024 WMS仓储管理系统 v1.0.0
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Box, Checked } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const showCaptcha = ref(false)
const captchaText = ref('ABCD')

const loginForm = reactive({
  username: 'admin',
  password: 'admin123',
  captcha: '',
  remember: true
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const refreshCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = code
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      setTimeout(() => {
        if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
          localStorage.setItem('token', 'mock-token-' + Date.now())
          localStorage.setItem('username', loginForm.username)
          ElMessage.success('登录成功')
          router.push('/home')
        } else {
          ElMessage.error('用户名或密码错误')
          showCaptcha.value = true
          refreshCaptcha()
        }
        loading.value = false
      }, 1000)
    }
  })
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  background: white;
}

.shape1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.shape2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  right: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.shape3 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 20%;
  animation: float 10s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.login-box {
  display: flex;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
  z-index: 1;
  max-width: 900px;
  width: 90%;
}

.login-left {
  width: 400px;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand {
  text-align: center;
  margin-bottom: 40px;
}

.brand h1 {
  font-size: 24px;
  margin: 16px 0 8px;
}

.brand p {
  opacity: 0.8;
  font-size: 14px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.login-right {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  align-items: center;
}

.login-form-wrapper {
  width: 100%;
}

.login-form-wrapper h2 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 24px;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-img {
  width: 120px;
  height: 40px;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #409eff;
  font-family: 'Courier New', monospace;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.copyright {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

@media (max-width: 768px) {
  .login-left {
    display: none;
  }
  
  .login-box {
    max-width: 400px;
  }
  
  .login-right {
    padding: 40px 30px;
  }
}
</style>
