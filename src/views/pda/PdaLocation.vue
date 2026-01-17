<template>
  <div class="pda-location">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>储位调整</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="scan-area">
      <el-input v-model="scanCode" placeholder="扫描储位条码" size="large" @keyup.enter="handleScan">
        <template #prefix><el-icon><Aim /></el-icon></template>
      </el-input>
    </div>

    <!-- 储位信息 -->
    <div class="location-info" v-if="locationInfo">
      <div class="info-card">
        <div class="info-header">
          <div class="location-code">{{ locationInfo.locationCode }}</div>
          <el-tag :type="locationInfo.status === 'active' ? 'success' : 'info'" size="small">
            {{ locationInfo.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">所属仓库</span>
          <span class="info-value">{{ locationInfo.warehouse }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">储位类型</span>
          <span class="info-value">{{ locationInfo.locationType }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">容量利用</span>
          <span class="info-value">{{ locationInfo.usage }}%</span>
        </div>
        <div class="info-row">
          <span class="info-label">存放物料</span>
          <span class="info-value">{{ locationInfo.materialCount }}种</span>
        </div>
      </div>

      <!-- 储位内物料列表 -->
      <div class="material-section">
        <div class="section-title">储位内物料</div>
        <div class="material-item" v-for="item in locationInfo.materials" :key="item.id">
          <div class="material-info">
            <div class="material-name">{{ item.materialName }}</div>
            <div class="material-code">{{ item.materialCode }}</div>
            <div class="material-batch">批次: {{ item.batchNo }}</div>
          </div>
          <div class="material-qty">
            <div class="qty-value">{{ item.quantity }}</div>
            <div class="qty-unit">{{ item.unit }}</div>
          </div>
          <el-button type="primary" size="small" @click="openAdjustDialog(item)">调整</el-button>
        </div>
        <el-empty v-if="locationInfo.materials.length === 0" description="储位为空" :image-size="60" />
      </div>

      <!-- 储位操作 -->
      <div class="location-actions">
        <el-button type="primary" size="large" @click="openAddDialog">添加物料</el-button>
        <el-button type="warning" size="large" @click="toggleStatus">
          {{ locationInfo.status === 'active' ? '停用储位' : '启用储位' }}
        </el-button>
      </div>
    </div>

    <el-empty v-else description="请扫描储位条码" />

    <!-- 调整弹窗 -->
    <el-dialog v-model="adjustDialogVisible" title="调整物料" width="90%">
      <div class="adjust-form" v-if="currentMaterial">
        <div class="item-card">
          <div class="item-name">{{ currentMaterial.materialName }}</div>
          <div class="item-code">{{ currentMaterial.materialCode }}</div>
          <div class="item-batch">批次: {{ currentMaterial.batchNo }}</div>
        </div>

        <div class="form-item">
          <label>当前数量</label>
          <div class="form-value">{{ currentMaterial.quantity }} {{ currentMaterial.unit }}</div>
        </div>

        <div class="form-item">
          <label>调整类型</label>
          <el-radio-group v-model="adjustType">
            <el-radio label="move">移至其他储位</el-radio>
            <el-radio label="modify">修改数量</el-radio>
          </el-radio-group>
        </div>

        <div class="form-item" v-if="adjustType === 'move'">
          <label>目标储位</label>
          <el-input v-model="targetLocation" placeholder="扫描或输入目标储位" size="large" />
        </div>

        <div class="form-item" v-if="adjustType === 'move'">
          <label>移动数量</label>
          <el-input-number v-model="moveQty" :min="1" :max="currentMaterial.quantity" size="large" style="width: 100%" />
        </div>

        <div class="form-item" v-if="adjustType === 'modify'">
          <label>调整后数量</label>
          <el-input-number v-model="newQty" :min="0" size="large" style="width: 100%" />
        </div>

        <div class="form-item">
          <label>调整原因</label>
          <el-select v-model="adjustReason" size="large" style="width: 100%">
            <el-option label="库存整理" value="organize" />
            <el-option label="盘点调整" value="count" />
            <el-option label="系统纠错" value="correction" />
            <el-option label="其他" value="other" />
          </el-select>
        </div>

        <div class="form-item">
          <label>备注</label>
          <el-input v-model="adjustRemark" type="textarea" :rows="2" placeholder="调整说明" />
        </div>
      </div>

      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <!-- 添加物料弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加物料到储位" width="90%">
      <div class="add-form">
        <div class="current-location">
          <span>目标储位:</span>
          <span class="location-value">{{ locationInfo?.locationCode }}</span>
        </div>

        <div class="form-item">
          <label>物料条码</label>
          <el-input v-model="addMaterialCode" placeholder="扫描或输入物料条码" size="large" @keyup.enter="queryMaterial" />
        </div>

        <div class="material-preview" v-if="addMaterialInfo">
          <div class="preview-name">{{ addMaterialInfo.materialName }}</div>
          <div class="preview-spec">{{ addMaterialInfo.spec }}</div>
        </div>

        <div class="form-item">
          <label>批次号</label>
          <el-input v-model="addBatchNo" placeholder="输入批次号" size="large" />
        </div>

        <div class="form-item">
          <label>数量</label>
          <el-input-number v-model="addQty" :min="1" size="large" style="width: 100%" />
        </div>
      </div>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, More, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const scanCode = ref('')
const locationInfo = ref(null)

// 调整相关
const adjustDialogVisible = ref(false)
const currentMaterial = ref(null)
const adjustType = ref('move')
const targetLocation = ref('')
const moveQty = ref(0)
const newQty = ref(0)
const adjustReason = ref('organize')
const adjustRemark = ref('')

// 添加相关
const addDialogVisible = ref(false)
const addMaterialCode = ref('')
const addMaterialInfo = ref(null)
const addBatchNo = ref('')
const addQty = ref(1)

const goBack = () => {
  router.back()
}

const handleScan = () => {
  if (!scanCode.value) return

  // 模拟查询储位信息
  locationInfo.value = {
    locationCode: scanCode.value.toUpperCase(),
    warehouse: 'WH01-主仓库',
    locationType: '货架储位',
    status: 'active',
    usage: 65,
    materialCount: 3,
    materials: [
      { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', batchNo: 'BT20250108001', unit: '个', quantity: 500 },
      { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', batchNo: 'BT20250109001', unit: '个', quantity: 300 },
      { id: 3, materialCode: 'MAT000003', materialName: '垫片φ10', batchNo: 'BT20250110001', unit: '个', quantity: 200 }
    ]
  }

  ElMessage.success('储位查询成功')
  scanCode.value = ''
}

const openAdjustDialog = (item) => {
  currentMaterial.value = item
  adjustType.value = 'move'
  targetLocation.value = ''
  moveQty.value = item.quantity
  newQty.value = item.quantity
  adjustReason.value = 'organize'
  adjustRemark.value = ''
  adjustDialogVisible.value = true
}

const confirmAdjust = () => {
  if (adjustType.value === 'move') {
    if (!targetLocation.value) {
      ElMessage.warning('请输入目标储位')
      return
    }
    ElMessage.success(`已将 ${moveQty.value} ${currentMaterial.value.unit} 移至 ${targetLocation.value}`)
  } else {
    const diff = newQty.value - currentMaterial.value.quantity
    currentMaterial.value.quantity = newQty.value
    ElMessage.success(`数量已调整: ${diff > 0 ? '+' : ''}${diff}`)
  }
  adjustDialogVisible.value = false
}

const openAddDialog = () => {
  addMaterialCode.value = ''
  addMaterialInfo.value = null
  addBatchNo.value = `BT${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`
  addQty.value = 1
  addDialogVisible.value = true
}

const queryMaterial = () => {
  if (!addMaterialCode.value) return
  addMaterialInfo.value = {
    materialCode: addMaterialCode.value,
    materialName: '新物料',
    spec: '规格型号'
  }
}

const confirmAdd = () => {
  if (!addMaterialCode.value) {
    ElMessage.warning('请输入物料条码')
    return
  }
  
  locationInfo.value.materials.push({
    id: Date.now(),
    materialCode: addMaterialCode.value,
    materialName: addMaterialInfo.value?.materialName || '新物料',
    batchNo: addBatchNo.value,
    unit: '个',
    quantity: addQty.value
  })
  locationInfo.value.materialCount++
  
  addDialogVisible.value = false
  ElMessage.success('物料已添加到储位')
}

const toggleStatus = () => {
  const newStatus = locationInfo.value.status === 'active' ? '停用' : '启用'
  ElMessageBox.confirm(`确定要${newStatus}储位 ${locationInfo.value.locationCode} 吗?`, '确认操作', {
    type: 'warning'
  }).then(() => {
    locationInfo.value.status = locationInfo.value.status === 'active' ? 'inactive' : 'active'
    ElMessage.success(`储位已${newStatus}`)
  }).catch(() => {})
}
</script>

<style scoped>
.pda-location {
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
  background: #673ab7;
  color: #fff;
}

.pda-header h2 { margin: 0; font-size: 18px; }

.scan-area { padding: 16px; background: #fff; }

.location-info { padding: 16px; }

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.location-code {
  font-size: 22px;
  font-weight: 700;
  color: #673ab7;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label { font-size: 13px; color: #909399; }
.info-value { font-size: 13px; color: #303133; }

.material-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.material-item:last-child { margin-bottom: 0; }

.material-info { flex: 1; }
.material-name { font-size: 14px; font-weight: 500; color: #303133; }
.material-code { font-size: 12px; color: #909399; margin-top: 2px; }
.material-batch { font-size: 12px; color: #673ab7; margin-top: 2px; }

.material-qty { text-align: right; }
.qty-value { font-size: 18px; font-weight: 700; color: #303133; }
.qty-unit { font-size: 12px; color: #909399; }

.location-actions {
  display: flex;
  gap: 12px;
}

.location-actions .el-button { flex: 1; }

/* 弹窗样式 */
.item-card, .current-location {
  background: #f3e5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.item-name, .preview-name { font-size: 16px; font-weight: 600; color: #303133; }
.item-code { font-size: 13px; color: #909399; margin-top: 4px; }
.item-batch { font-size: 13px; color: #673ab7; margin-top: 4px; }

.current-location {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.location-value { font-size: 18px; font-weight: 700; color: #673ab7; }

.material-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.preview-spec { font-size: 13px; color: #909399; margin-top: 4px; }

.adjust-form .form-item,
.add-form .form-item { margin-bottom: 16px; }

.adjust-form label,
.add-form label { display: block; font-size: 13px; color: #606266; margin-bottom: 8px; }

.form-value { font-size: 16px; font-weight: 600; color: #303133; }
</style>
