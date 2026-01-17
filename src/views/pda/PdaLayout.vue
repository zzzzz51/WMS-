<template>
  <div class="pda-layout">
    <!-- 顶部导航 -->
    <div class="pda-navbar">
      <div class="nav-left">
        <el-icon v-if="showBack" class="back-btn" @click="goBack"><ArrowLeft /></el-icon>
        <span class="nav-title">{{ pageTitle }}</span>
      </div>
      <div class="nav-right">
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-btn">
            <el-icon><User /></el-icon>
            <span>{{ username }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh">
                <el-icon><Refresh /></el-icon> 刷新数据
              </el-dropdown-item>
              <el-dropdown-item command="setting">
                <el-icon><Setting /></el-icon> 设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon> 退出
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="pda-content">
      <router-view v-slot="{ Component }">
        <transition name="slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 底部导航 -->
    <div class="pda-tabbar">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'home' }"
        @click="switchTab('home')"
      >
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'task' }"
        @click="switchTab('task')"
      >
        <el-icon><List /></el-icon>
        <span>任务</span>
        <span class="badge" v-if="taskCount > 0">{{ taskCount }}</span>
      </div>
      <div class="tab-item scan-btn" @click="openScanner">
        <div class="scan-icon">
          <el-icon><Aim /></el-icon>
        </div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'query' }"
        @click="switchTab('query')"
      >
        <el-icon><Search /></el-icon>
        <span>查询</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'me' }"
        @click="switchTab('me')"
      >
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </div>

    <!-- 扫码弹窗 -->
    <el-dialog v-model="scannerVisible" title="扫描条码" fullscreen :show-close="false">
      <div class="scanner-container">
        <video ref="videoRef" class="scanner-video" autoplay playsinline></video>
        <div class="scanner-overlay">
          <div class="scanner-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="scan-line"></div>
          </div>
        </div>
        <div class="scanner-tip">将条码/二维码放入框内自动扫描</div>
        <div class="scanner-actions">
          <el-button @click="closeScannerOnly" round>取消</el-button>
          <el-button type="primary" @click="toggleFlash" round>
            <el-icon><Sunny /></el-icon> 闪光灯
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, User, Refresh, Setting, SwitchButton,
  HomeFilled, List, Aim, Search, Sunny
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 用户名
const username = ref(localStorage.getItem('pda_user') || '仓库员')

// 任务数量
const taskCount = ref(23)

// 当前标签
const activeTab = ref('home')

// 页面标题
const pageTitle = computed(() => route.meta.title || 'WMS终端')

// 是否显示返回按钮
const showBack = computed(() => route.path !== '/pda' && route.path !== '/pda/')

// 扫码相关
const scannerVisible = ref(false)
const videoRef = ref(null)
let mediaStream = null
let codeReader = null

// 返回上一页
const goBack = () => {
  router.back()
}

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
  switch (tab) {
    case 'home':
      router.push('/pda')
      break
    case 'task':
      // 显示任务列表
      ElMessage.info('任务列表')
      break
    case 'query':
      router.push('/pda/query')
      break
    case 'me':
      ElMessage.info('个人中心')
      break
  }
}

// 打开扫码
const openScanner = async () => {
  scannerVisible.value = true
  
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/library')
    codeReader = new BrowserMultiFormatReader()
    
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      
      codeReader.decodeFromVideoDevice(null, videoRef.value, (result, error) => {
        if (result) {
          handleScanResult(result.getText())
        }
      })
    }
  } catch (err) {
    console.error('Scanner error:', err)
    ElMessage.error('摄像头启动失败')
    scannerVisible.value = false
  }
}

// 处理扫码结果
const handleScanResult = (code) => {
  closeScanner()
  ElMessage.success(`扫描成功：${code}`)
  // 这里可以根据扫描的内容跳转到对应页面或处理
}

// 关闭扫码
const closeScanner = () => {
  scannerVisible.value = false
  
  if (codeReader) {
    codeReader.reset()
    codeReader = null
  }
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
}

const closeScannerOnly = () => {
  closeScanner()
}

// 闪光灯
const toggleFlash = async () => {
  if (mediaStream) {
    const track = mediaStream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()
    if (capabilities.torch) {
      const settings = track.getSettings()
      await track.applyConstraints({ advanced: [{ torch: !settings.torch }] })
    } else {
      ElMessage.warning('当前设备不支持闪光灯')
    }
  }
}

// 下拉命令
const handleCommand = (cmd) => {
  switch (cmd) {
    case 'refresh':
      location.reload()
      break
    case 'setting':
      ElMessage.info('设置页面')
      break
    case 'logout':
      localStorage.removeItem('pda_user')
      router.push('/login')
      break
  }
}

// 提供扫码方法给子组件
provide('openScanner', openScanner)

onUnmounted(() => {
  closeScanner()
})
</script>

<style scoped>
.pda-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f7;
}

/* 顶部导航 */
.pda-navbar {
  height: 50px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.back-btn {
  font-size: 20px;
  cursor: pointer;
}

.nav-title {
  font-size: 16px;
  font-weight: 500;
}

.nav-right .user-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

/* 内容区 */
.pda-content {
  flex: 1;
  overflow-y: auto;
  padding: 50px 0 60px;
}

/* 底部导航 */
.pda-tabbar {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  position: relative;
}

.tab-item .el-icon {
  font-size: 22px;
}

.tab-item.active {
  color: #409eff;
}

.tab-item .badge {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(12px);
  min-width: 16px;
  height: 16px;
  background: #f56c6c;
  color: #fff;
  border-radius: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.tab-item.scan-btn {
  flex: none;
  width: 60px;
}

.scan-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  margin-top: -20px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 扫码器 */
.scanner-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  background: #000;
  position: relative;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.scanner-frame {
  width: 250px;
  height: 250px;
  position: relative;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #409eff;
  border-style: solid;
  border-width: 0;
}

.corner.top-left { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
.corner.top-right { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
.corner.bottom-left { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
.corner.bottom-right { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #409eff, transparent);
  animation: scanning 2s linear infinite;
}

@keyframes scanning {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

.scanner-tip {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 14px;
  text-align: center;
}

.scanner-actions {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
