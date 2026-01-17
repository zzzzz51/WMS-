<template>
  <div class="operation-log">
    <h2>操作日志</h2>
    
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="操作人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operType" placeholder="全部" clearable style="width: 120px">
            <el-option label="新增" value="create" />
            <el-option label="修改" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="查询" value="query" />
            <el-option label="导出" value="export" />
            <el-option label="登录" value="login" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="searchForm.module" placeholder="全部" clearable style="width: 120px">
            <el-option label="库存管理" value="inventory" />
            <el-option label="入库管理" value="inbound" />
            <el-option label="出库管理" value="outbound" />
            <el-option label="系统管理" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
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
          <el-button type="warning" @click="handleExport">
            <el-icon><Download /></el-icon> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="logList" v-loading="loading" border stripe
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="operTime" label="操作时间" width="170" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="operType" label="操作类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeStyle(row.operType)" size="small">{{ getTypeText(row.operType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="100" />
        <el-table-column prop="content" label="操作内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next" background />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

const loading = ref(false)
const searchForm = reactive({ operator: '', operType: '', module: '', dateRange: [] })
const pagination = reactive({ page: 1, size: 20, total: 1000 })
const logList = ref([])

const getTypeStyle = (type) => ({ create: 'success', update: 'warning', delete: 'danger', query: 'info', export: 'primary', login: '' }[type] || 'info')
const getTypeText = (type) => ({ create: '新增', update: '修改', delete: '删除', query: '查询', export: '导出', login: '登录' }[type] || '')

const generateData = () => {
  const types = ['create', 'update', 'delete', 'query', 'export', 'login']
  const modules = ['库存管理', '入库管理', '出库管理', '系统管理']
  const operators = ['admin', '张三', '李四', '王五']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    data.push({
      id: i,
      operTime: `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      operator: operators[Math.floor(Math.random() * operators.length)],
      operType: type,
      module: modules[Math.floor(Math.random() * modules.length)],
      content: type === 'login' ? '用户登录系统' : type === 'create' ? '新增物料MAT000123' : type === 'update' ? '修改库存数据' : type === 'delete' ? '删除记录ID:123' : type === 'query' ? '查询库存列表' : '导出库存报表',
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      status: Math.random() > 0.05 ? 1 : 0
    })
  }
  
  return data.sort((a, b) => b.operTime.localeCompare(a.operTime))
}

const loadData = () => {
  loading.value = true
  setTimeout(() => { logList.value = generateData(); loading.value = false }, 500)
}

const handleSearch = () => { loadData() }
const handleReset = () => { Object.assign(searchForm, { operator: '', operType: '', module: '', dateRange: [] }); loadData() }
const handleExport = () => { ElMessage.success('正在导出...') }
const handleDetail = (row) => { ElMessage.info(`查看日志详情: ${row.id}`) }

onMounted(() => { loadData() })
</script>

<style scoped>
.operation-log { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
