<template>
  <div class="misc-inbound">
    <h2>杂项入库单</h2>
    <el-alert type="success" :closable="false" style="margin-bottom: 16px">
      <template #title>
        杂项入库单由WMS创建，提交ERP审批通过后可执行入库作业
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="入库单号">
          <el-input v-model="searchForm.orderNo" placeholder="入库单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="入库类型">
          <el-select v-model="searchForm.inboundType" placeholder="全部" clearable style="width: 120px">
            <el-option label="赠送入库" value="gift" />
            <el-option label="调拨入库" value="transfer" />
            <el-option label="盘盈入库" value="gain" />
            <el-option label="维修返还" value="repair" />
            <el-option label="样品入库" value="sample" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审批" value="pending" />
            <el-option label="审批中" value="approving" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="执行中" value="executing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 220px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon> 新建入库单
      </el-button>
      <el-button type="success" @click="handleBatchSubmit" :disabled="!canBatchSubmit">
        <el-icon><Promotion /></el-icon> 批量提交审批
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" :selectable="row => row.status === 'draft'" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="入库单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="inboundType" label="入库类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeMap[row.inboundType]?.type" size="small">{{ typeMap[row.inboundType]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCount" label="物料种类" width="90" align="center" />
        <el-table-column prop="totalQty" label="总数量" width="100" align="right" />
        <el-table-column prop="warehouse" label="目标仓库" width="90" />
        <el-table-column prop="source" label="来源说明" min-width="140" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="erpOrderNo" label="ERP单号" width="140">
          <template #default="{ row }">
            <span v-if="row.erpOrderNo">{{ row.erpOrderNo }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'draft'" type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleSubmit(row)">提交审批</el-button>
            <el-button v-if="row.status === 'approved'" type="primary" link size="small" @click="handleExecute(row)">去执行</el-button>
            <el-button v-if="row.status === 'rejected'" type="warning" link size="small" @click="handleResubmit(row)">重新提交</el-button>
            <el-button v-if="row.status === 'draft'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20, 50, 100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1000px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="入库类型" prop="inboundType">
              <el-select v-model="form.inboundType" style="width: 100%">
                <el-option label="赠送入库" value="gift" />
                <el-option label="调拨入库" value="transfer" />
                <el-option label="盘盈入库" value="gain" />
                <el-option label="维修返还" value="repair" />
                <el-option label="样品入库" value="sample" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标仓库" prop="warehouse">
              <el-select v-model="form.warehouse" style="width: 100%">
                <el-option v-for="w in warehouseOptions" :key="w.code" :label="`${w.code}-${w.name}`" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划入库日">
              <el-date-picker v-model="form.planDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="来源说明" prop="source">
              <el-input v-model="form.source" placeholder="如：XX公司赠送、XX项目调拨、年终盘点盘盈等" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">物料明细</el-divider>
        
        <div class="material-toolbar">
          <el-button type="primary" size="small" @click="addMaterial">
            <el-icon><Plus /></el-icon> 添加物料
          </el-button>
          <el-button size="small" @click="scanMaterial">
            <el-icon><Aim /></el-icon> 扫码添加
          </el-button>
        </div>

        <el-table :data="form.materials" border size="small" class="material-table">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column label="物料编码" width="140">
            <template #default="{ row }">
              <el-input v-model="row.materialCode" size="small" placeholder="物料编码" @blur="fetchMaterial(row)" />
            </template>
          </el-table-column>
          <el-table-column label="物料名称" width="140">
            <template #default="{ row }">
              <el-input v-model="row.materialName" size="small" placeholder="物料名称" disabled />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" width="100">
            <template #default="{ row }">
              <el-input v-model="row.spec" size="small" disabled />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" size="small" :min="1" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="70">
            <template #default="{ row }">
              <el-input v-model="row.unit" size="small" disabled />
            </template>
          </el-table-column>
          <el-table-column label="储位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.location" size="small" placeholder="储位" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" width="140">
            <template #default="{ row }">
              <el-input v-model="row.batchNo" size="small" placeholder="自动生成" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.remark" size="small" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeMaterial($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-row :gutter="20" style="margin-top: 16px">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="单据备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave(false)">保存草稿</el-button>
        <el-button type="success" @click="handleSave(true)">保存并提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="`入库单详情 - ${currentRow?.orderNo}`" width="900px">
      <el-descriptions :column="3" border v-if="currentRow">
        <el-descriptions-item label="入库单号">{{ currentRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="入库类型">
          <el-tag :type="typeMap[currentRow.inboundType]?.type" size="small">{{ typeMap[currentRow.inboundType]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标仓库">{{ currentRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="来源说明">{{ currentRow.source }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRow.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[currentRow.status]?.type">{{ statusMap[currentRow.status]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="ERP单号">{{ currentRow.erpOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审批意见">{{ currentRow.approveRemark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 审批流程 -->
      <div style="margin-top: 20px" v-if="currentRow?.status !== 'draft'">
        <h4>审批流程</h4>
        <el-steps :active="getApproveStep(currentRow.status)" align-center>
          <el-step title="提交申请" :description="currentRow.submitTime" />
          <el-step title="部门审批" description="审批中" />
          <el-step title="仓库确认" description="" />
          <el-step title="完成" description="" />
        </el-steps>
      </div>

      <div style="margin-top: 20px">
        <h4>物料明细</h4>
        <el-table :data="currentRow?.materials" border size="small">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column prop="materialName" label="物料名称" min-width="140" />
          <el-table-column prop="spec" label="规格型号" width="100" />
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="location" label="储位" width="100" />
          <el-table-column prop="batchNo" label="批次号" width="140" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Promotion, Delete, Aim } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const dialogTitle = ref('新建杂项入库单')
const currentRow = ref(null)
const selectedRows = ref([])
const formRef = ref(null)

const searchForm = reactive({
  orderNo: '', inboundType: '', status: '', dateRange: []
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  inboundType: 'other',
  warehouse: 'WH01',
  planDate: '',
  source: '',
  materials: [],
  remark: ''
})

const rules = {
  inboundType: [{ required: true, message: '请选择入库类型', trigger: 'change' }],
  warehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源说明', trigger: 'blur' }]
}

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' },
  { code: 'WH04', name: '备件仓' }
])

const typeMap = {
  gift: { label: '赠送入库', type: 'success' },
  transfer: { label: '调拨入库', type: 'primary' },
  gain: { label: '盘盈入库', type: 'warning' },
  repair: { label: '维修返还', type: 'info' },
  sample: { label: '样品入库', type: '' },
  other: { label: '其他', type: 'info' }
}

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待审批', type: 'warning' },
  approving: { label: '审批中', type: '' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  executing: { label: '执行中', type: 'primary' },
  completed: { label: '已完成', type: 'success' }
}

const tableData = ref([])

const canBatchSubmit = computed(() => selectedRows.value.length > 0)

const generateOrderNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `ZX${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const generateBatchNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `BT${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const getApproveStep = (status) => {
  const steps = { pending: 1, approving: 1, approved: 3, rejected: 1, executing: 3, completed: 4 }
  return steps[status] || 0
}

const generateData = () => {
  const types = ['gift', 'transfer', 'gain', 'repair', 'sample', 'other']
  const statuses = ['draft', 'pending', 'approving', 'approved', 'rejected', 'executing', 'completed']
  
  tableData.value = Array(25).fill(null).map((_, i) => ({
    id: i + 1,
    orderNo: `ZX2025011${String(i + 1).padStart(4, '0')}`,
    inboundType: types[i % 6],
    materialCount: Math.floor(Math.random() * 5) + 1,
    totalQty: Math.floor(Math.random() * 200) + 50,
    warehouse: ['WH01', 'WH02', 'WH03'][i % 3],
    source: ['XX公司赠送', '北京分公司调拨', '年终盘点盘盈', '维修完成返还', '供应商样品'][i % 5],
    creator: ['张三', '李四', '王五'][i % 3],
    createTime: `2025-01-${String((i % 10) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: statuses[i % 7],
    erpOrderNo: i % 3 === 0 ? `ERP2025011${String(i + 1).padStart(4, '0')}` : '',
    approveRemark: i % 7 === 4 ? '物料信息不完整，请补充' : '',
    materials: [
      { materialCode: `MAT00000${i + 1}`, materialName: `物料${i + 1}`, spec: 'DN50', quantity: 50, unit: '个', location: `A1-0${(i % 5) + 1}-01`, batchNo: `BT2025011${i + 1}` }
    ]
  }))
  pagination.total = tableData.value.length
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => loading.value = false, 300)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '')
  handleSearch()
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleCreate = () => {
  dialogTitle.value = '新建杂项入库单'
  Object.assign(form, {
    inboundType: 'other',
    warehouse: 'WH01',
    planDate: new Date().toISOString().slice(0, 10),
    source: '',
    materials: [],
    remark: ''
  })
  addMaterial()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑杂项入库单'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const addMaterial = () => {
  form.materials.push({
    materialCode: '',
    materialName: '',
    spec: '',
    quantity: 1,
    unit: '个',
    location: '',
    batchNo: generateBatchNo(),
    remark: ''
  })
}

const removeMaterial = (index) => {
  form.materials.splice(index, 1)
}

const fetchMaterial = (row) => {
  if (row.materialCode) {
    // 模拟从ERP获取物料信息
    row.materialName = `物料-${row.materialCode}`
    row.spec = 'DN50'
    row.unit = '个'
  }
}

const scanMaterial = () => {
  ElMessage.info('请使用扫码枪扫描物料条码')
}

const handleSave = async (submitApproval) => {
  if (!form.materials.length || !form.materials.some(m => m.materialCode)) {
    ElMessage.warning('请至少添加一条物料明细')
    return
  }

  try {
    await formRef.value?.validate()
    
    const newOrder = {
      id: Date.now(),
      orderNo: generateOrderNo(),
      ...form,
      materialCount: form.materials.filter(m => m.materialCode).length,
      totalQty: form.materials.reduce((sum, m) => sum + (m.quantity || 0), 0),
      creator: '当前用户',
      createTime: new Date().toLocaleString(),
      status: submitApproval ? 'pending' : 'draft',
      erpOrderNo: '',
      materials: [...form.materials]
    }
    
    tableData.value.unshift(newOrder)
    dialogVisible.value = false
    
    if (submitApproval) {
      ElMessage.success('已保存并提交ERP审批')
      // 这里调用ERP API提交审批
      // await submitToErp(newOrder)
    } else {
      ElMessage.success('草稿保存成功')
    }
  } catch (e) {
    // 表单验证失败
  }
}

const handleSubmit = (row) => {
  ElMessageBox.confirm('确定提交此入库单到ERP审批吗？', '提交审批', { type: 'warning' })
    .then(() => {
      row.status = 'pending'
      ElMessage.success('已提交ERP审批')
      // 调用ERP API
    }).catch(() => {})
}

const handleBatchSubmit = () => {
  ElMessageBox.confirm(`确定批量提交 ${selectedRows.value.length} 个入库单到ERP审批吗？`, '批量提交', { type: 'warning' })
    .then(() => {
      selectedRows.value.forEach(row => row.status = 'pending')
      ElMessage.success('已批量提交ERP审批')
    }).catch(() => {})
}

const handleResubmit = (row) => {
  row.status = 'pending'
  ElMessage.success('已重新提交ERP审批')
}

const handleExecute = (row) => {
  router.push({ path: '/inbound/misc-execute', query: { orderNo: row.orderNo } })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此入库单吗？', '提示', { type: 'warning' })
    .then(() => {
      const idx = tableData.value.findIndex(item => item.id === row.id)
      if (idx > -1) tableData.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.misc-inbound { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.material-toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.material-table { margin-bottom: 16px; }
.text-muted { color: #c0c4cc; }
</style>
