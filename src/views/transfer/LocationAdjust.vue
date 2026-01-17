<template>
  <div class="location-adjust">
    <h2>储位调整</h2>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>
        储位调整为仓库内部操作，无需ERP审批，调整后直接生效
      </template>
    </el-alert>

    <el-row :gutter="16">
      <!-- 左侧：调整操作 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>储位调整</template>
          
          <el-form :model="adjustForm" label-width="100px" ref="formRef">
            <!-- 扫描物料 -->
            <el-form-item label="物料条码">
              <el-input v-model="adjustForm.materialCode" placeholder="扫描或输入物料条码" size="large"
                @keyup.enter="queryMaterial" ref="materialInput">
                <template #prefix><el-icon><Aim /></el-icon></template>
                <template #append>
                  <el-button @click="queryMaterial">查询</el-button>
                </template>
              </el-input>
            </el-form-item>

            <!-- 物料信息 -->
            <div class="material-info" v-if="materialInfo">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="物料编码">{{ materialInfo.materialCode }}</el-descriptions-item>
                <el-descriptions-item label="物料名称">{{ materialInfo.materialName }}</el-descriptions-item>
                <el-descriptions-item label="规格型号">{{ materialInfo.spec }}</el-descriptions-item>
                <el-descriptions-item label="单位">{{ materialInfo.unit }}</el-descriptions-item>
                <el-descriptions-item label="当前仓库">
                  <el-tag type="info">{{ materialInfo.warehouse }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="当前储位">
                  <el-tag type="warning">{{ materialInfo.location }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="当前库存">
                  <span class="stock-qty">{{ materialInfo.stock }} {{ materialInfo.unit }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="批次号">{{ materialInfo.batchNo }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <el-divider v-if="materialInfo" />

            <!-- 调整设置 -->
            <template v-if="materialInfo">
              <el-form-item label="调整数量">
                <el-input-number v-model="adjustForm.quantity" :min="1" :max="materialInfo.stock" size="large" style="width: 100%" />
                <span class="qty-tip">可调整: {{ materialInfo.stock }} {{ materialInfo.unit }}</span>
              </el-form-item>

              <el-form-item label="目标仓库">
                <el-select v-model="adjustForm.targetWarehouse" size="large" style="width: 100%">
                  <el-option v-for="w in warehouseOptions" :key="w.code" :label="`${w.code}-${w.name}`" :value="w.code" />
                </el-select>
              </el-form-item>

              <el-form-item label="目标储位">
                <el-input v-model="adjustForm.targetLocation" placeholder="扫描或输入目标储位" size="large"
                  @keyup.enter="previewAdjust">
                  <template #prefix><el-icon><Location /></el-icon></template>
                  <template #append>
                    <el-button @click="selectLocation">选择</el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="调整原因">
                <el-select v-model="adjustForm.reason" size="large" style="width: 100%">
                  <el-option label="库存整理" value="organize" />
                  <el-option label="空间优化" value="optimize" />
                  <el-option label="便于拣货" value="picking" />
                  <el-option label="物料归类" value="category" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>

              <el-form-item label="备注">
                <el-input v-model="adjustForm.remark" placeholder="备注信息" />
              </el-form-item>
            </template>

            <!-- 调整预览 -->
            <div class="adjust-preview" v-if="adjustForm.targetLocation && materialInfo">
              <div class="preview-title">调整预览</div>
              <div class="preview-content">
                <div class="preview-from">
                  <div class="loc-label">原储位</div>
                  <div class="loc-warehouse">{{ materialInfo.warehouse }}</div>
                  <div class="loc-position">{{ materialInfo.location }}</div>
                </div>
                <div class="preview-arrow">
                  <el-icon><Right /></el-icon>
                  <div class="qty-label">{{ adjustForm.quantity }} {{ materialInfo.unit }}</div>
                </div>
                <div class="preview-to">
                  <div class="loc-label">目标储位</div>
                  <div class="loc-warehouse">{{ adjustForm.targetWarehouse }}</div>
                  <div class="loc-position">{{ adjustForm.targetLocation }}</div>
                </div>
              </div>
            </div>

            <el-form-item style="margin-top: 20px">
              <el-button type="primary" size="large" style="width: 100%" @click="confirmAdjust"
                :disabled="!canAdjust">确认调整</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：调整记录 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>今日调整记录</span>
              <el-button type="primary" link @click="viewAllRecords">查看全部</el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item v-for="record in recentRecords" :key="record.id"
              :timestamp="record.time" placement="top" :type="record.success ? 'success' : 'danger'">
              <el-card shadow="never" class="timeline-card">
                <div class="record-info">
                  <div class="record-material">{{ record.materialName }}</div>
                  <div class="record-code">{{ record.materialCode }}</div>
                </div>
                <div class="record-path">
                  <span class="from">{{ record.fromWarehouse }}/{{ record.fromLocation }}</span>
                  <span class="arrow">→</span>
                  <span class="to">{{ record.toWarehouse }}/{{ record.toLocation }}</span>
                </div>
                <div class="record-qty">数量: {{ record.quantity }} {{ record.unit }}</div>
                <div class="record-operator">操作人: {{ record.operator }}</div>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-if="!recentRecords.length" description="暂无调整记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Aim, Location, Right } from '@element-plus/icons-vue'

const formRef = ref(null)
const materialInput = ref(null)

const adjustForm = reactive({
  materialCode: '',
  quantity: 1,
  targetWarehouse: 'WH01',
  targetLocation: '',
  reason: 'organize',
  remark: ''
})

const materialInfo = ref(null)

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' },
  { code: 'WH04', name: '备件仓' }
])

const recentRecords = ref([
  { id: 1, time: '10:30', materialCode: 'MAT000001', materialName: '螺栓M10×30', fromWarehouse: 'WH01', fromLocation: 'A1-01-01', toWarehouse: 'WH01', toLocation: 'A2-03-05', quantity: 100, unit: '个', operator: '张三', success: true },
  { id: 2, time: '10:15', materialCode: 'MAT000025', materialName: '轴承6205', fromWarehouse: 'WH01', fromLocation: 'B1-02-03', toWarehouse: 'WH02', toLocation: 'C1-01-01', quantity: 50, unit: '个', operator: '张三', success: true },
  { id: 3, time: '09:45', materialCode: 'MAT000108', materialName: '密封圈DN50', fromWarehouse: 'WH02', fromLocation: 'C2-01-01', toWarehouse: 'WH01', toLocation: 'A1-05-02', quantity: 200, unit: '个', operator: '李四', success: true }
])

const canAdjust = computed(() => {
  return materialInfo.value && adjustForm.targetLocation && adjustForm.quantity > 0
})

const queryMaterial = () => {
  if (!adjustForm.materialCode) {
    ElMessage.warning('请输入物料条码')
    return
  }

  // 模拟查询物料信息
  materialInfo.value = {
    materialCode: adjustForm.materialCode.toUpperCase(),
    materialName: '螺栓M10×30',
    spec: 'M10×30',
    unit: '个',
    warehouse: 'WH01',
    location: 'A1-01-01',
    stock: 150,
    batchNo: 'BT20250108001'
  }

  adjustForm.quantity = materialInfo.value.stock
  adjustForm.targetWarehouse = materialInfo.value.warehouse

  ElMessage.success('物料查询成功')
}

const selectLocation = () => {
  ElMessage.info('打开储位选择弹窗')
}

const previewAdjust = () => {
  if (!adjustForm.targetLocation) {
    ElMessage.warning('请输入目标储位')
  }
}

const confirmAdjust = () => {
  if (!canAdjust.value) return

  ElMessageBox.confirm(
    `确认将 ${materialInfo.value.materialName} 从 ${materialInfo.value.location} 调整至 ${adjustForm.targetLocation}？`,
    '确认调整',
    { type: 'warning' }
  ).then(() => {
    // 添加到记录
    recentRecords.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString().slice(0, 5),
      materialCode: materialInfo.value.materialCode,
      materialName: materialInfo.value.materialName,
      fromWarehouse: materialInfo.value.warehouse,
      fromLocation: materialInfo.value.location,
      toWarehouse: adjustForm.targetWarehouse,
      toLocation: adjustForm.targetLocation,
      quantity: adjustForm.quantity,
      unit: materialInfo.value.unit,
      operator: '当前用户',
      success: true
    })

    ElMessage.success('储位调整成功')

    // 重置表单
    adjustForm.materialCode = ''
    adjustForm.targetLocation = ''
    adjustForm.quantity = 1
    adjustForm.remark = ''
    materialInfo.value = null

    // 聚焦输入框
    materialInput.value?.focus()
  }).catch(() => {})
}

