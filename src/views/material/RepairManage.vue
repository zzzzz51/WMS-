<template>
  <div class="repair-manage">
    <h2>维修管理</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待维修</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.repairing }}</div>
          <div class="stat-label">维修中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-value">¥{{ (stats.totalCost / 1000).toFixed(1) }}K</div>
          <div class="stat-label">本月费用</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="维修单号">
          <el-input v-model="searchForm.repairNo" placeholder="模糊搜索" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="设备/物料">
          <el-input v-model="searchForm.equipment" placeholder="编码/名称" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="维修类型">
          <el-select v-model="searchForm.repairType" placeholder="全部" clearable style="width:110px">
            <el-option label="故障维修" value="breakdown" />
            <el-option label="预防保养" value="preventive" />
            <el-option label="定期检修" value="scheduled" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="待维修" value="pending" />
            <el-option label="维修中" value="repairing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="searchForm.urgency" placeholder="全部" clearable style="width:100px">
            <el-option label="紧急" value="urgent" />
            <el-option label="一般" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新建维修单</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe :header-cell-style="{background:'#f5f7fa'}">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="repairNo" label="维修单号" width="150">
          <template #default="{row}"><el-link type="primary" @click="handleView(row)">{{ row.repairNo }}</el-link></template>
        </el-table-column>
        <el-table-column prop="equipmentCode" label="设备编码" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="repairType" label="维修类型" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getTypeTag(row.repairType)" size="small">{{ getTypeText(row.repairType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="urgency" label="紧急程度" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getUrgencyType(row.urgency)" size="small" effect="dark">{{ getUrgencyText(row.urgency) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="faultDesc" label="故障描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="repairCost" label="维修费用" width="100" align="right">
          <template #default="{row}">
            <span v-if="row.repairCost">¥{{ row.repairCost.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="technician" label="维修人" width="80" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reportDate" label="报修日期" width="100" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <template v-if="row.status === 'pending'">
              <el-button type="primary" link size="small" @click="handleStart(row)">开始维修</el-button>
              <el-button type="info" link size="small" @click="handleEdit(row)">编辑</el-button>
            </template>
            <template v-else-if="row.status === 'repairing'">
              <el-button type="success" link size="small" @click="handleComplete(row)">完成</el-button>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
            </template>
            <template v-else>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="handlePrint(row)">打印</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" :total="pagination.total"
          layout="total, prev, pager, next" background @current-change="handleSearch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="750px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="equipmentCode">
              <el-input v-model="formData.equipmentCode" placeholder="设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentName">
              <el-input v-model="formData.equipmentName" placeholder="设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修类型" prop="repairType">
              <el-select v-model="formData.repairType" placeholder="选择类型" style="width:100%">
                <el-option label="故障维修" value="breakdown" />
                <el-option label="预防保养" value="preventive" />
                <el-option label="定期检修" value="scheduled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度" prop="urgency">
              <el-select v-model="formData.urgency" placeholder="选择紧急程度" style="width:100%">
                <el-option label="紧急" value="urgent" />
                <el-option label="一般" value="normal" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报修人">
              <el-input v-model="formData.reporter" placeholder="报修人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="formData.phone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="故障描述" prop="faultDesc">
              <el-input v-model="formData.faultDesc" type="textarea" :rows="3" placeholder="详细描述故障情况" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成维修" width="600px">
      <el-form label-width="100px">
        <el-form-item label="维修单号">{{ currentRow?.repairNo }}</el-form-item>
        <el-form-item label="设备">{{ currentRow?.equipmentName }}</el-form-item>
        <el-form-item label="维修结果">
          <el-select v-model="completeData.result" placeholder="选择维修结果" style="width:200px">
            <el-option label="维修完成" value="fixed" />
            <el-option label="无法修复" value="unfixable" />
            <el-option label="需更换" value="replace" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修费用">
          <el-input-number v-model="completeData.cost" :min="0" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="更换配件">
          <el-input v-model="completeData.parts" placeholder="更换的配件清单" />
        </el-form-item>
        <el-form-item label="维修说明">
          <el-input v-model="completeData.remark" type="textarea" :rows="3" placeholder="维修过程说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)
const dialogTitle = ref('新建维修单')
const completeDialogVisible = ref(false)
const formRef = ref(null)
const currentRow = ref(null)

const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ repairNo: '', equipment: '', repairType: '', status: '', urgency: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const formData = reactive({
  equipmentCode: '', equipmentName: '', repairType: '', urgency: 'normal',
  reporter: '', phone: '', faultDesc: ''
})
const completeData = reactive({ result: 'fixed', cost: 0, parts: '', remark: '' })
const formRules = {
  equipmentCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
  equipmentName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  repairType: [{ required: true, message: '请选择维修类型', trigger: 'change' }],
  urgency: [{ required: true, message: '请选择紧急程度', trigger: 'change' }],
  faultDesc: [{ required: true, message: '请描述故障情况', trigger: 'blur' }]
}

const stats = computed(() => ({
  pending: allData.value.filter(d => d.status === 'pending').length,
  repairing: allData.value.filter(d => d.status === 'repairing').length,
  completed: allData.value.filter(d => d.status === 'completed').length,
  totalCost: allData.value.filter(d => d.status === 'completed').reduce((s, d) => s + (d.repairCost || 0), 0)
}))

const getTypeTag = t => ({ breakdown: 'danger', preventive: 'warning', scheduled: 'info' }[t] || 'info')
const getTypeText = t => ({ breakdown: '故障维修', preventive: '预防保养', scheduled: '定期检修' }[t] || t)
const getUrgencyType = u => ({ urgent: 'danger', normal: 'warning', low: 'info' }[u] || 'info')
const getUrgencyText = u => ({ urgent: '紧急', normal: '一般', low: '低' }[u] || u)
const getStatusType = s => ({ pending: 'warning', repairing: 'primary', completed: 'success' }[s] || 'info')
const getStatusText = s => ({ pending: '待维修', repairing: '维修中', completed: '已完成' }[s] || s)

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.repairNo, searchForm.repairNo)) return false
    if (searchForm.equipment && !fuzzyMatch(item.equipmentCode, searchForm.equipment) && !fuzzyMatch(item.equipmentName, searchForm.equipment)) return false
    if (searchForm.repairType && item.repairType !== searchForm.repairType) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    if (searchForm.urgency && item.urgency !== searchForm.urgency) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); pagination.page = 1; handleSearch() }

