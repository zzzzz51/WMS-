<template>
  <div class="scrap-manage">
    <h2>报废管理</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待审批</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">待处置</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red">
          <div class="stat-value">¥{{ (stats.totalValue / 10000).toFixed(1) }}万</div>
          <div class="stat-label">报废总额</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="报废单号">
          <el-input v-model="searchForm.scrapNo" placeholder="模糊搜索" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="物料">
          <el-input v-model="searchForm.material" placeholder="编码/名称" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="报废原因">
          <el-select v-model="searchForm.reason" placeholder="全部" clearable style="width:110px">
            <el-option label="过期失效" value="expired" />
            <el-option label="损坏报废" value="damaged" />
            <el-option label="技术淘汰" value="obsolete" />
            <el-option label="质量不合格" value="unqualified" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已处置" value="disposed" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新建报废申请</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <el-button @click="handlePrint" :disabled="!selectedRows.length">打印</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe @selection-change="rows => selectedRows = rows"
        :header-cell-style="{background:'#f5f7fa'}">
        <el-table-column type="selection" width="45" />
        <el-table-column type="expand">
          <template #default="{row}">
            <div class="expand-content">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="报废原因">{{ getReasonText(row.reason) }}</el-descriptions-item>
                <el-descriptions-item label="申请人">{{ row.applicant }}</el-descriptions-item>
                <el-descriptions-item label="申请日期">{{ row.applyDate }}</el-descriptions-item>
                <el-descriptions-item label="审批人">{{ row.approver || '-' }}</el-descriptions-item>
                <el-descriptions-item label="审批日期">{{ row.approveDate || '-' }}</el-descriptions-item>
                <el-descriptions-item label="处置方式">{{ row.disposeMethod || '-' }}</el-descriptions-item>
                <el-descriptions-item label="报废说明" :span="3">{{ row.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="scrapNo" label="报废单号" width="150">
          <template #default="{row}"><el-link type="primary">{{ row.scrapNo }}</el-link></template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="quantity" label="报废数量" width="90" align="right">
          <template #default="{row}"><span class="text-danger">{{ row.quantity }}</span></template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="90" align="right">
          <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="报废金额" width="100" align="right">
          <template #default="{row}"><span class="text-danger">¥{{ (row.quantity * row.price).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getReasonType(row.reason)" size="small">{{ getReasonText(row.reason) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyDate" label="申请日期" width="100" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{row}">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="handleApprove(row)">审批</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleCancel(row)">取消</el-button>
            </template>
            <template v-else-if="row.status === 'approved'">
              <el-button type="warning" link size="small" @click="handleDispose(row)">处置</el-button>
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
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20,50,100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
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
            <el-form-item label="报废数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="price">
              <el-input-number v-model="formData.price" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报废原因" prop="reason">
              <el-select v-model="formData.reason" placeholder="选择原因" style="width:100%">
                <el-option label="过期失效" value="expired" />
                <el-option label="损坏报废" value="damaged" />
                <el-option label="技术淘汰" value="obsolete" />
                <el-option label="质量不合格" value="unqualified" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报废金额">
              <el-input :value="'¥' + (formData.quantity * formData.price).toFixed(2)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="报废说明">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="详细说明报废原因" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="附件">
              <el-upload action="#" :auto-upload="false" :file-list="formData.attachments" multiple>
                <el-button type="primary" plain>上传附件</el-button>
                <template #tip><div class="el-upload__tip">支持图片、PDF等，最大10MB</div></template>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="报废审批" width="500px">
      <el-form label-width="100px">
        <el-form-item label="报废单号">{{ currentRow?.scrapNo }}</el-form-item>
        <el-form-item label="物料">{{ currentRow?.materialName }}</el-form-item>
        <el-form-item label="报废数量">{{ currentRow?.quantity }}</el-form-item>
        <el-form-item label="报废金额">¥{{ ((currentRow?.quantity || 0) * (currentRow?.price || 0)).toFixed(2) }}</el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveRemark" type="textarea" :rows="3" placeholder="审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">驳回</el-button>
        <el-button type="success" @click="doApprove">通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="disposeDialogVisible" title="报废处置" width="500px">
      <el-form label-width="100px">
        <el-form-item label="报废单号">{{ currentRow?.scrapNo }}</el-form-item>
        <el-form-item label="物料">{{ currentRow?.materialName }}</el-form-item>
        <el-form-item label="处置方式">
          <el-select v-model="disposeMethod" placeholder="选择处置方式" style="width:100%">
            <el-option label="销毁处理" value="destroy" />
            <el-option label="回收利用" value="recycle" />
            <el-option label="变卖处理" value="sell" />
            <el-option label="其他方式" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="回收金额" v-if="disposeMethod === 'sell' || disposeMethod === 'recycle'">
          <el-input-number v-model="recycleAmount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="处置备注">
          <el-input v-model="disposeRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disposeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDispose">确认处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)
const dialogTitle = ref('新建报废申请')
const approveDialogVisible = ref(false)
const disposeDialogVisible = ref(false)
const formRef = ref(null)
const currentRow = ref(null)
const approveRemark = ref('')
const disposeMethod = ref('')
const disposeRemark = ref('')
const recycleAmount = ref(0)
const selectedRows = ref([])

const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ scrapNo: '', material: '', reason: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const formData = reactive({
  materialCode: '', materialName: '', quantity: 1, price: 0, reason: '', remark: '', attachments: []
})
const formRules = {
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请选择报废原因', trigger: 'change' }]
}

const stats = computed(() => ({
  pending: allData.value.filter(d => d.status === 'pending').length,
  approved: allData.value.filter(d => d.status === 'approved').length,
  completed: allData.value.filter(d => d.status === 'completed' || d.status === 'disposed').length,
  totalValue: allData.value.filter(d => d.status === 'completed').reduce((s, d) => s + d.quantity * d.price, 0)
}))

const getReasonType = r => ({ expired: 'warning', damaged: 'danger', obsolete: 'info', unqualified: '' }[r] || 'info')
const getReasonText = r => ({ expired: '过期失效', damaged: '损坏报废', obsolete: '技术淘汰', unqualified: '质量不合格' }[r] || r)
const getStatusType = s => ({ pending: 'warning', approved: 'primary', disposed: '', completed: 'success', cancelled: 'info' }[s] || 'info')
const getStatusText = s => ({ pending: '待审批', approved: '待处置', disposed: '已处置', completed: '已完成', cancelled: '已取消' }[s] || s)

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.scrapNo, searchForm.scrapNo)) return false
    if (searchForm.material && !fuzzyMatch(item.materialCode, searchForm.material) && !fuzzyMatch(item.materialName, searchForm.material)) return false
    if (searchForm.reason && item.reason !== searchForm.reason) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); pagination.page = 1; handleSearch() }

