<template>
  <div class="transfer-order">
    <h2>移拨单管理</h2>
    <el-alert type="success" :closable="false" style="margin-bottom: 16px">
      <template #title>
        移拨单由WMS创建，提交ERP审批通过后可执行移库作业
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="移拨单号">
          <el-input v-model="searchForm.orderNo" placeholder="移拨单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="源仓库">
          <el-select v-model="searchForm.fromWarehouse" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="w in warehouseOptions" :key="w.code" :label="w.code" :value="w.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库">
          <el-select v-model="searchForm.toWarehouse" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="w in warehouseOptions" :key="w.code" :label="w.code" :value="w.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="执行中" value="executing" />
            <el-option label="已完成" value="completed" />
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
        <el-icon><Plus /></el-icon> 新建移拨单
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
        <el-table-column prop="orderNo" label="移拨单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="移拨路径" min-width="200">
          <template #default="{ row }">
            <div class="transfer-path">
              <el-tag type="info">{{ row.fromWarehouse }}</el-tag>
              <span class="arrow">→</span>
              <el-tag type="success">{{ row.toWarehouse }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="materialCount" label="物料种类" width="90" align="center" />
        <el-table-column prop="totalQty" label="总数量" width="100" align="right" />
        <el-table-column prop="reason" label="移拨原因" width="140" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建人" width="80" />
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
            <el-button v-if="row.status === 'approved'" type="primary" link size="small" @click="handleExecute(row)">去执行</el-button>
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
            <el-form-item label="源仓库" prop="fromWarehouse">
              <el-select v-model="form.fromWarehouse" style="width: 100%" @change="onFromWarehouseChange">
                <el-option v-for="w in warehouseOptions" :key="w.code" :label="`${w.code}-${w.name}`" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标仓库" prop="toWarehouse">
              <el-select v-model="form.toWarehouse" style="width: 100%">
                <el-option v-for="w in warehouseOptions.filter(w => w.code !== form.fromWarehouse)" :key="w.code" :label="`${w.code}-${w.name}`" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划日期">
              <el-date-picker v-model="form.planDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="移拨原因" prop="reason">
              <el-input v-model="form.reason" placeholder="如：仓库调整、库存平衡、生产需要等" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">物料明细</el-divider>
        
        <div class="material-toolbar">
          <el-button type="primary" size="small" @click="addMaterial">
            <el-icon><Plus /></el-icon> 添加物料
          </el-button>
          <el-button size="small" @click="selectFromStock">
            <el-icon><Search /></el-icon> 从库存选择
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
          <el-table-column label="源储位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.fromLocation" size="small" placeholder="源储位" />
            </template>
          </el-table-column>
          <el-table-column label="目标储位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.toLocation" size="small" placeholder="目标储位" />
            </template>
          </el-table-column>
          <el-table-column label="可用库存" width="90" align="right">
            <template #default="{ row }">
              <span class="text-primary">{{ row.availableQty || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="移拨数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" size="small" :min="1" :max="row.availableQty || 9999" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="60">
            <template #default="{ row }">
              <span>{{ row.unit || '-' }}</span>
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
import { Plus, Promotion, Delete, Search } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建移拨单')
const selectedRows = ref([])
const formRef = ref(null)

const searchForm = reactive({
  orderNo: '', fromWarehouse: '', toWarehouse: '', status: ''
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  fromWarehouse: 'WH01',
  toWarehouse: 'WH02',
  planDate: '',
  reason: '',
  materials: [],
  remark: ''
})

const rules = {
  fromWarehouse: [{ required: true, message: '请选择源仓库', trigger: 'change' }],
  toWarehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }],
  reason: [{ required: true, message: '请输入移拨原因', trigger: 'blur' }]
}

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' },
  { code: 'WH04', name: '备件仓' }
])

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待审批', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  executing: { label: '执行中', type: 'primary' },
  completed: { label: '已完成', type: 'success' }
}

const tableData = ref([])

const generateOrderNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `YB${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const generateData = () => {
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'executing', 'completed']
  const reasons = ['仓库调整', '库存平衡', '生产需要', '区域优化', '临时调配']
  
  tableData.value = Array(20).fill(null).map((_, i) => ({
    id: i + 1,
    orderNo: `YB2025011${String(i + 1).padStart(4, '0')}`,
    fromWarehouse: ['WH01', 'WH02', 'WH03'][i % 3],
    toWarehouse: ['WH02', 'WH03', 'WH04'][i % 3],
    materialCount: Math.floor(Math.random() * 5) + 1,
    totalQty: Math.floor(Math.random() * 200) + 50,
    reason: reasons[i % 5],
    creator: ['张三', '李四', '王五'][i % 3],
    createTime: `2025-01-${String((i % 10) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: statuses[i % 6],
    materials: [
      { materialCode: `MAT00000${i + 1}`, materialName: `物料${i + 1}`, spec: 'DN50', fromLocation: `A1-0${(i % 5) + 1}-01`, toLocation: `B2-0${(i % 5) + 1}-01`, availableQty: 100, quantity: 50, unit: '个' }
    ]
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
  dialogTitle.value = '新建移拨单'
  Object.assign(form, {
    fromWarehouse: 'WH01',
    toWarehouse: 'WH02',
    planDate: new Date().toISOString().slice(0, 10),
    reason: '',
    materials: [],
    remark: ''
  })
  addMaterial()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑移拨单'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info(`查看移拨单：${row.orderNo}`)
}

const onFromWarehouseChange = () => {
  if (form.fromWarehouse === form.toWarehouse) {
    form.toWarehouse = ''
  }
}

const addMaterial = () => {
  form.materials.push({
    materialCode: '',
    materialName: '',
    spec: '',
    fromLocation: '',
    toLocation: '',
    availableQty: 0,
    quantity: 1,
    unit: '个'
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
    row.availableQty = Math.floor(Math.random() * 200) + 50
    row.fromLocation = `A1-01-01`
  }
}

const selectFromStock = () => {
  ElMessage.info('打开库存选择弹窗')
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
      materials: [...form.materials]
    }
    
    tableData.value.unshift(newOrder)
    dialogVisible.value = false
    
    ElMessage.success(submitApproval ? '已保存并提交ERP审批' : '草稿保存成功')
  } catch (e) {}
}

const handleSubmit = (row) => {
  ElMessageBox.confirm('确定提交此移拨单到ERP审批吗？', '提交审批', { type: 'warning' })
    .then(() => {
      row.status = 'pending'
      ElMessage.success('已提交ERP审批')
    }).catch(() => {})
}

const handleBatchSubmit = () => {
  ElMessageBox.confirm(`确定批量提交 ${selectedRows.value.length} 个移拨单吗？`, '批量提交')
    .then(() => {
      selectedRows.value.forEach(row => row.status = 'pending')
      ElMessage.success('已批量提交ERP审批')
    }).catch(() => {})
}

const handleExecute = (row) => {
  router.push({ path: '/transfer/execute', query: { orderNo: row.orderNo } })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此移拨单吗？', '提示', { type: 'warning' })
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
.transfer-order { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.material-toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.material-table { margin-bottom: 16px; }
.transfer-path { display: flex; align-items: center; gap: 8px; }
.transfer-path .arrow { color: #409eff; font-weight: bold; }
.text-primary { color: #409eff; font-weight: 600; }
</style>
