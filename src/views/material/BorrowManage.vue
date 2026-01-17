<template>
  <div class="borrow-manage">
    <h2>借用管理</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.borrowing }}</div>
          <div class="stat-label">借用中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">已超期</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.returned }}</div>
          <div class="stat-label">已归还</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总记录</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="借用单号">
          <el-input v-model="searchForm.borrowNo" placeholder="模糊搜索" clearable style="width:140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="借用人">
          <el-input v-model="searchForm.borrower" placeholder="姓名" clearable style="width:100px" />
        </el-form-item>
        <el-form-item label="物料">
          <el-input v-model="searchForm.material" placeholder="编码/名称" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="借用中" value="borrowing" />
            <el-option label="已超期" value="overdue" />
            <el-option label="已归还" value="returned" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新建借用</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <el-button type="warning" @click="handleRemind" :disabled="stats.overdue === 0">
        催还提醒 ({{ stats.overdue }})
      </el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe :header-cell-style="{background:'#f5f7fa'}">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="borrowNo" label="借用单号" width="150">
          <template #default="{row}"><el-link type="primary">{{ row.borrowNo }}</el-link></template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="70" align="right" />
        <el-table-column prop="borrower" label="借用人" width="80" />
        <el-table-column prop="department" label="部门" width="90" />
        <el-table-column prop="borrowDate" label="借用日期" width="100" />
        <el-table-column prop="expectReturnDate" label="预计归还" width="100">
          <template #default="{row}">
            <span :class="{'text-danger': isOverdue(row)}">{{ row.expectReturnDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualReturnDate" label="实际归还" width="100">
          <template #default="{row}">{{ row.actualReturnDate || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row)" size="small">{{ getStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <template v-if="row.status === 'borrowing'">
              <el-button type="success" link size="small" @click="handleReturn(row)">归还</el-button>
              <el-button type="warning" link size="small" @click="handleExtend(row)">延期</el-button>
            </template>
            <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, prev, pager, next" background @current-change="handleSearch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="借用人" prop="borrower">
              <el-input v-model="formData.borrower" placeholder="借用人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="formData.department" placeholder="选择部门" style="width:100%">
                <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="formData.materialCode" placeholder="物料编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="materialName">
              <el-input v-model="formData.materialName" placeholder="物料名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="借用数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计归还" prop="expectReturnDate">
              <el-date-picker v-model="formData.expectReturnDate" type="date" style="width:100%" 
                value-format="YYYY-MM-DD" :disabled-date="d => d < new Date()" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="借用用途">
              <el-input v-model="formData.purpose" type="textarea" :rows="2" placeholder="借用用途说明" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="物资归还" width="450px">
      <el-form label-width="100px">
        <el-form-item label="借用单号">{{ currentRow?.borrowNo }}</el-form-item>
        <el-form-item label="物料名称">{{ currentRow?.materialName }}</el-form-item>
        <el-form-item label="借用数量">{{ currentRow?.quantity }}</el-form-item>
        <el-form-item label="归还数量">
          <el-input-number v-model="returnQty" :min="1" :max="currentRow?.quantity" />
        </el-form-item>
        <el-form-item label="归还备注">
          <el-input v-model="returnRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReturn">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const departments = ['生产部', '研发部', '设备部', '质量部', '采购部', '仓储部', '行政部']
const dialogVisible = ref(false)
const dialogTitle = ref('新建借用')
const returnDialogVisible = ref(false)
const formRef = ref(null)
const currentRow = ref(null)
const returnQty = ref(1)
const returnRemark = ref('')

const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ borrowNo: '', borrower: '', material: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const formData = reactive({
  borrower: '', department: '', materialCode: '', materialName: '',
  quantity: 1, expectReturnDate: '', purpose: ''
})
const formRules = {
  borrower: [{ required: true, message: '请输入借用人', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  expectReturnDate: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }]
}

const stats = computed(() => ({
  borrowing: allData.value.filter(d => d.status === 'borrowing').length,
  overdue: allData.value.filter(d => d.status === 'borrowing' && isOverdue(d)).length,
  returned: allData.value.filter(d => d.status === 'returned').length,
  total: allData.value.length
}))

const isOverdue = (row) => row.status === 'borrowing' && row.expectReturnDate < new Date().toISOString().slice(0, 10)
const getStatusType = (row) => isOverdue(row) ? 'danger' : ({ borrowing: 'warning', returned: 'success' }[row.status] || 'info')
const getStatusText = (row) => isOverdue(row) ? '已超期' : ({ borrowing: '借用中', returned: '已归还' }[row.status] || row.status)

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.borrowNo, searchForm.borrowNo)) return false
    if (!fuzzyMatch(item.borrower, searchForm.borrower)) return false
    if (searchForm.material && !fuzzyMatch(item.materialCode, searchForm.material) && !fuzzyMatch(item.materialName, searchForm.material)) return false
    if (searchForm.status === 'overdue' && !(item.status === 'borrowing' && isOverdue(item))) return false
    if (searchForm.status && searchForm.status !== 'overdue' && item.status !== searchForm.status) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = '')
  pagination.page = 1
  handleSearch()
}

