<template>
  <div class="batch-manage">
    <h2>批次管理</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <el-statistic title="批次总数" :value="stats.totalBatch" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card warning">
          <el-statistic title="即将过期" :value="stats.expiringSoon" value-style="color: #e6a23c" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card danger">
          <el-statistic title="已过期" :value="stats.expired" value-style="color: #f56c6c" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card success">
          <el-statistic title="正常批次" :value="stats.normal" value-style="color: #67c23a" />
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="批次号">
          <el-input v-model="searchForm.batchNo" placeholder="批次号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="物料编码" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="效期状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" value="normal" />
            <el-option label="即将过期" value="expiring" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增批次
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-button type="danger" @click="handleBatchExpire" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon> 过期处理 ({{ selectedRows.length }})
        </el-button>
      </div>
      <div class="action-right">
        <el-switch v-model="showExpiredOnly" active-text="仅显示过期" @change="handleFilter" />
      </div>
    </div>

    <!-- 批次列表 -->
    <el-card shadow="never">
      <el-table :data="batchList" v-loading="loading" border stripe
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="batchNo" label="批次号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.batchNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="quantity" label="批次数量" width="100" align="right" />
        <el-table-column prop="remainQty" label="剩余数量" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.remainQty < row.quantity * 0.2 ? 'text-warning' : ''">{{ row.remainQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="productDate" label="生产日期" width="110" />
        <el-table-column prop="expireDate" label="有效期至" width="110">
          <template #default="{ row }">
            <span :class="getExpireDateClass(row)">{{ row.expireDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remainDays" label="剩余天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRemainDaysType(row.remainDays)" size="small">
              {{ row.remainDays > 0 ? row.remainDays + '天' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="140" show-overflow-tooltip />
        <el-table-column prop="location" label="库位" width="130" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleTrace(row)">追溯</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next" background />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批次号" prop="batchNo">
              <el-input v-model="formData.batchNo" placeholder="自动生成或手动输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="formData.materialCode" placeholder="请输入物料编码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批次数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="formData.supplier" placeholder="供应商名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期" prop="productDate">
              <el-date-picker v-model="formData.productDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="expireDate">
              <el-date-picker v-model="formData.expireDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="存放库位">
          <el-input v-model="formData.location" placeholder="库位编码" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批次追溯对话框 -->
    <el-dialog v-model="traceDialogVisible" title="批次追溯" width="800px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="批次号">{{ traceData.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ traceData.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ traceData.materialName }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ traceData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="生产日期">{{ traceData.productDate }}</el-descriptions-item>
        <el-descriptions-item label="有效期">{{ traceData.expireDate }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">流转记录</el-divider>
      <el-timeline>
        <el-timeline-item v-for="(item, index) in traceHistory" :key="index" 
          :type="item.type" :timestamp="item.time" placement="top">
          <el-card shadow="never">
            <h4>{{ item.action }}</h4>
            <p>{{ item.detail }}</p>
            <p class="trace-operator">操作人: {{ item.operator }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const traceDialogVisible = ref(false)
const dialogTitle = ref('新增批次')
const showExpiredOnly = ref(false)
const selectedRows = ref([])
const formRef = ref(null)

const stats = reactive({
  totalBatch: 2856,
  expiringSoon: 123,
  expired: 45,
  normal: 2688
})

const searchForm = reactive({
  batchNo: '',
  materialCode: '',
  status: '',
  dateRange: []
})

const formData = reactive({
  id: null,
  batchNo: '',
  materialCode: '',
  quantity: 0,
  supplier: '',
  productDate: '',
  expireDate: '',
  location: '',
  remark: ''
})

const formRules = {
  batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  productDate: [{ required: true, message: '请选择生产日期', trigger: 'change' }],
  expireDate: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

const traceData = ref({})
const traceHistory = ref([])
const pagination = reactive({ page: 1, size: 20, total: 500 })
const batchList = ref([])

const getStatusType = (status) => ({ normal: 'success', expiring: 'warning', expired: 'danger' }[status] || 'info')
const getStatusText = (status) => ({ normal: '正常', expiring: '即将过期', expired: '已过期' }[status] || '')
const getRemainDaysType = (days) => days > 30 ? 'success' : days > 0 ? 'warning' : 'danger'
const getExpireDateClass = (row) => row.remainDays <= 0 ? 'text-danger' : row.remainDays <= 30 ? 'text-warning' : ''
const getRowClassName = ({ row }) => row.status === 'expired' ? 'row-expired' : row.status === 'expiring' ? 'row-expiring' : ''

const generateData = () => {
  const data = []
  const today = new Date()
  
  for (let i = 1; i <= 50; i++) {
    const productDate = new Date(today - Math.random() * 365 * 24 * 60 * 60 * 1000)
    const shelfLife = Math.floor(Math.random() * 365) + 90
    const expireDate = new Date(productDate.getTime() + shelfLife * 24 * 60 * 60 * 1000)
    const remainDays = Math.floor((expireDate - today) / (24 * 60 * 60 * 1000))
    
    let status = 'normal'
    if (remainDays <= 0) status = 'expired'
    else if (remainDays <= 30) status = 'expiring'
    
    const quantity = Math.floor(Math.random() * 500) + 100
    
    data.push({
      id: i,
      batchNo: `BATCH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      materialCode: `MAT${String(i).padStart(6, '0')}`,
      materialName: `物料${i} - ${['轴承', '密封圈', '润滑油', '螺丝', '垫片'][i % 5]}`,
      quantity,
      remainQty: Math.floor(quantity * Math.random()),
      productDate: productDate.toISOString().split('T')[0],
      expireDate: expireDate.toISOString().split('T')[0],
      remainDays,
      status,
      supplier: `供应商${(i % 10) + 1}`,
      location: `A-${Math.floor(i / 10) + 1}-${(i % 10) + 1}`
    })
  }
  
  return data.sort((a, b) => a.remainDays - b.remainDays)
}

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    batchList.value = generateData()
    loading.value = false
  }, 500)
}

const handleSelectionChange = (rows) => { selectedRows.value = rows }
const handleSearch = () => { loadData() }
const handleReset = () => {
  Object.assign(searchForm, { batchNo: '', materialCode: '', status: '', dateRange: [] })
  loadData()
}
const handleFilter = () => { loadData() }

const handleAdd = () => {
  Object.assign(formData, { id: null, batchNo: '', materialCode: '', quantity: 0, supplier: '', productDate: '', expireDate: '', location: '', remark: '' })
  dialogTitle.value = '新增批次'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, row)
  dialogTitle.value = '编辑批次'
  dialogVisible.value = true
}

const handleSubmit = () => {
  ElMessage.success('保存成功')
  dialogVisible.value = false
  loadData()
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除批次 "${row.batchNo}"？`, '确认')
    .then(() => { ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

const handleBatchExpire = () => {
  ElMessageBox.confirm(`确定对选中的 ${selectedRows.value.length} 个过期批次进行处理？`, '批量过期处理')
    .then(() => { ElMessage.success('处理完成'); loadData() })
    .catch(() => {})
}

const handleExport = () => { ElMessage.success('正在导出批次数据...') }

const handleDetail = (row) => {
  ElMessage.info(`查看批次 ${row.batchNo} 详情`)
}

const handleTrace = (row) => {
  traceData.value = row
  traceHistory.value = [
    { time: '2024-12-01 10:30', action: '入库', detail: `从供应商${row.supplier}采购入库，数量${row.quantity}`, operator: '张三', type: 'success' },
    { time: '2024-12-05 14:20', action: '上架', detail: `上架至库位${row.location}`, operator: '李四', type: 'primary' },
    { time: '2024-12-10 09:15', action: '出库', detail: `领用出库50件，领用单号RQ202412100001`, operator: '王五', type: 'warning' },
    { time: '2024-12-15 16:40', action: '盘点', detail: '月度盘点，数量一致', operator: '赵六', type: 'info' }
  ]
  traceDialogVisible.value = true
}

onMounted(() => { loadData() })
</script>

<style scoped>
.batch-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.stat-cards { margin-bottom: 16px; }
.stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }

.action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }

:deep(.row-expired) { background-color: #fef0f0 !important; }
:deep(.row-expiring) { background-color: #fdf6ec !important; }

.trace-operator { font-size: 12px; color: #909399; margin-top: 8px; }
</style>
