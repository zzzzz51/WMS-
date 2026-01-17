<template>
  <div class="exchange-manage">
    <h2>以物换物（物资置换）</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card gradient-1">
          <div class="stat-content">
            <el-icon :size="40"><Refresh /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待处理申请</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card gradient-2">
          <div class="stat-content">
            <el-icon :size="40"><Checked /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">本月完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card gradient-3">
          <div class="stat-content">
            <el-icon :size="40"><TrendCharts /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ (stats.savedValue / 10000).toFixed(1) }}万</div>
              <div class="stat-label">节省采购成本</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card gradient-4">
          <div class="stat-content">
            <el-icon :size="40"><Connection /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.partners }}</div>
              <div class="stat-label">置换合作方</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="置换单号">
          <el-input v-model="searchForm.exchangeNo" placeholder="模糊搜索" clearable style="width:150px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="置换类型">
          <el-select v-model="searchForm.exchangeType" placeholder="全部" clearable style="width:120px">
            <el-option label="内部置换" value="internal" />
            <el-option label="外部置换" value="external" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:110px">
            <el-option label="待审批" value="pending" />
            <el-option label="审批中" value="approving" />
            <el-option label="执行中" value="executing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请部门">
          <el-select v-model="searchForm.department" placeholder="全部" clearable style="width:120px">
            <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width:220px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 搜索</el-button>
          <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新建置换申请
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
      <el-button @click="handlePrint" :disabled="!selectedRows.length">
        <el-icon><Printer /></el-icon> 打印
      </el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe row-key="id"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="selection" width="45" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="exchange-side">
                    <div class="side-title">
                      <el-icon color="#f56c6c"><Top /></el-icon> 换出物资
                    </div>
                    <el-table :data="row.outItems" size="small" border>
                      <el-table-column prop="materialCode" label="物料编码" width="120" />
                      <el-table-column prop="materialName" label="物料名称" />
                      <el-table-column prop="quantity" label="数量" width="80" align="right" />
                      <el-table-column prop="price" label="单价" width="90" align="right">
                        <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
                      </el-table-column>
                      <el-table-column prop="amount" label="金额" width="100" align="right">
                        <template #default="{ row }">
                          <span class="text-danger">¥{{ (row.quantity * row.price).toFixed(2) }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                    <div class="side-total">换出总额：<span class="text-danger">¥{{ calcTotal(row.outItems).toFixed(2) }}</span></div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="exchange-side">
                    <div class="side-title">
                      <el-icon color="#67c23a"><Bottom /></el-icon> 换入物资
                    </div>
                    <el-table :data="row.inItems" size="small" border>
                      <el-table-column prop="materialCode" label="物料编码" width="120" />
                      <el-table-column prop="materialName" label="物料名称" />
                      <el-table-column prop="quantity" label="数量" width="80" align="right" />
                      <el-table-column prop="price" label="单价" width="90" align="right">
                        <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
                      </el-table-column>
                      <el-table-column prop="amount" label="金额" width="100" align="right">
                        <template #default="{ row }">
                          <span class="text-success">¥{{ (row.quantity * row.price).toFixed(2) }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                    <div class="side-total">换入总额：<span class="text-success">¥{{ calcTotal(row.inItems).toFixed(2) }}</span></div>
                  </div>
                </el-col>
              </el-row>
              <div class="balance-info">
                差额：
                <span :class="calcBalance(row) >= 0 ? 'text-success' : 'text-danger'">
                  {{ calcBalance(row) >= 0 ? '+' : '' }}¥{{ calcBalance(row).toFixed(2) }}
                </span>
                <span v-if="Math.abs(calcBalance(row)) > 0" style="color:#909399;margin-left:10px">
                  （{{ calcBalance(row) > 0 ? '我方收益' : '需补差价' }}）
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="exchangeNo" label="置换单号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.exchangeNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="exchangeType" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.exchangeType === 'internal' ? 'success' : 'warning'" size="small">
              {{ row.exchangeType === 'internal' ? '内部' : '外部' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="partnerName" label="置换方" width="120" show-overflow-tooltip />
        <el-table-column label="换出" width="90" align="center">
          <template #default="{ row }">
            {{ row.outItems?.length }}种 / {{ row.outItems?.reduce((s, i) => s + i.quantity, 0) }}件
          </template>
        </el-table-column>
        <el-table-column label="换入" width="90" align="center">
          <template #default="{ row }">
            {{ row.inItems?.length }}种 / {{ row.inItems?.reduce((s, i) => s + i.quantity, 0) }}件
          </template>
        </el-table-column>
        <el-table-column label="差额" width="100" align="right">
          <template #default="{ row }">
            <span :class="calcBalance(row) >= 0 ? 'text-success' : 'text-danger'">
              {{ calcBalance(row) >= 0 ? '+' : '' }}¥{{ calcBalance(row).toFixed(0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="80" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleApprove(row)">提交审批</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            </template>
            <template v-else-if="row.status === 'approving'">
              <el-button type="success" link size="small" @click="doApprove(row)">通过</el-button>
              <el-button type="danger" link size="small" @click="doReject(row)">驳回</el-button>
            </template>
            <template v-else-if="row.status === 'executing'">
              <el-button type="success" link size="small" @click="handleComplete(row)">完成</el-button>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
            </template>
            <template v-else>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="handlePrintOne(row)">打印</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next" background
          @size-change="handleSearch" @current-change="handleSearch" />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1000px" :close-on-click-modal="false" top="3vh">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="置换单号">
              <el-input v-model="formData.exchangeNo" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置换类型" prop="exchangeType">
              <el-radio-group v-model="formData.exchangeType">
                <el-radio label="internal">内部置换</el-radio>
                <el-radio label="external">外部置换</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置换方" prop="partnerName">
              <el-input v-model="formData.partnerName" :placeholder="formData.exchangeType === 'internal' ? '部门名称' : '公司名称'" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <!-- 换出物资 -->
          <el-col :span="12">
            <el-divider content-position="left">
              <el-icon color="#f56c6c"><Top /></el-icon> 换出物资
            </el-divider>
            <div class="items-actions">
              <el-button type="primary" size="small" @click="addOutItem">添加物料</el-button>
            </div>
            <el-table :data="formData.outItems" border size="small" max-height="250">
              <el-table-column prop="materialCode" label="编码" width="110">
                <template #default="{ row }">
                  <el-input v-model="row.materialCode" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="materialName" label="名称" min-width="100">
                <template #default="{ row }">
                  <el-input v-model="row.materialName" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="80">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width:70px" />
                </template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" size="small" controls-position="right" style="width:80px" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="50" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="formData.outItems.splice($index, 1)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="items-total">
              合计：<span class="text-danger">¥{{ calcTotal(formData.outItems).toFixed(2) }}</span>
            </div>
          </el-col>
          
          <!-- 换入物资 -->
          <el-col :span="12">
            <el-divider content-position="left">
              <el-icon color="#67c23a"><Bottom /></el-icon> 换入物资
            </el-divider>
            <div class="items-actions">
              <el-button type="primary" size="small" @click="addInItem">添加物料</el-button>
            </div>
            <el-table :data="formData.inItems" border size="small" max-height="250">
              <el-table-column prop="materialCode" label="编码" width="110">
                <template #default="{ row }">
                  <el-input v-model="row.materialCode" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="materialName" label="名称" min-width="100">
                <template #default="{ row }">
                  <el-input v-model="row.materialName" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="80">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="1" size="small" controls-position="right" style="width:70px" />
                </template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" size="small" controls-position="right" style="width:80px" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="50" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="formData.inItems.splice($index, 1)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="items-total">
              合计：<span class="text-success">¥{{ calcTotal(formData.inItems).toFixed(2) }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div class="balance-summary">
          <span>置换差额：</span>
          <span :class="formBalance >= 0 ? 'text-success' : 'text-danger'" style="font-size:20px;font-weight:bold">
            {{ formBalance >= 0 ? '+' : '' }}¥{{ formBalance.toFixed(2) }}
          </span>
          <span style="color:#909399;margin-left:10px">
            （{{ formBalance > 0 ? '我方收益' : formBalance < 0 ? '需补差价' : '等值置换' }}）
          </span>
        </div>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="置换原因">
              <el-input v-model="formData.reason" type="textarea" :rows="2" placeholder="请输入置换原因" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存草稿</el-button>
        <el-button type="success" @click="submitAndApprove" :loading="submitting">保存并提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Refresh, Plus, Download, Printer, Delete, Top, Bottom,
  Checked, TrendCharts, Connection
} from '@element-plus/icons-vue'

// ========== 常量 ==========
const departments = ['生产部', '研发部', '设备部', '质量部', '采购部', '仓储部']

// ========== 状态 ==========
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建置换申请')
const formRef = ref(null)

const allData = ref([])
const tableData = ref([])
const selectedRows = ref([])

const searchForm = reactive({
  exchangeNo: '', exchangeType: '', status: '', department: '', dateRange: []
})
const pagination = reactive({ page: 1, size: 20, total: 0 })

const formData = reactive({
  id: null,
  exchangeNo: '',
  exchangeType: 'internal',
  partnerName: '',
  reason: '',
  outItems: [],
  inItems: []
})

const formRules = {
  exchangeType: [{ required: true, message: '请选择置换类型', trigger: 'change' }],
  partnerName: [{ required: true, message: '请输入置换方', trigger: 'blur' }]
}

// 计算
const calcTotal = (items) => (items || []).reduce((s, i) => s + (i.quantity || 0) * (i.price || 0), 0)
const calcBalance = (row) => calcTotal(row.inItems) - calcTotal(row.outItems)
const formBalance = computed(() => calcTotal(formData.inItems) - calcTotal(formData.outItems))

// 统计
const stats = computed(() => {
  const data = allData.value
  return {
    pending: data.filter(d => d.status === 'pending' || d.status === 'approving').length,
    completed: data.filter(d => d.status === 'completed').length,
    savedValue: data.filter(d => d.status === 'completed').reduce((s, d) => s + Math.max(0, calcBalance(d)), 0),
    partners: new Set(data.map(d => d.partnerName)).size
  }
})

// ========== 辅助函数 ==========
const getStatusType = (status) => {
  const map = { pending: 'info', approving: 'warning', executing: '', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}
const getStatusText = (status) => {
  const map = { pending: '待提交', approving: '审批中', executing: '执行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const fuzzyMatch = (text, keyword) => {
  if (!keyword) return true
  return String(text || '').toLowerCase().includes(String(keyword).toLowerCase())
}

// ========== 搜索 ==========
const handleSearch = () => {
  loading.value = true
  
  let result = allData.value.filter(item => {
    if (searchForm.exchangeNo && !fuzzyMatch(item.exchangeNo, searchForm.exchangeNo)) return false
    if (searchForm.exchangeType && item.exchangeType !== searchForm.exchangeType) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    if (searchForm.department && item.department !== searchForm.department) return false
    if (searchForm.dateRange?.length === 2) {
      const date = item.createTime.slice(0, 10)
      if (date < searchForm.dateRange[0] || date > searchForm.dateRange[1]) return false
    }
    return true
  })
  
  pagination.total = result.length
  const start = (pagination.page - 1) * pagination.size
  tableData.value = result.slice(start, start + pagination.size)
  loading.value = false
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '')
  pagination.page = 1
  handleSearch()
}

const handleSelectionChange = (rows) => { selectedRows.value = rows }

// ========== CRUD ==========
const generateNo = () => `EXC${new Date().toISOString().slice(0,10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`

const handleAdd = () => {
  Object.assign(formData, {
    id: null, exchangeNo: generateNo(), exchangeType: 'internal',
    partnerName: '', reason: '', outItems: [], inItems: []
  })
  dialogTitle.value = '新建置换申请'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, { ...row, outItems: [...row.outItems], inItems: [...row.inItems] })
  dialogTitle.value = '编辑置换申请'
  dialogVisible.value = true
}

const handleView = (row) => {
  Object.assign(formData, { ...row, outItems: [...row.outItems], inItems: [...row.inItems] })
  dialogTitle.value = '置换单详情'
  dialogVisible.value = true
}

const addOutItem = () => {
  formData.outItems.push({ materialCode: '', materialName: '', quantity: 1, price: 0 })
}

const addInItem = () => {
  formData.inItems.push({ materialCode: '', materialName: '', quantity: 1, price: 0 })
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (formData.outItems.length === 0) return ElMessage.warning('请添加换出物资')
    if (formData.inItems.length === 0) return ElMessage.warning('请添加换入物资')
    
    submitting.value = true
    setTimeout(() => {
      if (formData.id) {
        const idx = allData.value.findIndex(d => d.id === formData.id)
        if (idx > -1) allData.value[idx] = { ...formData }
      } else {
        allData.value.unshift({
          ...formData,
          id: Date.now(),
          status: 'pending',
          applicant: '张三',
          department: '仓储部',
          createTime: new Date().toLocaleString()
        })
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      submitting.value = false
      handleSearch()
    }, 400)
  })
}

const submitAndApprove = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (formData.outItems.length === 0) return ElMessage.warning('请添加换出物资')
    if (formData.inItems.length === 0) return ElMessage.warning('请添加换入物资')
    
    submitting.value = true
    setTimeout(() => {
      allData.value.unshift({
        ...formData,
        id: Date.now(),
        status: 'approving',
        applicant: '张三',
        department: '仓储部',
        createTime: new Date().toLocaleString()
      })
      ElMessage.success('提交成功')
      dialogVisible.value = false
      submitting.value = false
      handleSearch()
    }, 400)
  })
}

const handleApprove = (row) => {
  row.status = 'approving'
  ElMessage.success('已提交审批')
  handleSearch()
}

const doApprove = (row) => {
  row.status = 'executing'
  ElMessage.success('审批通过')
  handleSearch()
}

const doReject = (row) => {
  ElMessageBox.prompt('请输入驳回原因', '驳回', { inputType: 'textarea' })
    .then(({ value }) => {
      row.status = 'cancelled'
      row.rejectReason = value
      ElMessage.warning('已驳回')
      handleSearch()
    }).catch(() => {})
}

const handleComplete = (row) => {
  ElMessageBox.confirm('确认置换已完成？', '确认')
    .then(() => {
      row.status = 'completed'
      ElMessage.success('置换完成')
      handleSearch()
    }).catch(() => {})
}

// ========== 导出打印 ==========
const handleExport = () => {
  const data = selectedRows.value.length ? selectedRows.value : tableData.value
  if (!data.length) return ElMessage.warning('无数据')
  
  const csv = [
    ['置换单号', '类型', '置换方', '换出种类', '换出数量', '换入种类', '换入数量', '差额', '状态', '申请人', '时间'].join(','),
    ...data.map(r => [
      r.exchangeNo,
      r.exchangeType === 'internal' ? '内部' : '外部',
      r.partnerName,
      r.outItems.length,
      r.outItems.reduce((s, i) => s + i.quantity, 0),
      r.inItems.length,
      r.inItems.reduce((s, i) => s + i.quantity, 0),
      calcBalance(r).toFixed(2),
      getStatusText(r.status),
      r.applicant,
      r.createTime
    ].join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `物资置换_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const handlePrint = () => { ElMessage.info('批量打印') }

const handlePrintOne = (row) => {
  const outHtml = row.outItems.map((i, idx) => `<tr><td>${idx+1}</td><td>${i.materialCode}</td><td>${i.materialName}</td><td>${i.quantity}</td><td>¥${i.price}</td><td>¥${(i.quantity*i.price).toFixed(2)}</td></tr>`).join('')
  const inHtml = row.inItems.map((i, idx) => `<tr><td>${idx+1}</td><td>${i.materialCode}</td><td>${i.materialName}</td><td>${i.quantity}</td><td>¥${i.price}</td><td>¥${(i.quantity*i.price).toFixed(2)}</td></tr>`).join('')
  
  const html = `
    <h2 style="text-align:center">物资置换单</h2>
    <p>单号：${row.exchangeNo} | 类型：${row.exchangeType === 'internal' ? '内部置换' : '外部置换'} | 置换方：${row.partnerName}</p>
    <p>申请人：${row.applicant} | 部门：${row.department} | 时间：${row.createTime}</p>
    <h4>换出物资</h4>
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px">
      <tr style="background:#f5f5f5"><th>序号</th><th>编码</th><th>名称</th><th>数量</th><th>单价</th><th>金额</th></tr>
      ${outHtml}
      <tr><td colspan="5" style="text-align:right">合计</td><td>¥${calcTotal(row.outItems).toFixed(2)}</td></tr>
    </table>
    <h4 style="margin-top:20px">换入物资</h4>
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px">
      <tr style="background:#f5f5f5"><th>序号</th><th>编码</th><th>名称</th><th>数量</th><th>单价</th><th>金额</th></tr>
      ${inHtml}
      <tr><td colspan="5" style="text-align:right">合计</td><td>¥${calcTotal(row.inItems).toFixed(2)}</td></tr>
    </table>
    <p style="margin-top:20px;font-size:14px"><strong>差额：¥${calcBalance(row).toFixed(2)}</strong></p>
    <p style="margin-top:30px">换出方签字：__________ &nbsp;&nbsp; 换入方签字：__________</p>
  `
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>置换单</title></head><body style="padding:20px">${html}</body></html>`)
  win.document.close()
  win.print()
}

// ========== 数据生成 ==========
const generateMockData = (count = 40) => {
  const statuses = ['pending', 'approving', 'executing', 'completed', 'completed', 'completed']
  const partners = ['生产部', '研发部', 'A公司', 'B公司', '设备部', 'C供应商']
  const data = []
  
  for (let i = 1; i <= count; i++) {
    const outCount = Math.floor(Math.random() * 3) + 1
    const inCount = Math.floor(Math.random() * 3) + 1
    
    const outItems = Array(outCount).fill(null).map((_, j) => ({
      materialCode: `OUT${String(i * 10 + j).padStart(6, '0')}`,
      materialName: `换出物料${i}-${j + 1}`,
      quantity: Math.floor(Math.random() * 20) + 5,
      price: Math.floor(Math.random() * 200) + 50
    }))
    
    const inItems = Array(inCount).fill(null).map((_, j) => ({
      materialCode: `IN${String(i * 10 + j).padStart(6, '0')}`,
      materialName: `换入物料${i}-${j + 1}`,
      quantity: Math.floor(Math.random() * 20) + 5,
      price: Math.floor(Math.random() * 200) + 50
    }))
    
    data.push({
      id: i,
      exchangeNo: `EXC2024${String(12 - (i % 12)).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      exchangeType: i % 3 === 0 ? 'external' : 'internal',
      partnerName: partners[i % partners.length],
      status: statuses[i % statuses.length],
      reason: '库存优化调整',
      applicant: ['张三', '李四', '王五'][i % 3],
      department: departments[i % departments.length],
      createTime: `2024-${String(12 - (i % 12)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
      outItems,
      inItems
    })
  }
  return data
}

// ========== 初始化 ==========
onMounted(() => {
  allData.value = generateMockData(40)
  handleSearch()
})
</script>

<style scoped>
.exchange-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.stat-row { margin-bottom: 16px; }
.stat-card { color: white; }
.stat-card.gradient-1 { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-card.gradient-2 { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-card.gradient-3 { background: linear-gradient(135deg, #ee0979, #ff6a00); }
.stat-card.gradient-4 { background: linear-gradient(135deg, #4568dc, #b06ab3); }
.stat-content { display: flex; align-items: center; gap: 16px; }
.stat-info { flex: 1; }
.stat-value { font-size: 26px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }

.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }

.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.expand-detail { padding: 16px; background: #fafafa; }
.exchange-side { background: white; padding: 12px; border-radius: 4px; }
.side-title { font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.side-total { text-align: right; margin-top: 10px; font-weight: bold; }
.balance-info { text-align: center; margin-top: 16px; padding: 12px; background: white; border-radius: 4px; font-size: 16px; }

.text-danger { color: #f56c6c; }
.text-success { color: #67c23a; }
.text-primary { color: #409eff; }

.items-actions { margin-bottom: 10px; }
.items-total { text-align: right; margin-top: 10px; font-weight: bold; }
.balance-summary { text-align: center; padding: 16px; margin: 16px 0; background: #f5f7fa; border-radius: 4px; }
</style>
