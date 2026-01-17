<template>
  <div class="pda-picking">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>发料作业</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描领用单号或物料条码" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
      </el-input>
    </div>

    <!-- 待发料列表 -->
    <div class="order-list" v-if="!currentOrder">
      <div class="list-header">
        <span>待发料单据</span>
        <el-button type="primary" link size="small">刷新</el-button>
      </div>
      <div class="order-item" v-for="order in pendingOrders" :key="order.id" @click="selectOrder(order)">
        <div class="order-icon">📤</div>
        <div class="order-info">
          <div class="order-no">{{ order.orderNo }}</div>
          <div class="order-dept">{{ order.department }} - {{ order.requester }}</div>
        </div>
        <div class="order-meta">
          <el-tag :type="order.urgent ? 'danger' : 'info'" size="small">
            {{ order.urgent ? '加急' : '普通' }}
          </el-tag>
          <div class="order-count">{{ order.itemCount }}种</div>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 发料明细 -->
    <div class="picking-detail" v-else>
      <div class="detail-header">
        <div class="header-info">
          <div class="order-no">{{ currentOrder.orderNo }}</div>
          <div class="order-dept">{{ currentOrder.department }}</div>
        </div>
        <el-button type="primary" link @click="currentOrder = null">返回列表</el-button>
      </div>

      <div class="material-list">
        <div class="material-item" v-for="item in currentOrder.items" :key="item.id"
          :class="{ completed: item.pickedQty >= item.planQty }">
          <div class="material-main">
            <div class="material-name">{{ item.materialName }}</div>
            <div class="material-code">{{ item.materialCode }}</div>
            <div class="material-location">
              <el-icon><Location /></el-icon>
              {{ item.location }}
            </div>
          </div>
          <div class="material-qty">
            <div class="qty-plan">需: {{ item.planQty }}</div>
            <div class="qty-picked">已: {{ item.pickedQty }}</div>
          </div>
          <el-button type="primary" size="small" @click="openPickDialog(item)" 
            :disabled="item.pickedQty >= item.planQty">
            {{ item.pickedQty >= item.planQty ? '✓' : '拣货' }}
          </el-button>
        </div>
      </div>

      <div class="action-footer">
        <el-button size="large" @click="currentOrder = null">取消</el-button>
        <el-button type="primary" size="large" @click="submitPicking">完成发料</el-button>
      </div>
    </div>

    <!-- 拣货弹窗 -->
    <el-dialog v-model="pickDialogVisible" title="拣货确认" width="90%">
      <div class="pick-form" v-if="currentItem">
        <div class="item-card">
          <div class="item-name">{{ currentItem.materialName }}</div>
          <div class="item-code">{{ currentItem.materialCode }}</div>
        </div>

        <div class="location-info">
          <div class="location-label">拣货储位</div>
          <div class="location-value">{{ currentItem.location }}</div>
          <div class="stock-info">可用库存: {{ currentItem.stock }} {{ currentItem.unit }}</div>
        </div>

        <div class="form-item">
          <label>拣货数量</label>
          <el-input-number v-model="pickQty" :min="1" :max="currentItem.planQty - currentItem.pickedQty" size="large" style="width: 100%" />
        </div>

        <div class="form-item">
          <label>扫描确认</label>
          <el-input v-model="confirmCode" placeholder="扫描物料条码确认" size="large" @keyup.enter="verifyCode" />
        </div>
      </div>

      <template #footer>
        <el-button @click="pickDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPick">确认拣货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, More, Aim, Location } from '@element-plus/icons-vue'

const router = useRouter()
const scanCode = ref('')
const currentOrder = ref(null)
const currentItem = ref(null)
const pickDialogVisible = ref(false)
const pickQty = ref(0)
const confirmCode = ref('')

const pendingOrders = ref([
  { id: 1, orderNo: 'LY20250111001', department: '生产一车间', requester: '王工', urgent: true, itemCount: 5, items: [
    { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', planQty: 100, pickedQty: 0, unit: '个', location: 'A1-01-01', stock: 500 },
    { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', planQty: 100, pickedQty: 50, unit: '个', location: 'A1-01-02', stock: 300 },
    { id: 3, materialCode: 'MAT000025', materialName: '轴承6205', planQty: 10, pickedQty: 10, unit: '个', location: 'B2-03-01', stock: 50 }
  ]},
  { id: 2, orderNo: 'LY20250111002', department: '维修班组', requester: '李师傅', urgent: false, itemCount: 3, items: [] },
  { id: 3, orderNo: 'LY20250111003', department: '生产二车间', requester: '张工', urgent: false, itemCount: 8, items: [] }
])

const goBack = () => {
  if (currentOrder.value) {
    currentOrder.value = null
  } else {
    router.back()
  }
}

const handleScan = () => {
  if (scanCode.value) {
    ElMessage.info(`扫描: ${scanCode.value}`)
    scanCode.value = ''
  }
}

const selectOrder = (order) => {
  currentOrder.value = order
}

const openPickDialog = (item) => {
  currentItem.value = item
  pickQty.value = item.planQty - item.pickedQty
  confirmCode.value = ''
  pickDialogVisible.value = true
}

const verifyCode = () => {
  if (confirmCode.value === currentItem.value.materialCode) {
    ElMessage.success('条码验证通过')
  } else {
    ElMessage.error('条码不匹配')
  }
}

const confirmPick = () => {
  currentItem.value.pickedQty += pickQty.value
  pickDialogVisible.value = false
  ElMessage.success('拣货成功')
}

const submitPicking = () => {
  const allPicked = currentOrder.value.items.every(item => item.pickedQty >= item.planQty)
  if (!allPicked) {
    ElMessage.warning('还有物料未完成拣货')
    return
  }
  ElMessage.success('发料单已完成')
  currentOrder.value = null
}
</script>

<style scoped>
.pda-picking {
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
  background: #e6a23c;
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

.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.order-icon { font-size: 24px; }
.order-info { flex: 1; }
.order-no { font-size: 15px; font-weight: 500; color: #303133; }
.order-dept { font-size: 13px; color: #909399; margin-top: 4px; }
.order-meta { text-align: right; }
.order-count { font-size: 12px; color: #909399; margin-top: 6px; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
}

.material-list { padding: 12px; }

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

.material-item.completed { opacity: 0.6; }

.material-main { flex: 1; }
.material-name { font-size: 14px; font-weight: 500; color: #303133; }
.material-code { font-size: 12px; color: #909399; margin-top: 2px; }
.material-location { font-size: 12px; color: #e6a23c; margin-top: 4px; display: flex; align-items: center; gap: 4px; }

.material-qty { text-align: right; }
.qty-plan { font-size: 13px; color: #606266; }
.qty-picked { font-size: 13px; color: #67c23a; font-weight: 600; }

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

.pick-form .item-card {
  background: #fdf6ec;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.pick-form .item-name { font-size: 16px; font-weight: 600; color: #303133; }
.pick-form .item-code { font-size: 13px; color: #909399; margin-top: 4px; }

.location-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  text-align: center;
}

.location-label { font-size: 12px; color: #909399; }
.location-value { font-size: 24px; font-weight: 700; color: #e6a23c; margin: 8px 0; }
.stock-info { font-size: 13px; color: #67c23a; }

.pick-form .form-item { margin-bottom: 16px; }
.pick-form label { display: block; font-size: 13px; color: #606266; margin-bottom: 8px; }
</style>