const viewAllRecords = () => {
  ElMessage.info('查看全部调整记录')
}
</script>

<style scoped>
.location-adjust { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.material-info { margin: 16px 0; }
.stock-qty { color: #409eff; font-weight: 600; font-size: 16px; }
.qty-tip { margin-left: 12px; font-size: 12px; color: #909399; }

/* 预览样式 */
.adjust-preview {
  background: #ecf5ff;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 12px;
  text-align: center;
}

.preview-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-from, .preview-to {
  text-align: center;
  flex: 1;
}

.loc-label { font-size: 12px; color: #909399; }
.loc-warehouse { font-size: 14px; color: #606266; margin: 4px 0; }
.loc-position { font-size: 18px; font-weight: 600; }
.preview-from .loc-position { color: #909399; }
.preview-to .loc-position { color: #67c23a; }

.preview-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #409eff;
  font-size: 24px;
  padding: 0 16px;
}

.qty-label { font-size: 12px; color: #409eff; margin-top: 4px; }

/* 时间线记录 */
.timeline-card {
  padding: 12px;
  margin-bottom: 0;
}

.timeline-card :deep(.el-card__body) {
  padding: 0;
}

.record-info { margin-bottom: 8px; }
.record-material { font-size: 14px; font-weight: 500; color: #303133; }
.record-code { font-size: 12px; color: #909399; }

.record-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 6px;
}

.record-path .from { color: #909399; }
.record-path .arrow { color: #409eff; }
.record-path .to { color: #67c23a; font-weight: 500; }

.record-qty { font-size: 13px; color: #606266; }
.record-operator { font-size: 12px; color: #c0c4cc; margin-top: 4px; }
</style>