const handleAdd = () => {
  Object.assign(formData, { equipmentCode: '', equipmentName: '', repairType: '', urgency: 'normal', reporter: '', phone: '', faultDesc: '' })
  dialogTitle.value = '新建维修单'
  dialogVisible.value = true
}

const handleEdit = row => { Object.assign(formData, { ...row }); dialogTitle.value = '编辑维修单'; dialogVisible.value = true }
const handleView = row => { Object.assign(formData, { ...row }); dialogTitle.value = '维修详情'; dialogVisible.value = true }

const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (!valid) return
    allData.value.unshift({
      ...formData, id: Date.now(),
      repairNo: `RPR${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`,
      reportDate: new Date().toISOString().slice(0, 10),
      status: 'pending', technician: null, repairCost: null
    })
    ElMessage.success('提交成功')
    dialogVisible.value = false
    handleSearch()
  })
}

const handleStart = row => {
  ElMessageBox.prompt('请输入维修人员姓名', '开始维修').then(({ value }) => {
    row.status = 'repairing'
    row.technician = value || '技术员'
    row.startDate = new Date().toISOString().slice(0, 10)
    ElMessage.success('已开始维修')
    handleSearch()
  }).catch(() => {})
}

const handleComplete = row => {
  currentRow.value = row
  Object.assign(completeData, { result: 'fixed', cost: 0, parts: '', remark: '' })
  completeDialogVisible.value = true
}

const confirmComplete = () => {
  currentRow.value.status = 'completed'
  currentRow.value.repairCost = completeData.cost
  currentRow.value.repairResult = completeData.result
  currentRow.value.completeDate = new Date().toISOString().slice(0, 10)
  currentRow.value.repairRemark = completeData.remark
  ElMessage.success('维修完成')
  completeDialogVisible.value = false
  handleSearch()
}

const handleExport = () => {
  const csv = [['维修单号', '设备编码', '设备名称', '类型', '紧急程度', '状态', '维修费用', '维修人', '报修日期'].join(','),
    ...tableData.value.map(r => [r.repairNo, r.equipmentCode, r.equipmentName, getTypeText(r.repairType), getUrgencyText(r.urgency), getStatusText(r.status), r.repairCost || 0, r.technician || '-', r.reportDate].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `维修记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

const handlePrint = row => {
  const html = `<h2 style="text-align:center">维修工单</h2>
    <table border="1" cellpadding="8" style="width:100%;border-collapse:collapse">
      <tr><td width="100">维修单号</td><td>${row.repairNo}</td><td width="100">报修日期</td><td>${row.reportDate}</td></tr>
      <tr><td>设备编码</td><td>${row.equipmentCode}</td><td>设备名称</td><td>${row.equipmentName}</td></tr>
      <tr><td>维修类型</td><td>${getTypeText(row.repairType)}</td><td>紧急程度</td><td>${getUrgencyText(row.urgency)}</td></tr>
      <tr><td>故障描述</td><td colspan="3">${row.faultDesc}</td></tr>
      <tr><td>维修人员</td><td>${row.technician || '-'}</td><td>维修费用</td><td>¥${row.repairCost || 0}</td></tr>
    </table>
    <p style="margin-top:30px">报修人签字：__________ 维修人签字：__________ 验收签字：__________</p>`
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>维修工单</title></head><body style="padding:20px">${html}</body></html>`)
  win.document.close()
  win.print()
}

onMounted(() => {
  const types = ['breakdown', 'preventive', 'scheduled']
  const urgencies = ['urgent', 'normal', 'low']
  const statuses = ['pending', 'repairing', 'completed', 'completed']
  allData.value = Array(40).fill(null).map((_, i) => ({
    id: i + 1, repairNo: `RPR2024${String(i).padStart(6, '0')}`,
    equipmentCode: `EQP00${(i % 10) + 1}`, equipmentName: `设备${i + 1}`,
    repairType: types[i % 3], urgency: urgencies[i % 3], status: statuses[i % 4],
    faultDesc: '设备运行异常需要检修',
    reporter: ['张三', '李四', '王五'][i % 3], phone: '13800138000',
    technician: i % 4 > 0 ? '技术员A' : null,
    repairCost: i % 4 === 3 ? Math.floor(Math.random() * 2000) + 200 : null,
    reportDate: `2024-12-${String((i % 28) + 1).padStart(2, '0')}`
  }))
  handleSearch()
})
</script>

<style scoped>
.repair-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
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
</style>
