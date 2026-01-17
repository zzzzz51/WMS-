<template>
  <div class="return-order">
    <h2>退料单</h2>
    <el-alert type="success" :closable="false" style="margin-bottom: 16px">
      <template #title>
        退料单由WMS创建（领用人将物料退回仓库），提交ERP审批通过后可执行退料接收
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="退料单号">
          <el-input v-model="searchForm.orderNo" placeholder="退料单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="原领用单">
          <el-input v-model="searchForm.sourceNo" placeholder="原领用单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="退料人">
          <el-input v-model="searchForm.returnBy" placeholder="退料人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已接收" value="completed" />
          </el-select>
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
        <el-icon><Plus /></el-icon> 新建退料单
      </el-button>
      <el-button type="success" @click="handleBatchSubmit" :disabled="!selectedRows.length">
        <el-icon><Promotion /></el-icon> 批量提交审批
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="rows => selectedRows = rows">
        <el-table-column type="selection" width="45" :selectable="row => row.status === 'draft'" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="退料单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="sourceNo" label="原领用单号" width="150" />
        <el-table-column prop="returnType" label="退料类型" width="100">
          <template #default="{ row }">
            <el-tag :type="returnTypeMap[row.returnType]?.type" size="small">{{ returnTypeMap[row.returnType]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCount" label="物料种类" width="90" align="center" />
        <el-table-column prop="totalQty" label="退料数量" width="100" align="right">
          <template #default="{ row }">
            <span class="text-warning">{{ row.totalQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="returnBy" label="退料人" width="80" />
        <el-table-column prop="returnReason" label="退料原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'draft'" type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleSubmit(row)">提交审批</el-button>
            <el-button v-if="row.status === 'approved'" type="primary" link size="small" @click="handleReceive(row)">去接收</el-button>
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
            <el-form-item label="退料类型" prop="returnType">
              <el-select v-model="form.returnType" style="width: 100%">
                <el-option label="领用退料" value="requisition" />
                <el-option label="生产剩余" value="production" />
                <el-option label="质量问题" value="quality" />
                <el-option label="项目取消" value="cancel" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原领用单号">
              <el-input v-model="form.sourceNo" placeholder="关联的领用单号">
                <template #append>
                  <el-button @click="selectSourceOrder">选择</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="退料人" prop="returnBy">
              <el-input v-model="form.returnBy" placeholder="退料人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="退料部门">
              <el-input v-model="form.department" placeholder="退料部门" />
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
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="退料原因" prop="returnReason">
              <el-input v-model="form.returnReason" placeholder="请详细说明退料原因" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">退料物料</el-divider>
        
        <div class="material-toolbar">
          <el-button type="primary" size="small" @click="addMaterial">
            <el-icon><Plus /></el-icon> 添加物料
          </el-button>
          <el-button size="small" @click="importFromSource" :disabled="!form.sourceNo">
            <el-icon><Download /></el-icon> 从领用单导入
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
              <el-input v-model="row.materialName" size="small" disabled />
            </template>
          </el-table-column>
          <el-table-column label="规格" width="80">
            <template #default="{ row }">
              <span>{{ row.spec || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="原领数量" width="90" align="right">
            <template #default="{ row }">
              <span class="text-muted">{{ row.originalQty || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="退料数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" size="small" :min="1" :max="row.originalQty || 9999" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="60">
            <template #default="{ row }">
              <span>{{ row.unit || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="物料状态" width="100">
            <template #default="{ row }">
              <el-select v-model="row.condition" size="small" style="width: 100%">
                <el-option label="完好" value="good" />
                <el-option label="轻微损坏" value="minor" />
                <el-option label="需维修" value="repair" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="100">
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
              <el-input v-model="form.remark" type="textarea" :rows="2" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Promotion, Delete, Download } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建退料单')
const selectedRows = ref([])
const formRef = ref(null)

const searchForm = reactive({
  orderNo: '', sourceNo: '', returnBy: '', status: ''
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  returnType: 'requisition',
  sourceNo: '',
  returnBy: '',
  department: '',
  warehouse: 'WH01',
  phone: '',
  returnReason: '',
  materials: [],
  remark: ''
})

const rules = {
  returnType: [{ required: true, message: '请选择退料类型', trigger: 'change' }],
  returnBy: [{ required: true, message: '请输入退料人', trigger: 'blur' }],
  warehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }],
  returnReason: [{ required: true, message: '请输入退料原因', trigger: 'blur' }]
}

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' }
])

const returnTypeMap = {
  requisition: { label: '领用退料', type: 'primary' },
  production: { label: '生产剩余', type: 'success' },
  quality: { label: '质量问题', type: 'warning' },
  cancel: { label: '项目取消', type: 'info' },
  other: { label: '其他', type: '' }
}

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待审批', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  completed: { label: '已接收', type: 'success' }
}

const tableData = ref([])

const generateOrderNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `TL${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const generateData = () => {
  const types = ['requisition', 'production', 'quality', 'cancel', 'other']
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed']
  const reasons = ['多领退回', '生产完成剩余', '质量不合格', '项目取消', '其他原因']
  
  tableData.value = Array(20).fill(null).map((_, i) => ({
    id: i + 1,
    orderNo: `TL2025011${String(i + 1).padStart(4, '0')}`,
    sourceNo: `LY2025010${String(i + 1).padStart(4, '0')}`,
    returnType: types[i % 5],
    materialCount: Math.floor(Math.random() * 3) + 1,
    totalQty: Math.floor(Math.random() * 50) + 10,
    returnBy: ['张三', '李四', '王五'][i % 3],
    department: ['生产一部', '生产二部', '维修部'][i % 3],
    returnReason: reasons[i % 5],
    createTime: `2025-01-${String((i % 10) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: statuses[i % 5]
  }))
  pagination.total = tableData.value.length
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => loading.value = false, 300)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = '')
  handleSearch()
}

