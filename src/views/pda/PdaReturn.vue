<template>
  <div class="pda-return">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>退料接收</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描退料单号或物料条码" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
      </el-input>
    </div>

    <!-- 待接收退料单 -->
    <div class="return-list" v-if="!currentReturn">
      <div class="list-header">
        <span>待接收退料</span>
        <el-button type="primary" link size="small">刷新</el-button>
      </div>
      <div class="return-item" v-for="item in pendingReturns" :key="item.id" @click="selectReturn(item)">
        <div class="return-icon">↩️</div>
        <div class="return-info">
          <div class="return-no">{{ item.returnNo }}</div>
          <div class="return-dept">{{ item.department }} - {{ item.returner }}</div>
          <div class="return-reason">退料原因: {{ item.reason }}</div>
        </div>
        <div class="return-meta">
          <div class="return-count">{{ item.itemCount }}种</div>
          <div class="return-time">{{ item.createTime }}</div>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>

      <el-empty v-if="pendingReturns.length === 0" description="暂无待接收退料" />
    </div>

    <!-- 退料明细 -->
    <div class="return-detail" v-else>
      <div class="detail-header">
        <div class="header-info">
          <div class="return-no">{{ currentReturn.returnNo }}</div>
          <div class="return-dept">{{ currentReturn.department }}</div>
        </div>
        <el-button type="primary" link @click="currentReturn = null">返回列表</el-button>
      </div>

      <div class="material-list">
        <div class="material-item" v-for="item in currentReturn.items" :key="item.id"
          :class="{ received: item.receivedQty > 0 }">
          <div class="material-info">
            <div class="material-name">{{ item.materialName }}</div>
            <div class="material-code">{{ item.materialCode }}</div>
            <div class="material-batch">批次: {{ item.batchNo }}</div>
          </div>
          <div class="material-qty">
            <div class="qty-return">退: {{ item.returnQty }} {{ item.unit }}</div>
            <div class="qty-received">收: {{ item.receivedQty }} {{ item.unit }}</div>
          </div>
          <el-button type="primary" size="small" @click="openReceiveDialog(item)"
            :disabled="item.receivedQty >= item.returnQty">
            {{ item.receivedQty >= item.returnQty ? '✓' : '接收' }}
          </el-button>
        </div>
      </div>

      <div class="action-footer">
        <el-button size="large" @click="currentReturn = null">取消</el-button>
        <el-button type="primary" size="large" @click="submitReturn">完成接收</el-button>
      </div>
    </div>

    <!-- 接收弹窗 -->
    <el-dialog v-model="receiveDialogVisible" title="退料接收" width="90%">
      <div class="receive-form" v-if="currentItem">
        <div class="item-card">
          <div class="item-name">{{ currentItem.materialName }}</div>
          <div class="item-code">{{ currentItem.materialCode }}</div>
          <div class="item-batch">批次: {{ currentItem.batchNo }}</div>
        </div>

        <div class="form-item">
          <label>退回数量</label>
          <div class="form-value">{{ currentItem.returnQty }} {{ currentItem.unit }}</div>
        </div>

        <div class="form-item">
          <label>实收数量</label>
          <el-input-number v-model="receiveQty" :min="0" :max="currentItem.returnQty" size="large" style="width: 100%" />
        </div>

        <div class="form-item">
          <label>质量状态</label>
          <el-radio-group v-model="qualityStatus">
            <el-radio label="good">良品</el-radio>
            <el-radio label="bad">不良品</el-radio>
          </el-radio-group>
        </div>

        <div class="form-item">
          <label>入库储位</label>
          <el-input v-model="targetLocation" placeholder="扫描或输入储位" size="large" />
        </div>

        <div class="form-item">
          <label>备注</label>
          <el-input v-model="remark" type="textarea" :rows="2" placeholder="接收备注" />
        </div>
      </div>

      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReceive">确认接收</el-button>
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
const currentReturn = ref(null)
const currentItem = ref(null)
const receiveDialogVisible = ref(false)
const receiveQty = ref(0)
const qualityStatus = ref('good')
const targetLocation = ref('')
const remark = ref('')

const pendingReturns = ref([
  { id: 1, returnNo: 'TL20250111001', department: '生产一车间', returner: '王工', reason: '多领', createTime: '10:30', itemCount: 3, items: [
    { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', batchNo: 'BT20250108001', unit: '个', returnQty: 50, receivedQty: 0 },
    { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', batchNo: 'BT20250108002', unit: '个', returnQty: 50, receivedQty: 30 }
  ]},
  { id: 2, returnNo: 'TL20250111002', department: '维修班组', returner: '李师傅', reason: '规格不符', createTime: '11:00', itemCount: 1, items: [] }
])

const goBack = () => {
  if (currentReturn.value) {
    currentReturn.value = null
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

const selectReturn = (item) => {
  currentReturn.value = item
}

const openReceiveDialog = (item) => {
  currentItem.value = item
  receiveQty.value = item.returnQty - item.receivedQty
  qualityStatus.value = 'good'
  targetLocation.value = ''
  remark.value = ''
  receiveDialogVisible.value = true
}

const confirmReceive = () => {
  if (!targetLocation.value) {
    ElMessage.warning('请输入入库储位')
    return
  }
  currentItem.value.receivedQty += receiveQty.value
  receiveDialogVisible.value = false
  ElMessage.success('接收成功')
}

const submitReturn = () => {
  ElMessage.success('退料接收完成')
  currentReturn.value = null
}
</script>

<style scoped>
.pda-return {
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
  background: #f56c6c;
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

.return-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.return-icon { font-size: 24px; }
.return-info { flex: 1; }
.return-no { font-size: 15px; font-weight: 500; color: #303133; }
.return-dept { font-size: 13px; color: #909399; margin-top: 4px; }
.return-reason { font-size: 12px; color: #f56c6c; margin-top: 4px; }
.return-meta { text-align: right; }
.return-count { font-size: 13px; color: #f56c6c; }
.return-time { font-size: 12px; color: #c0c4cc; margin-top: 4px; }

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

.material-item.received { background: #f0f9eb; }

.material-info { flex: 1; }
.material-name { font-size: 14px; font-weight: 500; color: #303133; }
.material-code { font-size: 12px; color: #909399; margin-top: 2px; }
.material-batch { font-size: 12px; color: #409eff; margin-top: 2px; }

.material-qty { text-align: right; }
.qty-return { font-size: 13px; color: #f56c6c; }
.qty-received { font-size: 13px; color: #67c23a; font-weight: 600; }

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

.receive-form .item-card {
  background: #fef0f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.receive-form .item-name { font-size: 16px; font-weight: 600; color: #303133; }
.receive-form .item-code { font-size: 13px; color: #909399; margin-top: 4px; }
.receive-form .item-batch { font-size: 13px; color: #409eff; margin-top: 4px; }

.receive-form .form-item { margin-bottom: 16px; }
.receive-form label { display: block; font-size: 13px; color: #606266; margin-bottom: 8px; }
.receive-form .form-value { font-size: 16px; font-weight: 600; color: #303133; }
</style>
