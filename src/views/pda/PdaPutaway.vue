<template>
  <div class="pda-putaway">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>上架作业</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描物料条码或储位" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
      </el-input>
    </div>

    <!-- 待上架任务列表 -->
    <div class="task-tabs">
      <el-radio-group v-model="activeTab" size="small">
        <el-radio-button label="pending">待上架 ({{ pendingTasks.length }})</el-radio-button>
        <el-radio-button label="completed">已完成 ({{ completedTasks.length }})</el-radio-button>
      </el-radio-group>
    </div>

    <div class="task-list">
      <div class="task-item" v-for="task in currentTasks" :key="task.id" @click="handleTask(task)">
        <div class="task-icon" :style="{ background: activeTab === 'pending' ? '#e6f4ff' : '#f0f9eb' }">
          {{ activeTab === 'pending' ? '⬆️' : '✅' }}
        </div>
        <div class="task-info">
          <div class="task-material">{{ task.materialName }}</div>
          <div class="task-code">{{ task.materialCode }}</div>
          <div class="task-detail">
            <span>数量: {{ task.quantity }} {{ task.unit }}</span>
            <span>批次: {{ task.batchNo }}</span>
          </div>
        </div>
        <div class="task-location">
          <div class="location-label">建议储位</div>
          <div class="location-value">{{ task.suggestLocation }}</div>
        </div>
      </div>

      <el-empty v-if="currentTasks.length === 0" description="暂无任务" />
    </div>

    <!-- 上架确认弹窗 -->
    <el-dialog v-model="putawayDialogVisible" title="上架确认" width="90%">
      <div class="putaway-form" v-if="currentTask">
        <div class="material-card">
          <div class="material-name">{{ currentTask.materialName }}</div>
          <div class="material-code">{{ currentTask.materialCode }}</div>
          <div class="material-batch">批次: {{ currentTask.batchNo }}</div>
        </div>

        <div class="form-item">
          <label>上架数量</label>
          <el-input-number v-model="putawayQty" :min="1" :max="currentTask.quantity" size="large" style="width: 100%" />
        </div>

        <div class="form-item">
          <label>目标储位</label>
          <el-input v-model="targetLocation" placeholder="扫描或输入储位" size="large">
            <template #append>
              <el-button @click="useSuggest">使用建议</el-button>
            </template>
          </el-input>
          <div class="suggest-tip">建议储位: {{ currentTask.suggestLocation }}</div>
        </div>
      </div>

      <template #footer>
        <el-button @click="putawayDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPutaway">确认上架</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, More, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const scanCode = ref('')
const activeTab = ref('pending')
const putawayDialogVisible = ref(false)
const currentTask = ref(null)
const putawayQty = ref(0)
const targetLocation = ref('')

const pendingTasks = ref([
  { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', quantity: 500, unit: '个', batchNo: 'BT20250111001', suggestLocation: 'A1-01-01' },
  { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', quantity: 300, unit: '个', batchNo: 'BT20250111002', suggestLocation: 'A1-01-02' },
  { id: 3, materialCode: 'MAT000025', materialName: '轴承6205', quantity: 50, unit: '个', batchNo: 'BT20250111003', suggestLocation: 'B2-03-01' },
  { id: 4, materialCode: 'MAT000108', materialName: '密封圈DN50', quantity: 200, unit: '个', batchNo: 'BT20250111004', suggestLocation: 'C1-02-05' }
])

const completedTasks = ref([
  { id: 101, materialCode: 'MAT000050', materialName: '电机YE2', quantity: 5, unit: '台', batchNo: 'BT20250110001', suggestLocation: 'D1-01-01' }
])

const currentTasks = computed(() => {
  return activeTab.value === 'pending' ? pendingTasks.value : completedTasks.value
})

const goBack = () => {
  router.back()
}

const handleScan = () => {
  if (scanCode.value) {
    const task = pendingTasks.value.find(t => t.materialCode === scanCode.value || t.batchNo === scanCode.value)
    if (task) {
      handleTask(task)
    } else {
      ElMessage.warning('未找到匹配的上架任务')
    }
    scanCode.value = ''
  }
}

const handleTask = (task) => {
  if (activeTab.value === 'completed') {
    ElMessage.info('该任务已完成')
    return
  }
  currentTask.value = task
  putawayQty.value = task.quantity
  targetLocation.value = ''
  putawayDialogVisible.value = true
}

const useSuggest = () => {
  if (currentTask.value) {
    targetLocation.value = currentTask.value.suggestLocation
  }
}

const confirmPutaway = () => {
  if (!targetLocation.value) {
    ElMessage.warning('请输入目标储位')
    return
  }

  // 移动到已完成列表
  const idx = pendingTasks.value.findIndex(t => t.id === currentTask.value.id)
  if (idx > -1) {
    const task = pendingTasks.value.splice(idx, 1)[0]
    completedTasks.value.unshift(task)
  }

  putawayDialogVisible.value = false
  ElMessage.success(`已上架到 ${targetLocation.value}`)
}
</script>

<style scoped>
.pda-putaway {
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
  background: #67c23a;
  color: #fff;
}

.pda-header h2 {
  margin: 0;
  font-size: 18px;
}

.scan-area {
  padding: 16px;
  background: #fff;
}

.task-tabs {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.task-list {
  padding: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
}

.task-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.task-info { flex: 1; }
.task-material { font-size: 14px; font-weight: 500; color: #303133; }
.task-code { font-size: 12px; color: #909399; margin-top: 2px; }
.task-detail { font-size: 12px; color: #c0c4cc; margin-top: 4px; display: flex; gap: 12px; }

.task-location { text-align: right; }
.location-label { font-size: 11px; color: #909399; }
.location-value { font-size: 14px; color: #67c23a; font-weight: 600; margin-top: 2px; }

.putaway-form .material-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.putaway-form .material-name { font-size: 16px; font-weight: 600; color: #303133; }
.putaway-form .material-code { font-size: 13px; color: #909399; margin-top: 4px; }
.putaway-form .material-batch { font-size: 13px; color: #409eff; margin-top: 4px; }

.putaway-form .form-item {
  margin-bottom: 16px;
}

.putaway-form label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.suggest-tip {
  font-size: 12px;
  color: #67c23a;
  margin-top: 8px;
}
</style>
