<template>
  <div class="requisition-manage">
    <h2>领用管理</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card blue"><div class="stat-value">{{ stats.pending }}</div><div class="stat-label">待审批</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card orange"><div class="stat-value">{{ stats.approved }}</div><div class="stat-label">待出库</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card green"><div class="stat-value">{{ stats.completed }}</div><div class="stat-label">今日完成</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card purple"><div class="stat-value">{{ stats.totalQty }}</div><div class="stat-label">今日领用量</div></el-card></el-col>
    </el-row>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="领用单号"><el-input v-model="searchForm.reqNo" placeholder="模糊搜索" clearable style="width:140px" /></el-form-item>
        <el-form-item label="申请人"><el-input v-model="searchForm.applicant" placeholder="申请人" clearable style="width:100px" /></el-form-item>
        <el-form-item label="部门"><el-input v-model="searchForm.department" placeholder="部门" clearable style="width:100px" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="待审批" value="pending" /><el-option label="已审批" value="approved" /><el-option label="已出库" value="completed" /><el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">新建领用申请</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="expand">
          <template #default="{row}">
            <div style="padding:16px">
              <el-table :data="row.items" size="small" border>
                <el-table-column prop="materialCode" label="物料编码" width="130" />
                <el-table-column prop="materialName" label="物料名称" min-width="150" />
                <el-table-column prop="quantity" label="申请数量" width="90" align="right" />
                <el-table-column prop="issueQty" label="已发数量" width="90" align="right"><template #default="{row:item}"><span class="text-success">{{ item.issueQty || 0 }}</span></template></el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" width="50" />
        <el-table-column prop="reqNo" label="领用单号" width="150"><template #default="{row}"><el-link type="primary">{{ row.reqNo }}</el-link></template></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="80" />
        <el-table-column prop="department" label="部门" width="90" />
        <el-table-column prop="itemCount" label="物料数" width="80" align="right" />
        <el-table-column prop="totalQty" label="总数量" width="80" align="right" />
        <el-table-column prop="purpose" label="用途" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="applyDate" label="申请日期" width="100" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{row}">
            <el-button v-if="row.status==='pending'" type="success" link size="small" @click="handleApprove(row)">审批</el-button>
            <el-button v-if="row.status==='pending'" type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
            <el-button v-if="row.status==='approved'" type="primary" link size="small" @click="handleIssue(row)">出库</el-button>
            <el-button type="info" link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" :total="pagination.total" layout="total,prev,pager,next" background @current-change="handleSearch" />
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
const allData = ref([]), tableData = ref([])
const searchForm = reactive({ reqNo: '', applicant: '', department: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const stats = computed(() => ({ pending: allData.value.filter(d => d.status === 'pending').length, approved: allData.value.filter(d => d.status === 'approved').length, completed: allData.value.filter(d => d.status === 'completed').length, totalQty: allData.value.filter(d => d.status === 'completed').reduce((s, d) => s + d.totalQty, 0) }))
const getStatusType = s => ({ pending: 'warning', approved: 'primary', completed: 'success', rejected: 'danger' }[s] || 'info')
const getStatusText = s => ({ pending: '待审批', approved: '待出库', completed: '已出库', rejected: '已驳回' }[s] || s)
const handleSearch = () => { let r = allData.value.filter(i => { if (searchForm.reqNo && !i.reqNo.includes(searchForm.reqNo)) return false; if (searchForm.applicant && !i.applicant.includes(searchForm.applicant)) return false; if (searchForm.department && !i.department.includes(searchForm.department)) return false; if (searchForm.status && i.status !== searchForm.status) return false; return true }); pagination.total = r.length; tableData.value = r.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size) }
const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); handleSearch() }
const handleCreate = () => ElMessage.info('新建领用申请')
const handleApprove = row => { row.status = 'approved'; ElMessage.success('审批通过'); handleSearch() }
const handleReject = row => { row.status = 'rejected'; ElMessage.warning('已驳回'); handleSearch() }
const handleIssue = row => { row.status = 'completed'; row.items.forEach(i => i.issueQty = i.quantity); ElMessage.success('出库完成'); handleSearch() }
const handleExport = () => ElMessage.success('导出成功')
onMounted(() => {
  const depts = ['生产部', '研发部', '设备部', '质量部']
  allData.value = Array(30).fill(null).map((_, i) => ({ id: i + 1, reqNo: `REQ2025${String(i).padStart(6, '0')}`, applicant: ['张三', '李四', '王五'][i % 3], department: depts[i % 4], itemCount: (i % 4) + 1, totalQty: Math.floor(Math.random() * 50) + 10, purpose: '生产使用', status: ['pending', 'approved', 'completed', 'rejected'][i % 4], applyDate: `2025-01-${String((i % 9) + 1).padStart(2, '0')}`, items: Array((i % 4) + 1).fill(null).map((_, j) => ({ materialCode: `MAT00${j + 1}`, materialName: `物料${j + 1}`, quantity: Math.floor(Math.random() * 20) + 5, issueQty: i % 4 === 2 ? Math.floor(Math.random() * 20) + 5 : 0 })) }))
  handleSearch()
})
</script>
<style scoped>
.requisition-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-success { color: #67c23a; font-weight: 600; }
</style>