const handleAdd = () => {
  Object.assign(formData, { materialCode: '', materialName: '', quantity: 1, price: 0, reason: '', remark: '', attachments: [] })
  dialogTitle.value = '新建报废申请'
  dialogVisible.value = true
}

const handleEdit = row => { Object.assign(formData, { ...row }); dialogTitle.value = '编辑报废申请'; dialogVisible.value = true }
const handleView = row => { Object.assign(formData, { ...row }); dialogTitle.value = '报废详情'; dialogVisible.value = true }

const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (!valid) return
    allData.value.unshift({
      ...formData, id: Date.now(),
      scrapNo: `SCR${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`,
      applyDate: new Date().toISOString().slice(0, 10),
      applicant: '张三', status: 'pending'
    })
    ElMessage.success('提交成功')
    dialogVisible.value = false
    handleSearch()
  })
}

const handleApprove = row => { currentRow.value = row; approveRemark.value = ''; approveDialogVisible.value = true }
const doApprove = () => { currentRow.value.status = 'approved'; currentRow.value.approver = '李四'; currentRow.value.approveDate = new Date().toISOString().slice(0, 10); ElMessage.success('审批通过'); approveDialogVisible.value = false; handleSearch() }
const doReject = () => { currentRow.value.status = 'cancelled'; ElMessage.warning('已驳回'); approveDialogVisible.value = false; handleSearch() }

const handleDispose = row => { currentRow.value = row; disposeMethod.value = ''; disposeRemark.value = ''; recycleAmount.value = 0; disposeDialogVisible.value = true }
const confirmDispose = () => { currentRow.value.status = 'completed'; currentRow.value.disposeMethod = disposeMethod.value; currentRow.value.disposeDate = new Date().toISOString().slice(0, 10); ElMessage.success('处置完成'); disposeDialogVisible.value = false; handleSearch() }

const handleCancel = row => { ElMessageBox.confirm('确定取消该报废申请？', '确认').then(() => { row.status = 'cancelled'; ElMessage.success('已取消'); handleSearch() }).catch(() => {}) }

const handleExport = () => {
  const csv = [['报废单号', '物料编码', '物料名称', '数量', '单价', '金额', '原因', '状态', '申请日期'].join(','),
    ...tableData.value.map(r => [r.scrapNo, r.materialCode, r.materialName, r.quantity, r.price, (r.quantity * r.price).toFixed(2), getReasonText(r.reason), getStatusText(r.status), r.applyDate].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `报废记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const handlePrint = () => ElMessage.info('批量打印')
const handlePrintOne = row => {
  const html = `<h2 style="text-align:center">报废处理单</h2>
    <p>单号：${row.scrapNo} | 申请日期：${row.applyDate}</p>
    <table border="1" cellpadding="8" style="width:100%;border-collapse:collapse">
      <tr><td width="100">物料编码</td><td>${row.materialCode}</td><td width="100">物料名称</td><td>${row.materialName}</td></tr>
      <tr><td>报废数量</td><td>${row.quantity}</td><td>单价</td><td>¥${row.price}</td></tr>
      <tr><td>报废金额</td><td colspan="3">¥${(row.quantity * row.price).toFixed(2)}</td></tr>
      <tr><td>报废原因</td><td colspan="3">${getReasonText(row.reason)}</td></tr>
      <tr><td>说明</td><td colspan="3">${row.remark || '-'}</td></tr>
    </table>
    <p style="margin-top:30px">申请人：__________ 审批人：__________ 日期：__________</p>`
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>报废单</title></head><body style="padding:20px">${html}</body></html>`)
  win.document.close()
  win.print()
}

onMounted(() => {
  const reasons = ['expired', 'damaged', 'obsolete', 'unqualified']
  const statuses = ['pending', 'approved', 'disposed', 'completed', 'completed']
  allData.value = Array(50).fill(null).map((_, i) => ({
    id: i + 1, scrapNo: `SCR2024${String(i).padStart(6, '0')}`,
    materialCode: `MAT00${(i % 10) + 1}`, materialName: `物料名称${i + 1}`,
    quantity: (i % 20) + 1, price: Math.floor(Math.random() * 500) + 50,
    reason: reasons[i % 4], status: statuses[i % 5],
    applicant: ['张三', '李四', '王五'][i % 3],
    applyDate: `2024-12-${String((i % 28) + 1).padStart(2, '0')}`,
    approver: i % 5 > 0 ? '李四' : null, approveDate: i % 5 > 0 ? '2024-12-20' : null,
    remark: '设备老化无法使用'
  }))
  handleSearch()
})
</script>

<style scoped>
.scrap-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }
.expand-content { padding: 16px; background: #fafafa; }
</style>
