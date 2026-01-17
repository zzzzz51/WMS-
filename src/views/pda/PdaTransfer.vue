<template>
  <div class="pda-transfer">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>移库作业</h2>
      <el-icon><More /></el-icon>
    </div>

    <!-- 步骤指示 -->
    <div class="step-indicator">
      <div class="step" :class="{ active: step === 1, done: step > 1 }">
        <div class="step-num">1</div>
        <div class="step-label">扫描物料</div>
      </div>
      <div class="step-line" :class="{ active: step > 1 }"></div>
      <div class="step" :class="{ active: step === 2 }">
        <div class="step-num">2</div>
        <div class="step-label">设置目标</div>
      </div>
    </div>

    <!-- 步骤1: 扫描物料 -->
    <div class="step-content" v-if="step === 1">
      <div class="scan-area">
        <el-input v-model="materialCode" placeholder="扫描或输入物料条码" size="large" @keyup.enter="queryMaterial" ref="materialInput">
          <template #prefix><el-icon><Aim /></el-icon></template>
          <template #append>
            <el-button @click="queryMaterial">查询</el-button>
          </template>
        </el-input>
      </div>

      <div class="material-info" v-if="materialInfo">
        <div class="info-card">
          <div class="info-header">
            <div class="material-name">{{ materialInfo.materialName }}</div>
            <el-tag type="success" size="small">有库存</el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">物料编码</span>
            <span class="info-value">{{ materialInfo.materialCode }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">规格型号</span>
            <span class="info-value">{{ materialInfo.spec }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">批次号</span>
            <span class="info-value">{{ materialInfo.batchNo }}</span>
          </div>
          <div class="location-box">
            <div class="loc-item">
              <div class="loc-label">当前仓库</div>
              <div class="loc-value">{{ materialInfo.warehouse }}</div>
            </div>
            <div class="loc-item">
              <div class="loc-label">当前储位</div>
              <div class="loc-value highlight">{{ materialInfo.location }}</div>
            </div>
            <div class="loc-item">
              <div class="loc-label">库存数量</div>
              <div class="loc-value">{{ materialInfo.stock }} {{ materialInfo.unit }}</div>
            </div>
          </div>
        </div>

        <el-button type="primary" size="large" style="width: 100%; margin-top: 16px" @click="nextStep">
          下一步：设置目标储位
        </el-button>
      </div>

      <el-empty v-else description="请扫描物料条码" />
    </div>

    <!-- 步骤2: 设置目标 -->
    <div class="step-content" v-if="step === 2">
      <div class="transfer-preview">
        <div class="preview-from">
          <div class="preview-label">原储位</div>
          <div class="preview-warehouse">{{ materialInfo.warehouse }}</div>
          <div class="preview-location">{{ materialInfo.location }}</div>
        </div>
        <div class="preview-arrow">
          <el-icon><Right /></el-icon>
          <div class="preview-qty">{{ transferQty }} {{ materialInfo.unit }}</div>
        </div>
        <div class="preview-to">
          <div class="preview-label">目标储位</div>
          <div class="preview-warehouse">{{ targetWarehouse || '-' }}</div>
          <div class="preview-location" :class="{ empty: !targetLocation }">{{ targetLocation || '待设置' }}</div>
        </div>
      </div>

      <div class="target-form">
        <div class="form-item">
          <label>移库数量</label>
          <el-input-number v-model="transferQty" :min="1" :max="materialInfo.stock" size="large" style="width: 100%" />
          <div class="form-tip">可移: {{ materialInfo.stock }} {{ materialInfo.unit }}</div>
        </div>

        <div class="form-item">
          <label>目标仓库</label>
          <el-select v-model="targetWarehouse" size="large" style="width: 100%">
            <el-option label="WH01-主仓库" value="WH01" />
            <el-option label="WH02-原料仓" value="WH02" />
            <el-option label="WH03-成品仓" value="WH03" />
            <el-option label="WH04-备件仓" value="WH04" />
          </el-select>
        </div>

        <div class="form-item">
          <label>目标储位</label>
          <el-input v-model="targetLocation" placeholder="扫描或输入目标储位" size="large" @keyup.enter="submitTransfer">
            <template #prefix><el-icon><Location /></el-icon></template>
          </el-input>
        </div>

        <div class="form-item">
          <label>移库原因</label>
          <el-select v-model="transferReason" size="large" style="width: 100%">
            <el-option label="库存整理" value="organize" />
            <el-option label="空间优化" value="optimize" />
            <el-option label="便于拣货" value="picking" />
            <el-option label="物料归类" value="category" />
          </el-select>
        </div>
      </div>

      <div class="action-footer">
        <el-button size="large" @click="prevStep">上一步</el-button>
        <el-button type="primary" size="large" @click="submitTransfer" :disabled="!canSubmit">确认移库</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, More, Aim, Right, Location } from '@element-plus/icons-vue'

const router = useRouter()
const step = ref(1)
const materialCode = ref('')
const materialInput = ref(null)
const materialInfo = ref(null)
const transferQty = ref(0)
const targetWarehouse = ref('WH01')
const targetLocation = ref('')
const transferReason = ref('organize')

const canSubmit = computed(() => {
  return targetWarehouse.value && targetLocation.value && transferQty.value > 0
})

const goBack = () => {
  if (step.value > 1) {
    prevStep()
  } else {
    router.back()
  }
}

const queryMaterial = () => {
  if (!materialCode.value) {
    ElMessage.warning('请输入物料条码')
    return
  }

  // 模拟查询
  materialInfo.value = {
    materialCode: materialCode.value.toUpperCase(),
    materialName: '螺栓M10×30',
    spec: 'M10×30',
    unit: '个',
    warehouse: 'WH01',
    location: 'A1-01-01',
    stock: 150,
    batchNo: 'BT20250108001'
  }
  transferQty.value = materialInfo.value.stock
  targetWarehouse.value = materialInfo.value.warehouse

  ElMessage.success('物料查询成功')
}

const nextStep = () => {
  if (!materialInfo.value) {
    ElMessage.warning('请先扫描物料')
    return
  }
  step.value = 2
}

const prevStep = () => {
  step.value = 1
}

const submitTransfer = () => {
  if (!canSubmit.value) {
    ElMessage.warning('请完善移库信息')
    return
  }

  ElMessage.success(`移库成功：${materialInfo.value.location} → ${targetLocation.value}`)
  
  // 重置
  step.value = 1
  materialCode.value = ''
  materialInfo.value = null
  targetLocation.value = ''
  
  // 聚焦输入框
  setTimeout(() => {
    materialInput.value?.focus()
  }, 100)
}
</script>

<style scoped>
.pda-transfer {
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
  background: #909399;
  color: #fff;
}

.pda-header h2 { margin: 0; font-size: 18px; }

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #fff;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #dcdfe6;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-num,
.step.done .step-num {
  background: #409eff;
  color: #fff;
}

.step-label {
  font-size: 12px;
  color: #909399;
}

.step.active .step-label {
  color: #409eff;
  font-weight: 500;
}

.step-line {
  width: 60px;
  height: 2px;
  background: #dcdfe6;
  margin: 0 12px 20px;
  transition: background 0.3s;
}

.step-line.active {
  background: #409eff;
}

.step-content { padding: 16px; }

.scan-area { margin-bottom: 16px; }

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.material-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.info-label { color: #909399; font-size: 13px; }
.info-value { color: #303133; font-size: 13px; }

.location-box {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.loc-item {
  flex: 1;
  text-align: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 8px;
}

.loc-label { font-size: 11px; color: #909399; }
.loc-value { font-size: 16px; font-weight: 600; color: #303133; margin-top: 4px; }
.loc-value.highlight { color: #409eff; }

.transfer-preview {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.preview-from, .preview-to {
  flex: 1;
  text-align: center;
}

.preview-label { font-size: 12px; color: #909399; }
.preview-warehouse { font-size: 14px; color: #606266; margin: 4px 0; }
.preview-location { font-size: 20px; font-weight: 700; }
.preview-from .preview-location { color: #909399; }
.preview-to .preview-location { color: #67c23a; }
.preview-to .preview-location.empty { color: #dcdfe6; }

.preview-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  color: #409eff;
  font-size: 24px;
}

.preview-qty { font-size: 12px; margin-top: 4px; }

.target-form {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.target-form .form-item { margin-bottom: 16px; }
.target-form label { display: block; font-size: 13px; color: #606266; margin-bottom: 8px; }
.form-tip { font-size: 12px; color: #67c23a; margin-top: 8px; }

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
</style>
