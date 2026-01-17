<template>
  <div class="pda-count">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>盘点作业</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描物料条码或储位" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
      </el-input>
    </div>

    <!-- 盘点任务列表 -->
    <div class="task-list" v-if="!currentTask">
      <div class="list-header">
        <span>我的盘点任务</span>
        <el-button type="primary" link size="small">刷新</el-button>
      </div>
      <div class="task-item" v-for="task in myTasks" :key="task.id" @click="selectTask(task)">
        <div class="task-icon">📋</div>
        <div class="task-info">
          <div class="task-name">{{ task.planName }}</div>
          <div class="task-scope">{{ task.warehouse }} / {{ task.scope }}</div>
        </div>
        <div class="task-meta">
          <el-progress :percentage="task.progress" :stroke-width="6" :show-text="false" style="width: 60px" />
          <div class="task-progress">{{ task.progress }}%</div>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>

      <el-empty v-if="myTasks.length === 0" description="暂无盘点任务" />
    </div>

    <!-- 盘点执行 -->
    <div class="count-execute" v-else>
      <div class="execute-header">
        <div class="header-info">
          <div class="task-name">{{ currentTask.planName }}</div>
          <div class="task-scope">{{ currentTask.warehouse }} / {{ currentTask.scope }}</div>
        </div>
        <el-button type="primary" link @click="currentTask = null">返回列表</el-button>
      </div>

      <!-- 盘点进度 -->
      <div class="progress-card">
        <div class="progress-stats">
          <div class="stat-item">
            <div class="stat-value">{{ countStats.total }}</div>
            <div class="stat-label">总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value counted">{{ countStats.counted }}</div>
            <div class="stat-label">已盘</div>
          </div>
          <div class="stat-item">
            <div class="stat-value diff">{{ countStats.diff }}</div>
            <div class="stat-label">差异</div>
          </div>
        </div>
        <el-progress :percentage="currentTask.progress" :stroke-width="10" />
      </div>

      <!-- 待盘物料 -->
      <div class="material-list">
        <div class="list-title">待盘物料</div>
        <div class="material-item" v-for="item in currentTask.items" :key="item.id"
          :class="{ counted: item.counted, diff: item.diff !== 0 }">
          <div class="material-info">
            <div class="material-name">{{ item.materialName }}</div>
            <div class="material-code">{{ item.materialCode }}</div>
            <div class="material-location">
              <el-icon><Location /></el-icon>
              {{ item.location }}
            </div>
          </div>
          <div class="material-qty" v-if="item.counted">
            <div class="qty-book">账: {{ item.bookQty }}</div>
            <div class="qty-actual">实: {{ item.actualQty }}</div>
            <div class="qty-diff" :class="{ positive: item.diff > 0, negative: item.diff < 0 }">
              差: {{ item.diff > 0 ? '+' : '' }}{{ item.diff }}
            </div>
          </div>
          <div class="material-qty" v-else>
            <div class="qty-book">账: {{ item.bookQty }}</div>
            <div class="qty-hint">{{ currentTask.blind ? '盲盘' : '' }}</div>
          </div>
          <el-button type="primary" size="small" @click="openCountDialog(item)" :disabled="item.counted">
            {{ item.counted ? '✓' : '盘点' }}
          </el-button>
        </div>
      </div>

      <div class="action-footer">
        <el-button size="large" @click="currentTask = null">暂停</el-button>
        <el-button type="primary" size="large" @click="submitCount">提交盘点</el-button>
      </div>
    </div>

    <!-- 盘点弹窗 -->
    <el-dialog v-model="countDialogVisible" title="盘点录入" width="90%">
      <div class="count-form" v-if="currentItem">
        <div class="item-card">
          <div class="item-name">{{ currentItem.materialName }}</div>
          <div class="item-code">{{ currentItem.materialCode }}</div>
          <div class="item-location">储位: {{ currentItem.location }}</div>
        </div>

        <div class="book-qty" v-if="!currentTask?.blind">
          <span>账面数量:</span>
          <span class="qty-value">{{ currentItem.bookQty }} {{ currentItem.unit }}</span>
        </div>

        <div class="form-item">
          <label>实盘数量</label>
          <el-input-number v-model="actualQty" :min="0" size="large" style="width: 100%" />
        </div>

        <div class="form-item">
          <label>备注</label>
          <el-input v-model="countRemark" placeholder="盘点备注（选填）" />
        </div>
      </div>

      <template #footer>
        <el-button @click="countDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCount">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, More, Aim, Location } from '@element-plus/icons-vue'

const router = useRouter()
const scanCode = ref('')
const currentTask = ref(null)
const currentItem = ref(null)
const countDialogVisible = ref(false)
const actualQty = ref(0)
const countRemark = ref('')

