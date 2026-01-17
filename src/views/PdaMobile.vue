<template>
  <div class="pda-fullscreen">
    <!-- 顶部栏 -->
    <div class="pda-header">
      <span class="title">📱 PDA扫码</span>
      <span class="status" :class="{ online: isOnline }">{{ isOnline ? '在线' : '离线' }}</span>
    </div>

    <!-- 环境检测警告 -->
    <div class="env-warning" v-if="envWarning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">{{ envWarning }}</div>
      <div class="warning-tip">请使用 <strong>https://</strong> 开头的地址访问</div>
    </div>

    <!-- 扫码区域 -->
    <div class="scan-area">
      <div class="camera-container" v-show="scanning && !envWarning">
        <video ref="videoRef" playsinline autoplay muted></video>
        <div class="scan-frame">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
          <div class="scan-line"></div>
        </div>
      </div>
      
      <div class="scan-placeholder" v-show="!scanning || envWarning">
        <div class="placeholder-icon">📷</div>
        <div class="placeholder-text">{{ envWarning ? '无法使用摄像头' : '点击下方按钮开始扫码' }}</div>
      </div>
    </div>

    <!-- 扫描结果 -->
    <div class="result-area" v-if="scanResult">
      <div class="result-label">扫描结果</div>
      <div class="result-value">{{ scanResult }}</div>
      <button class="copy-btn" @click="copyResult">📋 复制</button>
    </div>

    <!-- 手动输入 -->
    <div class="manual-input">
      <input 
        v-model="manualCode" 
        type="text" 
        placeholder="手动输入条码或扫描结果" 
        @keyup.enter="handleManualSubmit"
      />
      <button class="submit-btn" @click="handleManualSubmit">确认</button>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button 
        class="scan-btn" 
        :class="{ active: scanning }" 
        @click="toggleScan"
        :disabled="!!envWarning"
      >
        {{ scanning ? '⏹ 停止扫描' : '📸 开始扫描' }}
      </button>
      <button class="switch-btn" @click="switchCamera" v-if="cameras.length > 1 && scanning">
        🔄 切换摄像头
      </button>
    </div>

    <!-- 最近扫描记录 -->
    <div class="history-area" v-if="scanHistory.length">
      <div class="history-title">最近扫描</div>
      <div class="history-list">
        <div class="history-item" v-for="(item, index) in scanHistory" :key="index" @click="selectHistory(item)">
          <span class="history-code">{{ item.code }}</span>
          <span class="history-time">{{ item.time }}</span>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="toast" v-if="toast.show" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const videoRef = ref(null)
const scanning = ref(false)
const scanResult = ref('')
const manualCode = ref('')
const envWarning = ref('')
const isOnline = ref(navigator.onLine)
const cameras = ref([])
const currentCameraIndex = ref(0)
const scanHistory = ref([])
const toast = ref({ show: false, message: '', type: 'info' })

let codeReader = null
let stream = null

// 显示提示
const showToast = (message, type = 'info') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

// 检查环境
const checkEnvironment = () => {
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  
  if (!isSecure) {
    envWarning.value = '摄像头需要 HTTPS 协议才能使用'
    return false
  }
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    envWarning.value = '您的浏览器不支持摄像头功能'
    return false
  }
  
  envWarning.value = ''
  return true
}

// 获取摄像头列表
const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices.filter(d => d.kind === 'videoinput')
    // 优先选择后置摄像头
    const backIndex = cameras.value.findIndex(c => 
      c.label.toLowerCase().includes('back') || 
      c.label.toLowerCase().includes('rear') ||
      c.label.includes('后')
    )
    if (backIndex > -1) currentCameraIndex.value = backIndex
  } catch (e) {
    console.error('获取摄像头列表失败', e)
  }
}

// 开始扫描
const startScan = async () => {
  if (!checkEnvironment()) return
  
  try {
    // 动态导入 zxing
    const { BrowserMultiFormatReader } = await import('@zxing/library')
    codeReader = new BrowserMultiFormatReader()
    
    await getCameras()
    
    const deviceId = cameras.value[currentCameraIndex.value]?.deviceId
    const constraints = {
      video: deviceId 
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'environment' } // 优先后置摄像头
    }
    
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
      
      // 开始解码
      codeReader.decodeFromVideoDevice(deviceId, videoRef.value, (result, error) => {
        if (result) {
          handleScanSuccess(result.getText())
        }
      })
      
      scanning.value = true
      showToast('摄像头已启动', 'success')
    }
  } catch (error) {
    console.error('启动摄像头失败:', error)
    
    let msg = '摄像头启动失败'
    if (error.name === 'NotAllowedError') {
      msg = '请允许摄像头权限'
    } else if (error.name === 'NotFoundError') {
      msg = '未找到摄像头设备'
    } else if (error.name === 'NotReadableError') {
      msg = '摄像头被占用'
    }
    
    showToast(msg, 'error')
  }
}

