<template>
  <div class="pda-receive">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>收货作业</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描或输入送货单号/物料条码" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
        <template #append>
          <el-button @click="openCamera">📷</el-button>
        </template>
      </el-input>
    </div>

    <!-- 待收货列表 -->
    <div class="receive-list" v-if="!currentOrder">
      <div class="list-header">
        <span>待收货单据</span>
        <el-button type="primary" link size="small" @click="refreshList">刷新</el-button>
      </div>
      <div class="order-item" v-for="order in pendingOrders" :key="order.id" @click="selectOrder(order)">
        <div class="order-info">
          <div class="order-no">{{ order.orderNo }}</div>
          <div class="order-supplier">{{ order.supplier }}</div>
        </div>
        <div class="order-meta">
          <div class="order-count">{{ order.itemCount }}种物料</div>
          <div class="order-time">{{ order.arriveTime }}</div>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 收货明细 -->
    <div class="receive-detail" v-else>
      <div class="detail-header">
        <div class="header-info">
          <div class="order-no">{{ currentOrder.orderNo }}</div>
          <div class="order-supplier">{{ currentOrder.supplier }}</div>
        </div>
        <el-button type="primary" link @click="currentOrder = null">返回列表</el-button>
      </div>

      <div class="material-list">
        <div class="material-item" v-for="item in currentOrder.items" :key="item.id" 
          :class="{ completed: item.receivedQty >= item.planQty }">
          <div class="material-info">
            <div class="material-name">{{ item.materialName }}</div>
            <div class="material-code">{{ item.materialCode }}</div>
            <div class="material-spec">{{ item.spec }}</div>
          </div>
          <div class="material-qty">
            <div class="qty-row">
              <span class="qty-label">计划:</span>
              <span class="qty-value">{{ item.planQty }} {{ item.unit }}</span>
            </div>
            <div class="qty-row">
              <span class="qty-label">已收:</span>
              <span class="qty-value received">{{ item.receivedQty }} {{ item.unit }}</span>
            </div>
          </div>
          <el-button type="primary" size="small" @click="openReceiveDialog(item)" :disabled="item.receivedQty >= item.planQty">
            {{ item.receivedQty >= item.planQty ? '已完成' : '收货' }}
          </el-button>
        </div>
      </div>

      <div class="action-footer">
        <el-button size="large" @click="currentOrder = null">取消</el-button>
        <el-button type="primary" size="large" @click="submitReceive">完成收货</el-button>
      </div>
    </div>

    <!-- 收货弹窗 -->
    <el-dialog v-model="receiveDialogVisible" title="收货确认" width="90%" :close-on-click-modal="false">
      <div class="receive-form" v-if="currentItem">
        <div class="form-item">
          <label>物料</label>
          <div class="form-value">{{ currentItem.materialName }}</div>
        </div>
        <div class="form-item">
          <label>计划数量</label>
          <div class="form-value">{{ currentItem.planQty }} {{ currentItem.unit }}</div>
        </div>
        <div class="form-item">
          <label>实收数量</label>
          <el-input-number v-model="receiveQty" :min="0" :max="currentItem.planQty - currentItem.receivedQty" size="large" />
        </div>
        <div class="form-item">
          <label>批次号</label>
          <el-input v-model="batchNo" placeholder="自动生成或手动输入" />
        </div>
        <div class="form-item">
          <label>收货储位</label>
          <el-input v-model="location" placeholder="扫描或输入储位" />
        </div>
      </div>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReceive">确认收货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, More, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const scanCode = ref('')
const currentOrder = ref(null)
const currentItem = ref(null)
const receiveDialogVisible = ref(false)
const receiveQty = ref(0)
const batchNo = ref('')
const location = ref('')

const pendingOrders = ref([
  { id: 1, orderNo: 'SH20250111001', supplier: '华东五金有限公司', itemCount: 5, arriveTime: '10:30', items: [
    { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', spec: 'M10×30', unit: '个', planQty: 500, receivedQty: 0 },
    { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', spec: 'M10', unit: '个', planQty: 500, receivedQty: 200 },
    { id: 3, materialCode: 'MAT000003', materialName: '垫片φ10', spec: 'φ10', unit: '个', planQty: 1000, receivedQty: 1000 }
  ]},
  { id: 2, orderNo: 'SH20250111002', supplier: '南方机电配件厂', itemCount: 3, arriveTime: '11:00', items: [] },
  { id: 3, orderNo: 'SH20250111003', supplier: '北方轴承公司', itemCount: 2, arriveTime: '14:00', items: [] }
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

const openCamera = () => {
  ElMessage.info('打开扫码相机')
}

const refreshList = () => {
  ElMessage.success('刷新成功')
}

const selectOrder = (order) => {
  currentOrder.value = order
}

const openReceiveDialog = (item) => {
  currentItem.value = item
  receiveQty.value = item.planQty - item.receivedQty
  batchNo.value = `BT${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`
  location.value = ''
  receiveDialogVisible.value = true
}

const confirmReceive = () => {
  if (!location.value) {
    ElMessage.warning('请输入收货储位')
    return
  }
  currentItem.value.receivedQty += receiveQty.value
  receiveDialogVisible.value = false
  ElMessage.success('收货成功')
}

const submitReceive = () => {
  ElMessage.success('收货单已完成')
  currentOrder.value = null
}
</script>

<style scoped>
.pda-receive {
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
  background: #409eff;
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

.order-info { flex: 1; }
.order-no { font-size: 15px; font-weight: 500; color: #303133; }
.order-supplier { font-size: 13px; color: #909399; margin-top: 4px; }
.order-meta { text-align: right; }
.order-count { font-size: 13px; color: #409eff; }
.order-time { font-size: 12px; color: #c0c4cc; margin-top: 4px; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
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

.material-item.completed {
  opacity: 0.6;
}

.material-info { flex: 1; }
.material-name { font-size: 14px; font-weight: 500; color: #303133; }
.material-code { font-size: 12px; color: #909399; margin-top: 2px; }
.material-spec { font-size: 12px; color: #c0c4cc; margin-top: 2px; }

.material-qty { text-align: right; }
.qty-row { font-size: 13px; margin-bottom: 4px; }
.qty-label { color: #909399; }
.qty-value { color: #303133; margin-left: 4px; }
.qty-value.received { color: #67c23a; font-weight: 600; }

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

.receive-form .form-item {
  margin-bottom: 16px;
}

.receive-form label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.receive-form .form-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}
</style>
