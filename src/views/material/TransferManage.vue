<template>
  <div class="transfer-manage">
    <h2>调拨管理</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-icon"><el-icon :size="36"><Switch /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待审批</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-icon"><el-icon :size="36"><Van /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inTransit }}</div>
            <div class="stat-label">调拨中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-icon"><el-icon :size="36"><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">本月完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-icon"><el-icon :size="36"><Box /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalQty.toLocaleString() }}</div>
            <div class="stat-label">本月调拨数量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="调拨单号">
          <el-input v-model="searchForm.transferNo" placeholder="模糊搜索" clearable style="width:150px" 
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="调出仓库">
          <el-select v-model="searchForm.fromWarehouse" placeholder="全部" clearable style="width:130px">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="调入仓库">
          <el-select v-model="searchForm.toWarehouse" placeholder="全部" clearable style="width:130px">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:110px">
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="调拨中" value="inTransit" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
        <el-icon><Plus /></el-icon> 新建调拨单
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
              <el-table :data="row.items" size="small" border>
                <el-table-column prop="materialCode" label="物料编码" width="130" />
                <el-table-column prop="materialName" label="物料名称" min-width="150" />
                <el-table-column prop="spec" label="规格" width="100" />
                <el-table-column prop="unit" label="单位" width="60" align="center" />
                <el-table-column prop="quantity" label="调拨数量" width="100" align="right">
                  <template #default="{ row }">
                    <span class="text-primary">{{ row.quantity }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="fromLocation" label="调出库位" width="100" />
                <el-table-column prop="toLocation" label="调入库位" width="100" />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="transferNo" label="调拨单号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.transferNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="fromWarehouse" label="调出仓库" width="110" />
        <el-table-column prop="toWarehouse" label="调入仓库" width="110" />
        <el-table-column prop="itemCount" label="物料种类" width="90" align="center">
          <template #default="{ row }">{{ row.items?.length || 0 }} 种</template>
        </el-table-column>
        <el-table-column prop="totalQty" label="总数量" width="90" align="right">
          <template #default="{ row }">
            <span class="text-primary">{{ row.items?.reduce((s, i) => s + i.quantity, 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="transferType" label="调拨类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.transferType === 'urgent' ? 'danger' : 'info'" size="small">
              {{ row.transferType === 'urgent' ? '紧急' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="80" />
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleApprove(row)">审批</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleCancel(row)">取消</el-button>
            </template>
            <template v-else-if="row.status === 'approved'">
              <el-button type="warning" link size="small" @click="handleShip(row)">发货</el-button>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
            </template>
            <template v-else-if="row.status === 'inTransit'">
              <el-button type="success" link size="small" @click="handleReceive(row)">收货</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="950px" :close-on-click-modal="false" top="3vh">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="调拨单号" prop="transferNo">
              <el-input v-model="formData.transferNo" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调出仓库" prop="fromWarehouse">
              <el-select v-model="formData.fromWarehouse" placeholder="请选择" style="width:100%" 
                @change="handleFromWarehouseChange">
                <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调入仓库" prop="toWarehouse">
              <el-select v-model="formData.toWarehouse" placeholder="请选择" style="width:100%">
                <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" 
                  :disabled="w === formData.fromWarehouse" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调拨类型">
              <el-radio-group v-model="formData.transferType">
                <el-radio label="normal">普通</el-radio>
                <el-radio label="urgent">紧急</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="调拨原因">
              <el-input v-model="formData.reason" placeholder="请输入调拨原因" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 调拨明细 -->
        <el-divider content-position="left">调拨明细</el-divider>
        <div class="items-header">
          <el-button type="primary" size="small" @click="addItem">
            <el-icon><Plus /></el-icon> 添加物料
          </el-button>
          <el-button type="success" size="small" @click="selectMaterial">
            <el-icon><Search /></el-icon> 选择物料
          </el-button>
        </div>
        <el-table :data="formData.items" border size="small" style="margin-top:12px">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="materialCode" label="物料编码" width="130">
            <template #default="{ row }">
              <el-input v-model="row.materialCode" placeholder="编码" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="materialName" label="物料名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.materialName" placeholder="名称" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="spec" label="规格" width="100">
            <template #default="{ row }">
              <el-input v-model="row.spec" placeholder="规格" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="70">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="单位" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="availableQty" label="可用库存" width="90" align="right">
            <template #default="{ row }">{{ row.availableQty || '-' }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="调拨数量" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="row.availableQty || 9999" size="small" style="width:90px" />
            </template>
          </el-table-column>
          <el-table-column prop="fromLocation" label="调出库位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.fromLocation" placeholder="库位" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="toLocation" label="调入库位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.toLocation" placeholder="库位" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeItem($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-row :gutter="20" style="margin-top:16px">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
        <el-button type="success" @click="submitAndApprove" :loading="submitting">保存并提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog v-model="approveDialogVisible" title="调拨审批" width="500px">
      <el-form label-width="80px">
        <el-form-item label="调拨单号">{{ currentRow?.transferNo }}</el-form-item>
        <el-form-item label="调出仓库">{{ currentRow?.fromWarehouse }}</el-form-item>
        <el-form-item label="调入仓库">{{ currentRow?.toWarehouse }}</el-form-item>
        <el-form-item label="物料数量">{{ currentRow?.items?.length }} 种，共 {{ currentRow?.items?.reduce((s, i) => s + i.quantity, 0) }} 件</el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveRemark" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">驳回</el-button>
        <el-button type="success" @click="doApprove">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download, Printer, Delete, Switch, Van, CircleCheck, Box } from '@element-plus/icons-vue'

// ========== 常量 ==========
const warehouses = ['MRO主仓库', '原料仓库', '成品仓库', '备件仓库', '暂存仓库']

// ========== 状态 ==========
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建调拨单')
const approveDialogVisible = ref(false)
const approveRemark = ref('')
const currentRow = ref(null)
const formRef = ref(null)

const allData = ref([])
const tableData = ref([])
const selectedRows = ref([])

const searchForm = reactive({
  transferNo: '', fromWarehouse: '', toWarehouse: '', status: '', dateRange: []
})
const pagination = reactive({ page: 1, size: 20, total: 0 })

const formData = reactive({
  id: null,
  transferNo: '',
  fromWarehouse: '',
  toWarehouse: '',
  transferType: 'normal',
  reason: '',
  remark: '',
  items: []
})

const formRules = {
  fromWarehouse: [{ required: true, message: '请选择调出仓库', trigger: 'change' }],
  toWarehouse: [{ required: true, message: '请选择调入仓库', trigger: 'change' }]
}

// 统计
const stats = computed(() => {
  const data = allData.value
  return {
    pending: data.filter(d => d.status === 'pending').length,
    inTransit: data.filter(d => d.status === 'inTransit').length,
    completed: data.filter(d => d.status === 'completed').length,
    totalQty: data.filter(d => d.status === 'completed').reduce((s, d) => s + d.items.reduce((ss, i) => ss + i.quantity, 0), 0)
  }
})

// ========== 辅助函数 ==========
const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'primary', inTransit: '', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}
const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已审批', inTransit: '调拨中', completed: '已完成', cancelled: '已取消' }
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
    if (searchForm.transferNo && !fuzzyMatch(item.transferNo, searchForm.transferNo)) return false
    if (searchForm.fromWarehouse && item.fromWarehouse !== searchForm.fromWarehouse) return false
    if (searchForm.toWarehouse && item.toWarehouse !== searchForm.toWarehouse) return false
    if (searchForm.status && item.status !== searchForm.status) return false
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
const generateNo = () => `TRF${new Date().toISOString().slice(0,10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`

const handleAdd = () => {
  Object.assign(formData, {
    id: null, transferNo: generateNo(), fromWarehouse: '', toWarehouse: '',
    transferType: 'normal', reason: '', remark: '', items: []
  })
  dialogTitle.value = '新建调拨单'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, { ...row, items: [...row.items] })
  dialogTitle.value = '编辑调拨单'
  dialogVisible.value = true
}

const handleView = (row) => {
  Object.assign(formData, { ...row, items: [...row.items] })
  dialogTitle.value = '调拨单详情'
  dialogVisible.value = true
}

const handleFromWarehouseChange = () => {
  if (formData.toWarehouse === formData.fromWarehouse) {
    formData.toWarehouse = ''
  }
}

const addItem = () => {
  formData.items.push({
    materialCode: '', materialName: '', spec: '', unit: '个',
    quantity: 1, availableQty: 100, fromLocation: '', toLocation: ''
  })
}

const selectMaterial = () => {
  // 模拟选择物料
  formData.items.push({
    materialCode: `MAT${String(Date.now()).slice(-6)}`,
    materialName: '示例物料',
    spec: '标准规格',
    unit: '个',
    quantity: 10,
    availableQty: 200,
    fromLocation: 'A-01-01',
    toLocation: ''
  })
  ElMessage.success('已添加物料')
}

const removeItem = (index) => { formData.items.splice(index, 1) }

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    if (formData.items.length === 0) return ElMessage.warning('请添加调拨物料')
    
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
    if (formData.items.length === 0) return ElMessage.warning('请添加调拨物料')
    
    submitting.value = true
    setTimeout(() => {
      allData.value.unshift({
        ...formData,
        id: Date.now(),
        status: 'approved',
        applicant: '张三',
        createTime: new Date().toLocaleString()
      })
      ElMessage.success('保存并提交成功')
      dialogVisible.value = false
      submitting.value = false
      handleSearch()
    }, 400)
  })
}

const handleApprove = (row) => {
  currentRow.value = row
  approveRemark.value = ''
  approveDialogVisible.value = true
}

const doApprove = () => {
  currentRow.value.status = 'approved'
  ElMessage.success('审批通过')
  approveDialogVisible.value = false
  handleSearch()
}

const doReject = () => {
  currentRow.value.status = 'cancelled'
  ElMessage.warning('已驳回')
  approveDialogVisible.value = false
  handleSearch()
}

const handleCancel = (row) => {
  ElMessageBox.confirm('确定取消该调拨单？', '确认', { type: 'warning' })
    .then(() => {
      row.status = 'cancelled'
      ElMessage.success('已取消')
      handleSearch()
    }).catch(() => {})
}

const handleShip = (row) => {
  ElMessageBox.confirm('确认发货？', '确认')
    .then(() => {
      row.status = 'inTransit'
      ElMessage.success('已发货')
      handleSearch()
    }).catch(() => {})
}

const handleReceive = (row) => {
  ElMessageBox.confirm('确认收货？', '确认')
    .then(() => {
      row.status = 'completed'
      ElMessage.success('收货完成')
      handleSearch()
    }).catch(() => {})
}

// ========== 导出打印 ==========
const handleExport = () => {
  const data = selectedRows.value.length ? selectedRows.value : tableData.value
  if (!data.length) return ElMessage.warning('无数据')
  
  const csv = [
    ['调拨单号', '调出仓库', '调入仓库', '物料数', '总数量', '状态', '申请人', '申请时间'].join(','),
    ...data.map(r => [
      r.transferNo, r.fromWarehouse, r.toWarehouse, r.items.length,
      r.items.reduce((s, i) => s + i.quantity, 0),
      getStatusText(r.status), r.applicant, r.createTime
    ].join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `调拨单_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const handlePrint = () => {
  ElMessage.info('批量打印')
}

const handlePrintOne = (row) => {
  const itemsHtml = row.items.map((item, idx) => `
    <tr><td>${idx+1}</td><td>${item.materialCode}</td><td>${item.materialName}</td>
    <td>${item.spec}</td><td>${item.unit}</td><td>${item.quantity}</td>
    <td>${item.fromLocation}</td><td>${item.toLocation}</td></tr>
  `).join('')
  
  const html = `
    <h2 style="text-align:center">调拨单</h2>
    <p>单号：${row.transferNo} | 调出：${row.fromWarehouse} | 调入：${row.toWarehouse}</p>
    <p>申请人：${row.applicant} | 时间：${row.createTime}</p>
    <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px">
      <tr style="background:#f5f5f5"><th>序号</th><th>物料编码</th><th>物料名称</th><th>规格</th><th>单位</th><th>数量</th><th>调出库位</th><th>调入库位</th></tr>
      ${itemsHtml}
    </table>
    <p style="margin-top:30px">调出签字：__________ &nbsp;&nbsp; 调入签字：__________</p>
  `
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>调拨单</title></head><body style="padding:20px">${html}</body></html>`)
  win.document.close()
  win.print()
}

// ========== 数据生成 ==========
const generateMockData = (count = 50) => {
  const statuses = ['pending', 'approved', 'inTransit', 'completed', 'completed', 'completed']
  const data = []
  for (let i = 1; i <= count; i++) {
    const from = warehouses[i % warehouses.length]
    const to = warehouses[(i + 1) % warehouses.length]
    const itemCount = Math.floor(Math.random() * 5) + 1
    const items = Array(itemCount).fill(null).map((_, j) => ({
      materialCode: `MAT${String(i * 10 + j).padStart(6, '0')}`,
      materialName: `物料名称${i}-${j + 1}`,
      spec: '标准规格',
      unit: '个',
      quantity: Math.floor(Math.random() * 50) + 10,
      fromLocation: `A-${String(j + 1).padStart(2, '0')}-01`,
      toLocation: `B-${String(j + 1).padStart(2, '0')}-01`
    }))
    
    data.push({
      id: i,
      transferNo: `TRF2024${String(12 - (i % 12)).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      fromWarehouse: from,
      toWarehouse: to,
      transferType: i % 5 === 0 ? 'urgent' : 'normal',
      status: statuses[i % statuses.length],
      reason: '库存调配',
      applicant: ['张三', '李四', '王五'][i % 3],
      createTime: `2024-${String(12 - (i % 12)).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
      items
    })
  }
  return data
}

// ========== 初始化 ==========
onMounted(() => {
  allData.value = generateMockData(50)
  handleSearch()
})
</script>

<style scoped>
.transfer-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.stat-row { margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; padding: 0 16px; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); color: white; }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); color: white; }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); color: white; }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); color: white; }
.stat-icon { margin-right: 16px; opacity: 0.9; }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }

.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }

.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.expand-detail { padding: 12px 24px; background: #fafafa; }
.text-primary { color: #409eff; font-weight: 600; }

.items-header { display: flex; gap: 10px; }
</style>