// 停止扫描
const stopScan = () => {
  if (codeReader) {
    codeReader.reset()
    codeReader = null
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  scanning.value = false
}

// 切换扫描
const toggleScan = () => {
  if (scanning.value) {
    stopScan()
  } else {
    startScan()
  }
}

// 切换摄像头
const switchCamera = async () => {
  if (cameras.value.length <= 1) return
  
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length
  stopScan()
  await startScan()
  showToast(`已切换到摄像头 ${currentCameraIndex.value + 1}`, 'info')
}

// 扫描成功处理
const handleScanSuccess = (code) => {
  // 防止重复扫描
  if (scanResult.value === code) return
  
  scanResult.value = code
  manualCode.value = code
  
  // 震动反馈
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
  
  // 添加到历史
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  scanHistory.value.unshift({ code, time })
  if (scanHistory.value.length > 10) scanHistory.value.pop()
  
  showToast('扫描成功！', 'success')
  
  // 这里可以调用API处理扫描结果
  // handleBarcode(code)
}

// 手动提交
const handleManualSubmit = () => {
  if (!manualCode.value.trim()) {
    showToast('请输入条码', 'error')
    return
  }
  scanResult.value = manualCode.value.trim()
  showToast('提交成功', 'success')
  
  // 添加到历史
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  scanHistory.value.unshift({ code: manualCode.value.trim(), time })
  if (scanHistory.value.length > 10) scanHistory.value.pop()
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(scanResult.value)
    showToast('已复制', 'success')
  } catch {
    showToast('复制失败', 'error')
  }
}

// 选择历史记录
const selectHistory = (item) => {
  manualCode.value = item.code
  scanResult.value = item.code
}

// 监听网络状态
const handleOnline = () => { isOnline.value = true }
const handleOffline = () => { isOnline.value = false }

onMounted(() => {
  checkEnvironment()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  stopScan()
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.pda-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-y: auto;
  z-index: 9999;
}

/* 顶部栏 */
.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #16213e, #1a1a2e);
  border-bottom: 1px solid #333;
}

.pda-header .title {
  font-size: 18px;
  font-weight: 600;
}

.pda-header .status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #e74c3c;
}

.pda-header .status.online {
  background: #27ae60;
}

/* 环境警告 */
.env-warning {
  background: linear-gradient(135deg, #f39c12, #e74c3c);
  padding: 20px;
  text-align: center;
  margin: 12px;
  border-radius: 12px;
}

.warning-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.warning-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.warning-tip {
  font-size: 14px;
  opacity: 0.9;
}

/* 扫码区域 */
.scan-area {
  flex: 1;
  min-height: 280px;
  max-height: 350px;
  margin: 12px;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  position: relative;
}

.camera-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #00d9ff;
  border-style: solid;
}

.corner.tl { top: -2px; left: -2px; border-width: 4px 0 0 4px; border-radius: 8px 0 0 0; }
.corner.tr { top: -2px; right: -2px; border-width: 4px 4px 0 0; border-radius: 0 8px 0 0; }
.corner.bl { bottom: -2px; left: -2px; border-width: 0 0 4px 4px; border-radius: 0 0 0 8px; }
.corner.br { bottom: -2px; right: -2px; border-width: 0 4px 4px 0; border-radius: 0 0 8px 0; }

.scan-line {
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #00d9ff, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: calc(100% - 3px); }
  100% { top: 0; }
}

.scan-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
}

.placeholder-icon {
  font-size: 60px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
}

/* 扫描结果 */
.result-area {
  margin: 0 12px 12px;
  padding: 14px;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-label {
  font-size: 12px;
  opacity: 0.8;
}

.result-value {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.copy-btn {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

/* 手动输入 */
.manual-input {
  display: flex;
  gap: 10px;
  margin: 0 12px 12px;
}

.manual-input input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #333;
  border-radius: 12px;
  background: #16213e;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.manual-input input:focus {
  border-color: #00d9ff;
}

.manual-input input::placeholder {
  color: #666;
}

.submit-btn {
  padding: 14px 24px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  margin: 0 12px 12px;
}

.scan-btn {
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.scan-btn.active {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.scan-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.switch-btn {
  padding: 16px 20px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

/* 历史记录 */
.history-area {
  margin: 0 12px 20px;
}

.history-title {
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  background: #16213e;
  border-radius: 10px;
  cursor: pointer;
}

.history-item:active {
  background: #1e3a5f;
}

.history-code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00d9ff;
}

.history-time {
  font-size: 12px;
  color: #666;
}

/* 提示信息 */
.toast {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  animation: fadeInOut 2.5s ease;
}

.toast.success {
  background: #27ae60;
}

.toast.error {
  background: #e74c3c;
}

.toast.info {
  background: #3498db;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  85% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

/* 安全区域适配 iPhone */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pda-fullscreen {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
