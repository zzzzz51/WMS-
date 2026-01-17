<template>
  <div class="pda-scan">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>条码扫描</h2>
      <el-icon @click="toggleFlash"><Sunny /></el-icon>
    </div>

    <!-- 扫描区域 -->
    <div class="scan-area">
      <div class="camera-view" ref="cameraView">
        <div class="scan-frame">
          <div class="scan-line"></div>
        </div>
        <div class="scan-tip">将条码放入框内自动扫描</div>
      </div>
      
      <div class="manual-input">
        <el-input v-model="manualCode" placeholder="或手动输入条码" size="large" @keyup.enter="handleManualInput">
          <template #append>
            <el-button @click="handleManualInput">确定</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 扫描结果 -->
    <div class="scan-result" v-if="scanResult">
      <div class="result-card">
        <div class="result-type">
          <el-tag :type="scanResult.type === 'material' ? 'primary' : 'success'" size="large">
            {{ scanResult.type === 'material' ? '物料' : '储位' }}
          </el-tag>
        </div>
        
        <div class="result-info" v-if="scanResult.type === 'material'">
          <div class="info-main">
            <div class="material-name">{{ scanResult.data.materialName }}</div>
            <div class="material-code">{{ scanResult.data.materialCode }}</div>
          </div>
          <div class="info-detail">
            <div class="detail-row">
              <span class="detail-label">规格型号</span>
              <span class="detail-value">{{ scanResult.data.spec }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">单位</span>
              <span class="detail-value">{{ scanResult.data.unit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">库存数量</span>
              <span class="detail-value stock">{{ scanResult.data.stock }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">主储位</span>
              <span class="detail-value">{{ scanResult.data.location }}</span>
            </div>
          </div>
        </div>

        <div class="result-info" v-else>
          <div class="info-main">
            <div class="location-code">{{ scanResult.data.locationCode }}</div>
            <div class="location-warehouse">{{ scanResult.data.warehouse }}</div>
          </div>
          <div class="info-detail">
            <div class="detail-row">
              <span class="detail-label">储位类型</span>
              <span class="detail-value">{{ scanResult.data.locationType }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">物料数量</span>
              <span class="detail-value">{{ scanResult.data.materialCount }}种</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">容量利用</span>
              <span class="detail-value">{{ scanResult.data.usage }}%</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <el-button type="primary" @click="handleAction('view')">查看详情</el-button>
          <el-button v-if="scanResult.type === 'material'" @click="handleAction('move')">移库</el-button>
          <el-button @click="clearResult">继续扫描</el-button>
        </div>
      </div>
    </div>

    <!-- 扫描历史 -->
    <div class="scan-history">
      <div class="history-header">
        <span>扫描历史</span>
        <el-button type="danger" link size="small" @click="clearHistory">清空</el-button>
      </div>
      <div class="history-list">
        <div class="history-item" v-for="item in scanHistory" :key="item.id" @click="viewHistoryItem(item)">
          <div class="history-icon">{{ item.type === 'material' ? '📦' : '📍' }}</div>
          <div class="history-info">
            <div class="history-code">{{ item.code }}</div>
            <div class="history-name">{{ item.name }}</div>
          </div>
          <div class="history-time">{{ item.time }}</div>
        </div>
        <el-empty v-if="scanHistory.length === 0" description="暂无扫描记录" :image-size="60" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Sunny } from '@element-plus/icons-vue'

const router = useRouter()
const cameraView = ref(null)
const manualCode = ref('')
const scanResult = ref(null)
const flashOn = ref(false)

const scanHistory = ref([
  { id: 1, type: 'material', code: 'MAT000001', name: '螺栓M10×30', time: '10:30' },
  { id: 2, type: 'location', code: 'A1-01-01', name: 'WH01-主仓库', time: '10:28' },
  { id: 3, type: 'material', code: 'MAT000025', name: '轴承6205', time: '10:25' }
])

const goBack = () => {
  router.back()
}

const toggleFlash = () => {
  flashOn.value = !flashOn.value
  ElMessage.info(flashOn.value ? '闪光灯已开启' : '闪光灯已关闭')
}

const handleManualInput = () => {
  if (!manualCode.value) {
    ElMessage.warning('请输入条码')
    return
  }
  processBarcode(manualCode.value)
  manualCode.value = ''
}

const processBarcode = (code) => {
  // 判断条码类型
  if (code.startsWith('MAT') || code.length === 13) {
    // 物料条码
    scanResult.value = {
      type: 'material',
      data: {
        materialCode: code,
        materialName: '螺栓M10×30',
        spec: 'M10×30',
        unit: '个',
        stock: 650,
        location: 'A1-01-01'
      }
    }
    addToHistory('material', code, '螺栓M10×30')
  } else {
    // 储位条码
    scanResult.value = {
      type: 'location',
      data: {
        locationCode: code,
        warehouse: 'WH01-主仓库',
        locationType: '货架储位',
        materialCount: 5,
        usage: 65
      }
    }
    addToHistory('location', code, 'WH01-主仓库')
  }
}

const addToHistory = (type, code, name) => {
  scanHistory.value.unshift({
    id: Date.now(),
    type,
    code,
    name,
    time: new Date().toLocaleTimeString().slice(0, 5)
  })
  // 只保留最近20条
  if (scanHistory.value.length > 20) {
    scanHistory.value.pop()
  }
}

const clearResult = () => {
  scanResult.value = null
}

const clearHistory = () => {
  scanHistory.value = []
  ElMessage.success('历史记录已清空')
}

const viewHistoryItem = (item) => {
  processBarcode(item.code)
}

const handleAction = (action) => {
  if (action === 'view') {
    ElMessage.info('查看详情')
  } else if (action === 'move') {
    router.push('/pda/transfer')
  }
}

onMounted(() => {
  // 这里可以初始化摄像头扫描
  console.log('Camera initialized')
})
</script>

<style scoped>
.pda-scan {
  min-height: 100vh;
  background: #f5f7fa;
  max-width: 500px;
  margin: 0 auto;
}

.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ff9800;
  color: #fff;
}

.pda-header h2 { margin: 0; font-size: 18px; }

.scan-area {
  background: #000;
}

.camera-view {
  position: relative;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-frame {
  width: 220px;
  height: 160px;
  border: 2px solid #ff9800;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff9800, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

.scan-tip {
  position: absolute;
  bottom: 20px;
  color: #fff;
  font-size: 14px;
  opacity: 0.8;
}

.manual-input {
  padding: 16px;
  background: #fff;
}

.scan-result {
  padding: 16px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-type {
  margin-bottom: 16px;
}

.info-main {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #ebeef5;
}

.material-name, .location-code {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.material-code, .location-warehouse {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.info-detail .detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.detail-label { color: #909399; font-size: 13px; }
.detail-value { color: #303133; font-size: 13px; }
.detail-value.stock { color: #67c23a; font-weight: 600; font-size: 16px; }

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.result-actions .el-button { flex: 1; }

.scan-history {
  padding: 0 16px 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 14px;
  color: #606266;
}

.history-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.history-item:last-child { border-bottom: none; }

.history-icon { font-size: 20px; }
.history-info { flex: 1; }
.history-code { font-size: 14px; font-weight: 500; color: #303133; }
.history-name { font-size: 12px; color: #909399; margin-top: 2px; }
.history-time { font-size: 12px; color: #c0c4cc; }
</style>