const handleAdd = () => {
  Object.assign(formData, { borrower: '', department: '', materialCode: '', materialName: '', quantity: 1, expectReturnDate: '', purpose: '' })
  dialogTitle.value = '新建借用'
  dialogVisible.value = true
}

const handleView = (row) => {
  Object.assign(formData, { ...row })
  dialogTitle.value = '借用详情'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    allData.value.unshift({
      ...formData,
      id: Date.now(),
      borrowNo: `BRW${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`,
      borrowDate: new Date().toISOString().slice(0, 10),
      status: 'borrowing',
      actualReturnDate: null
    })
    ElMessage.success('借用成功')
    dialogVisible.value = false
    handleSearch()
  })
}

const handleReturn = (row) => {
  currentRow.value = row
  returnQty.value = row.quantity
  returnRemark.value = ''
  returnDialogVisible.value = true
}

const confirmReturn = () => {
  currentRow.value.status = 'returned'
  currentRow.value.actualReturnDate = new Date().toISOString().slice(0, 10)
  currentRow.value.returnQty = returnQty.value
  currentRow.value.returnRemark = returnRemark.value
  ElMessage.success('归还成功')
  returnDialogVisible.value = false
  handleSearch()
}

const handleExtend = (row) => {
  ElMessageBox.prompt('请输入新的归还日期 (YYYY-MM-DD)', '延期申请', {
    inputValue: row.expectReturnDate,
    inputPattern: /^\d{4}-\d{2}-\d{2}$/,
    inputErrorMessage: '请输入正确的日期格式'
  }).then(({ value }) => {
    row.expectReturnDate = value
    ElMessage.success('延期成功')
    handleSearch()
  }).catch(() => {})
}

const handleRemind = () => {
  const overdueList = allData.value.filter(d => d.status === 'borrowing' && isOverdue(d))
  ElMessage.success(`已发送 ${overdueList.length} 条催还提醒`)
}

const handleExport = () => {
  const headers = ['借用单号', '物料编码', '物料名称', '数量', '借用人', '部门', '借用日期', '预计归还', '状态']
  const rows = tableData.value.map(r => [r.borrowNo, r.materialCode, r.materialName, r.quantity, r.borrower, r.department, r.borrowDate, r.expectReturnDate, getStatusText(r)])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `借用记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const generateMockData = () => {
  const materials = [
    { code: 'MAT001', name: '电钻' }, { code: 'MAT002', name: '扳手套装' },
    { code: 'MAT003', name: '万用表' }, { code: 'MAT004', name: '示波器' },
    { code: 'MAT005', name: '电焊机' }
  ]
  const names = ['张三', '李四', '王五', '赵六', '钱七']
  return Array(50).fill(null).map((_, i) => {
    const m = materials[i % 5]
    return {
      id: i + 1,
      borrowNo: `BRW2024${String(i).padStart(6, '0')}`,
      materialCode: m.code,
      materialName: m.name,
      quantity: (i % 5) + 1,
      borrower: names[i % 5],
      department: departments[i % 7],
      borrowDate: `2024-12-${String((i % 28) + 1).padStart(2, '0')}`,
      expectReturnDate: `2025-01-${String((i % 20) + 1).padStart(2, '0')}`,
      actualReturnDate: i % 4 === 0 ? `2025-01-${String((i % 15) + 5).padStart(2, '0')}` : null,
      status: i % 4 === 0 ? 'returned' : 'borrowing',
      purpose: '项目使用'
    }
  })
}

onMounted(() => {
  allData.value = generateMockData()
  handleSearch()
})
</script>

<style scoped>
.borrow-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
