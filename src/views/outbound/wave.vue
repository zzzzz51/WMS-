<template>
  <div class="wave-manage">
    <h2>波次管理</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card blue"><div class="stat-value">{{ stats.pending }}</div><div class="stat-label">待下发</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card orange"><div class="stat-value">{{ stats.picking }}</div><div class="stat-label">拣货中</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card green"><div class="stat-value">{{ stats.completed }}</div><div class="stat-label">已完成</div></el-card></el-col>
      <el-col :xs="12" :sm="6"><el-card shadow="never" class="stat-card purple"><div class="stat-value">{{ stats.orderCount }}</div><div class="stat-label">今日订单</div></el-card></el-col>
    </el-row>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="波次号"><el-input v-model="searchForm.waveNo" placeholder="模糊搜索" clearable style="width:140px" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="待下发" value="pending" /><el-option label="拣货中" value="picking" /><el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">创建波次</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="waveNo" label="波次号" width="150"><template #default="{row}"><el-link type="primary">{{ row.waveNo }}</el-link></template></el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="80" align="right" />
        <el-table-column prop="skuCount" label="SKU数" width="80" align="right" />
        <el-table-column prop="totalQty" label="总数量" width="90" align="right"><template #default="{row}"><span class="text-primary">{{ row.totalQty }}</span></template></el-table-column>
        <el-table-column label="拣货进度" width="150">
          <template #default="{row}">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="150" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{row}">
            <el-button v-if="row.status==='pending'" type="primary" link size="small" @click="handleRelease(row)">下发</el-button>
            <el-button v-if="row.status==='picking'" type="success" link size="small" @click="handleComplete(row)">完成</el-button>
            <el-button type="info" link size="small">详情</el-button>
            <el-button type="warning" link size="small" @click="handlePrint(row)">打印</el-button>
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
const searchForm = reactive({ waveNo: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const stats = computed(() => ({ pending: allData.value.filter(d => d.status === 'pending').length, picking: allData.value.filter(d => d.status === 'picking').length, completed: allData.value.filter(d => d.status === 'completed').length, orderCount: allData.value.reduce((s, d) => s + d.orderCount, 0) }))
const getStatusType = s => ({ pending: 'info', picking: 'warning', completed: 'success' }[s] || 'info')
const getStatusText = s => ({ pending: '待下发', picking: '拣货中', completed: '已完成' }[s] || s)
const handleSearch = () => { let r = allData.value.filter(i => { if (searchForm.waveNo && !i.waveNo.includes(searchForm.waveNo)) return false; if (searchForm.status && i.status !== searchForm.status) return false; return true }); pagination.total = r.length; tableData.value = r.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size) }
const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); handleSearch() }
const handleCreate = () => ElMessage.info('创建波次')
const handleRelease = row => { row.status = 'picking'; row.progress = 0; ElMessage.success('波次已下发'); handleSearch() }
const handleComplete = row => { row.status = 'completed'; row.progress = 100; ElMessage.success('波次已完成'); handleSearch() }
const handlePrint = row => ElMessage.info('打印波次单')
const handleExport = () => ElMessage.success('导出成功')
onMounted(() => {
  allData.value = Array(20).fill(null).map((_, i) => ({ id: i + 1, waveNo: `WAV2025${String(i).padStart(6, '0')}`, orderCount: Math.floor(Math.random() * 10) + 3, skuCount: Math.floor(Math.random() * 20) + 5, totalQty: Math.floor(Math.random() * 200) + 50, progress: i % 3 === 2 ? 100 : i % 3 === 1 ? Math.floor(Math.random() * 80) + 10 : 0, status: ['pending', 'picking', 'completed'][i % 3], createTime: `2025-01-${String((i % 9) + 1).padStart(2, '0')} ${String(8 + (i % 10))}:00` }))
  handleSearch()
})
</script>
<style scoped>
.wave-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
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
.text-primary { color: #409eff; font-weight: 600; }
</style>