const handleCreate = () => {
  dialogTitle.value = '新建退料单'
  Object.assign(form, {
    returnType: 'requisition',
    sourceNo: '',
    returnBy: '',
    department: '',
    warehouse: 'WH01',
    phone: '',
    returnReason: '',
    materials: [],
    remark: ''
  })
  addMaterial()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑退料单'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info(`查看退料单：${row.orderNo}`)
}

const selectSourceOrder = () => {
  ElMessage.info('打开领用单选择弹窗')
}

const importFromSource = () => {
  ElMessage.info('从领用单导入物料')
}

const addMaterial = () => {
  form.materials.push({
    materialCode: '',
    materialName: '',
    spec: '',
    originalQty: 0,
    quantity: 1,
    unit: '个',
    condition: 'good',
    remark: ''
  })
}

const removeMaterial = (index) => {
  form.materials.splice(index, 1)
}

const fetchMaterial = (row) => {
  if (row.materialCode) {
    row.materialName = `物料-${row.materialCode}`
    row.spec = 'DN50'
    row.unit = '个'
    row.originalQty = Math.floor(Math.random() * 100) + 20
  }
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
      createTime: new Date().toLocaleString(),
      status: submitApproval ? 'pending' : 'draft'
    }
    
    tableData.value.unshift(newOrder)
    dialogVisible.value = false
    
    ElMessage.success(submitApproval ? '已保存并提交ERP审批' : '草稿保存成功')
  } catch (e) {}
}

const handleSubmit = (row) => {
  ElMessageBox.confirm('确定提交此退料单到ERP审批吗？', '提交审批', { type: 'warning' })
    .then(() => {
      row.status = 'pending'
      ElMessage.success('已提交ERP审批')
    }).catch(() => {})
}

const handleBatchSubmit = () => {
  ElMessageBox.confirm(`确定批量提交 ${selectedRows.value.length} 个退料单吗？`, '批量提交')
    .then(() => {
      selectedRows.value.forEach(row => row.status = 'pending')
      ElMessage.success('已批量提交ERP审批')
    }).catch(() => {})
}

const handleReceive = (row) => {
  router.push({ path: '/outbound/return-execute', query: { orderNo: row.orderNo } })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此退料单吗？', '提示', { type: 'warning' })
    .then(() => {
      const idx = tableData.value.findIndex(item => item.id === row.id)
      if (idx > -1) tableData.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.return-order { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.material-toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.material-table { margin-bottom: 16px; }
.text-warning { color: #e6a23c; font-weight: 600; }
.text-muted { color: #c0c4cc; }
</style>