const myTasks = ref([
  { id: 1, planName: '2025年1月全盘', warehouse: 'WH01', scope: 'A区', progress: 35, blind: false, items: [
    { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', location: 'A1-01-01', unit: '个', bookQty: 500, actualQty: 500, counted: true, diff: 0 },
    { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', location: 'A1-01-02', unit: '个', bookQty: 300, actualQty: 295, counted: true, diff: -5 },
    { id: 3, materialCode: 'MAT000003', materialName: '垫片φ10', location: 'A1-02-01', unit: '个', bookQty: 1000, actualQty: 0, counted: false, diff: 0 },
    { id: 4, materialCode: 'MAT000004', materialName: '弹簧垫M10', location: 'A1-02-02', unit: '个', bookQty: 800, actualQty: 0, counted: false, diff: 0 }
  ]},
  { id: 2, planName: 'Q1抽盘-高值物料', warehouse: 'WH01,WH02', scope: '高值物料', progress: 60, blind: true, items: [] }
])

const countStats = computed(() => {
  if (!currentTask.value) return { total: 0, counted: 0, diff: 0 }
  const items = currentTask.value.items
  return {
    total: items.length,
    counted: items.filter(i => i.counted).length,
    diff: items.filter(i => i.diff !== 0).length
  }
})

const goBack = () => {
  if (currentTask.value) {
    currentTask.value = null
  } else {
    router.back()
  }
}

const handleScan = () => {
  if (scanCode.value && currentTask.value) {
    const item = currentTask.value.items.find(i => 
      i.materialCode === scanCode.value || i.location === scanCode.value
    )
    if (item && !item.counted) {
      openCountDialog(item)
    } else if (item) {
      ElMessage.info('该物料已盘点')
    } else {
      ElMessage.warning('未找到匹配物料')
    }
  }
  scanCode.value = ''
}

const selectTask = (task) => {
  currentTask.value = task
}

const openCountDialog = (item) => {
  currentItem.value = item
  actualQty.value = currentTask.value?.blind ? 0 : item.bookQty
  countRemark.value = ''
  countDialogVisible.value = true
}

const confirmCount = () => {
  currentItem.value.actualQty = actualQty.value
  currentItem.value.diff = actualQty.value - currentItem.value.bookQty
  currentItem.value.counted = true
  
  // 更新进度
  const counted = currentTask.value.items.filter(i => i.counted).length
  currentTask.value.progress = Math.round(counted / currentTask.value.items.length * 100)
  
  countDialogVisible.value = false
  ElMessage.success('盘点完成')
}

const submitCount = () => {
  const uncounted = currentTask.value.items.filter(i => !i.counted).length
  if (uncounted > 0) {
    ElMessage.warning(`还有 ${uncounted} 项未盘点`)
    return
  }
  ElMessage.success('盘点结果已提交')
  currentTask.value = null
}
</script>

<style scoped>
.pda-count {
  min-height: 100vh;
  background: #f5f7fa;
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #9c27b0;
  color: #fff;
}

.pda-header h2 { margin: 0; font-size: 18px; }

.scan-area { padding: 16px; background: #fff; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  color: #606266;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.task-icon { font-size: 24px; }
.task-info { flex: 1; }
.task-name { font-size: 15px; font-weight: 500; color: #303133; }
.task-scope { font-size: 13px; color: #909399; margin-top: 4px; }
.task-meta { text-align: right; }
.task-progress { font-size: 12px; color: #909399; margin-top: 4px; }

.execute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
}

.progress-card {
  margin: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.progress-stats {
  display: flex;
  margin-bottom: 16px;
}

.progress-stats .stat-item {
  flex: 1;
  text-align: center;
}

.progress-stats .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.progress-stats .stat-value.counted { color: #67c23a; }
.progress-stats .stat-value.diff { color: #f56c6c; }
.progress-stats .stat-label { font-size: 12px; color: #909399; margin-top: 4px; }

.material-list { padding: 0 16px; }
.list-title { font-size: 14px; color: #606266; margin-bottom: 12px; }

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.material-item.counted { background: #f0f9eb; }
.material-item.diff { border-left: 3px solid #f56c6c; }

.material-info { flex: 1; }
.material-name { font-size: 14px; font-weight: 500; color: #303133; }
.material-code { font-size: 12px; color: #909399; margin-top: 2px; }
.material-location { font-size: 12px; color: #9c27b0; margin-top: 4px; display: flex; align-items: center; gap: 4px; }

.material-qty { text-align: right; font-size: 12px; }
.qty-book { color: #606266; }
.qty-actual { color: #303133; font-weight: 500; }
.qty-diff { font-weight: 600; }
.qty-diff.positive { color: #67c23a; }
.qty-diff.negative { color: #f56c6c; }
.qty-hint { color: #909399; font-style: italic; }

.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  max-width: 500px;
  margin: 0 auto;
}

.action-footer .el-button { flex: 1; }

.count-form .item-card {
  background: #f3e5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.count-form .item-name { font-size: 16px; font-weight: 600; color: #303133; }
.count-form .item-code { font-size: 13px; color: #909399; margin-top: 4px; }
.count-form .item-location { font-size: 13px; color: #9c27b0; margin-top: 4px; }

.book-qty {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.book-qty .qty-value { font-weight: 600; color: #303133; }

.count-form .form-item { margin-bottom: 16px; }
.count-form label { display: block; font-size: 13px; color: #606266; margin-bottom: 8px; }
</style>
