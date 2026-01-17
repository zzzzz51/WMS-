<template>
  <div class="return-manage">
    <h2>退库管理</h2>
    
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="退库单号">
          <el-input v-model="searchForm.returnNo" placeholder="退库单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="物料编码" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="退库类型">
          <el-select v-model="searchForm.returnType" placeholder="全部" clearable style="width: 120px">
            <el-option label="领用退库" value="requisition" />
            <el-option label="生产退料" value="production" />
            <el-option label="质量退货" value="quality" />
            <el-option label="其他退库" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已入库" value="completed" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="退库日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" value-format="YYYY-MM-DD" />
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
        <el-icon><Plus /></el-icon> 新建退库单
      </el-button>
      <el-button type="success" @click="handleBatchApprove" :disabled="!selectedRows.length">
        <el-icon><Check /></el-icon> 批量审核
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
      <span class="total-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe @selection-change="rows => selectedRows = rows" v-loading="loading">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="returnNo" label="退库单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.returnNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="returnType" label="退库类型" width="100">
          <template #default="{ row }">
            <el-tag :type="returnTypeMap[row.returnType]?.type" size="small">
              {{ returnTypeMap[row.returnType]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格型号" width="100" show-overflow-tooltip />
        <el-table-column prop="quantity" label="退库数量" width="100" align="right">
          <template #default="{ row }">
            <span class="text-primary">{{ row.quantity }}</span> {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="warehouseCode" label="入库仓库" width="90" />
        <el-table-column prop="location" label="入库储位" width="100" />
        <el-table-column prop="returnDate" label="退库日期" width="100" />
        <el-table-column prop="returnBy" label="退库人" width="80" />
        <el-table-column prop="reason" label="退库原因" width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handleApprove(row)">审核</el-button>
            <el-button v-if="row.status === 'approved'" type="warning" link size="small" @click="handlePutaway(row)">上架</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="退库类型" prop="returnType">
              <el-select v-model="form.returnType" placeholder="请选择" style="width: 100%">
                <el-option label="领用退库" value="requisition" />
                <el-option label="生产退料" value="production" />
                <el-option label="质量退货" value="quality" />
                <el-option label="其他退库" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退库日期" prop="returnDate">
              <el-date-picker v-model="form.returnDate" type="date" placeholder="选择日期" 
                style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="form.materialCode" placeholder="扫码或输入物料编码">
                <template #append>
                  <el-button @click="handleScanMaterial">扫码</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="materialName">
              <el-input v-model="form.materialName" placeholder="物料名称" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号">
              <el-input v-model="form.spec" placeholder="规格型号" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退库数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库仓库" prop="warehouseCode">
              <el-select v-model="form.warehouseCode" placeholder="选择仓库" style="width: 100%">
                <el-option v-for="w in warehouseOptions" :key="w.code" :label="`${w.code} - ${w.name}`" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库储位" prop="location">
              <el-input v-model="form.location" placeholder="如 A1-01-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退库人">
              <el-input v-model="form.returnBy" placeholder="退库人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原领用单号">
              <el-input v-model="form.sourceNo" placeholder="关联的原领用单号（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="退库原因" prop="reason">
              <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请输入退库原因" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="退库审核" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="退库单号">
          <el-input :value="currentRow?.returnNo" disabled />
        </el-form-item>
        <el-form-item label="物料信息">
          <el-input :value="`${currentRow?.materialCode} - ${currentRow?.materialName}`" disabled />
        </el-form-item>
        <el-form-item label="退库数量">
          <el-input :value="`${currentRow?.quantity} ${currentRow?.unit}`" disabled />
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="approveForm.result">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="approveForm.opinion" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check, Download } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const dialogTitle = ref('新建退库单')
const selectedRows = ref([])
const currentRow = ref(null)
const formRef = ref(null)

const searchForm = reactive({
  returnNo: '', materialCode: '', returnType: '', status: '', dateRange: []
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  returnType: 'requisition', returnDate: new Date().toISOString().slice(0, 10),
  materialCode: '', materialName: '', spec: '', quantity: 1, unit: '个',
  warehouseCode: '', location: '', returnBy: '', sourceNo: '', reason: '', remark: ''
})

const approveForm = reactive({ result: 'approved', opinion: '' })

const rules = {
  returnType: [{ required: true, message: '请选择退库类型', trigger: 'change' }],
  returnDate: [{ required: true, message: '请选择退库日期', trigger: 'change' }],
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入退库数量', trigger: 'blur' }],
  warehouseCode: [{ required: true, message: '请选择入库仓库', trigger: 'change' }],
  location: [{ required: true, message: '请输入入库储位', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退库原因', trigger: 'blur' }]
}

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' },
  { code: 'WH04', name: '备件仓' }
])

const returnTypeMap = {
  requisition: { label: '领用退库', type: 'primary' },
  production: { label: '生产退料', type: 'success' },
  quality: { label: '质量退货', type: 'warning' },
  other: { label: '其他退库', type: 'info' }
}

const statusMap = {
  pending: { label: '待审核', type: 'warning' },
  approved: { label: '已审核', type: 'success' },
  completed: { label: '已入库', type: 'primary' },
  rejected: { label: '已驳回', type: 'danger' }
}

const allData = ref([])
const tableData = ref([])

const generateReturnNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `TK${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (searchForm.returnNo && !item.returnNo.includes(searchForm.returnNo)) return false
    if (searchForm.materialCode && !item.materialCode.includes(searchForm.materialCode)) return false
    if (searchForm.returnType && item.returnType !== searchForm.returnType) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '')
  pagination.page = 1
  handleSearch()
}

const handleCreate = () => {
  dialogTitle.value = '新建退库单'
  Object.assign(form, {
    returnType: 'requisition', returnDate: new Date().toISOString().slice(0, 10),
    materialCode: '', materialName: '', spec: '', quantity: 1, unit: '个',
    warehouseCode: 'WH01', location: '', returnBy: '', sourceNo: '', reason: '', remark: ''
  })
  dialogVisible.value = true
}

const handleScanMaterial = () => {
  ElMessage.info('请使用扫码枪扫描物料条码')
}

const handleSubmit = async () => {
  await formRef.value?.validate(valid => {
    if (!valid) return
    const newItem = {
      id: Date.now(),
      returnNo: generateReturnNo(),
      ...form,
      status: 'pending',
      createTime: new Date().toISOString()
    }
    allData.value.unshift(newItem)
    ElMessage.success('退库单创建成功')
    dialogVisible.value = false
    handleSearch()
  })
}

const handleView = (row) => {
  currentRow.value = row
  ElMessage.info(`查看退库单：${row.returnNo}`)
}

const handleApprove = (row) => {
  currentRow.value = row
  approveForm.result = 'approved'
  approveForm.opinion = ''
  approveDialogVisible.value = true
}

const submitApprove = () => {
  currentRow.value.status = approveForm.result
  ElMessage.success(approveForm.result === 'approved' ? '审核通过' : '已驳回')
  approveDialogVisible.value = false
  handleSearch()
}

const handlePutaway = (row) => {
  ElMessageBox.confirm(`确认将退库物料上架到 ${row.location}？`, '上架确认', { type: 'info' })
    .then(() => {
      row.status = 'completed'
      ElMessage.success('上架完成，库存已更新')
      handleSearch()
    }).catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除该退库单吗？', '提示', { type: 'warning' })
    .then(() => {
      const idx = allData.value.findIndex(item => item.id === row.id)
      if (idx > -1) allData.value.splice(idx, 1)
      ElMessage.success('删除成功')
      handleSearch()
    }).catch(() => {})
}

const handleBatchApprove = () => {
  const pendingRows = selectedRows.value.filter(r => r.status === 'pending')
  if (!pendingRows.length) {
    ElMessage.warning('没有待审核的记录')
    return
  }
  ElMessageBox.confirm(`确定批量审核 ${pendingRows.length} 条记录吗？`, '批量审核', { type: 'info' })
    .then(() => {
      pendingRows.forEach(row => row.status = 'approved')
      ElMessage.success(`已审核 ${pendingRows.length} 条记录`)
      handleSearch()
    }).catch(() => {})
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

onMounted(() => {
  const types = ['requisition', 'production', 'quality', 'other']
  const statuses = ['pending', 'approved', 'completed', 'rejected']
  const warehouses = ['WH01', 'WH02', 'WH03', 'WH04']
  
  allData.value = Array(30).fill(null).map((_, i) => ({
    id: i + 1,
    returnNo: `TK2025011${String(i + 1).padStart(4, '0')}`,
    returnType: types[i % 4],
    materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
    materialName: `物料名称${i + 1}`,
    spec: ['DN50', 'M10×30', '6205-2RS', 'Φ20×100'][i % 4],
    quantity: Math.floor(Math.random() * 50) + 5,
    unit: ['个', '件', '台', 'kg'][i % 4],
    warehouseCode: warehouses[i % 4],
    location: `${String.fromCharCode(65 + (i % 4))}${Math.floor(i / 4) + 1}-${String((i % 10) + 1).padStart(2, '0')}-01`,
    returnDate: `2025-01-${String((i % 10) + 1).padStart(2, '0')}`,
    returnBy: ['张三', '李四', '王五', '赵六'][i % 4],
    sourceNo: i % 3 === 0 ? `LY2025010${i + 1}` : '',
    reason: ['多领退回', '生产剩余', '质量不合格', '项目取消'][i % 4],
    status: statuses[i % 4]
  }))
  handleSearch()
})
</script>

<style scoped>
.return-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.total-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-primary { color: #409eff; font-weight: 600; }
</style>
