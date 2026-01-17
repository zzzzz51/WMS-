<template>
  <div class="location-manage">
    <h2>库位管理</h2>
    
    <!-- 统计 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <el-statistic title="库位总数" :value="stats.total" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <el-statistic title="已占用" :value="stats.occupied" value-style="color: #409eff" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <el-statistic title="空闲" :value="stats.free" value-style="color: #67c23a" />
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <el-statistic title="利用率" :value="stats.utilization" suffix="%" />
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部仓库" clearable style="width: 140px">
            <el-option label="MRO主仓库" value="WH001" />
            <el-option label="原料仓库" value="WH002" />
            <el-option label="成品仓库" value="WH003" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区">
          <el-select v-model="searchForm.area" placeholder="全部库区" clearable style="width: 120px">
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="库位类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="存储位" value="storage" />
            <el-option label="拣货位" value="picking" />
            <el-option label="暂存位" value="staging" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="空闲" value="free" />
            <el-option label="占用" value="occupied" />
            <el-option label="锁定" value="locked" />
          </el-select>
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
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增库位
      </el-button>
      <el-button type="success" @click="handleBatchAdd">
        <el-icon><CopyDocument /></el-icon> 批量生成
      </el-button>
      <el-button type="warning" @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
      <el-button type="info" @click="handleViewMap">
        <el-icon><MapLocation /></el-icon> 库位图
      </el-button>
    </div>

    <!-- 库位列表 -->
    <el-card shadow="never">
      <el-table :data="locationList" v-loading="loading" border stripe
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="locationCode" label="库位编码" width="130">
          <template #default="{ row }">
            <el-link type="primary">{{ row.locationCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="area" label="库区" width="80" align="center" />
        <el-table-column prop="row" label="排" width="60" align="center" />
        <el-table-column prop="column" label="列" width="60" align="center" />
        <el-table-column prop="layer" label="层" width="60" align="center" />
        <el-table-column prop="type" label="库位类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="存放物料" width="130" />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="capacity" label="容量" width="80" align="right" />
        <el-table-column prop="abcClass" label="ABC" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="getAbcType(row.abcClass)" effect="dark" size="small" v-if="row.abcClass">{{ row.abcClass }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleLock(row)" v-if="row.status !== 'locked'">锁定</el-button>
            <el-button type="success" link size="small" @click="handleUnlock(row)" v-if="row.status === 'locked'">解锁</el-button>
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

    <!-- 批量生成对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量生成库位" width="500px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="仓库">
          <el-select v-model="batchForm.warehouse" style="width: 100%">
            <el-option label="MRO主仓库" value="WH001" />
            <el-option label="原料仓库" value="WH002" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区前缀">
          <el-input v-model="batchForm.areaPrefix" placeholder="如: A" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="排数">
              <el-input-number v-model="batchForm.rows" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="列数">
              <el-input-number v-model="batchForm.columns" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="层数">
              <el-input-number v-model="batchForm.layers" :min="1" :max="9" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="库位类型">
          <el-select v-model="batchForm.type" style="width: 100%">
            <el-option label="存储位" value="storage" />
            <el-option label="拣货位" value="picking" />
          </el-select>
        </el-form-item>
        <el-alert type="info" :closable="false">
          将生成 {{ batchForm.rows * batchForm.columns * batchForm.layers }} 个库位
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, CopyDocument, Download, MapLocation } from '@element-plus/icons-vue'

const loading = ref(false)
const batchDialogVisible = ref(false)

const stats = reactive({ total: 1200, occupied: 850, free: 350, utilization: 71 })
const searchForm = reactive({ warehouse: '', area: '', type: '', status: '' })
const batchForm = reactive({ warehouse: 'WH001', areaPrefix: 'D', rows: 10, columns: 5, layers: 4, type: 'storage' })
const pagination = reactive({ page: 1, size: 20, total: 500 })
const locationList = ref([])

const getTypeText = (type) => ({ storage: '存储位', picking: '拣货位', staging: '暂存位' }[type] || '')
const getStatusType = (status) => ({ free: 'success', occupied: 'primary', locked: 'danger' }[status] || 'info')
const getStatusText = (status) => ({ free: '空闲', occupied: '占用', locked: '锁定' }[status] || '')
const getAbcType = (abc) => ({ A: 'danger', B: 'warning', C: 'info' }[abc] || 'info')

const generateData = () => {
  const types = ['storage', 'picking', 'staging']
  const statuses = ['free', 'occupied', 'locked']
  const abcClasses = ['A', 'B', 'C', '']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const area = String.fromCharCode(65 + (i % 3))
    const row = Math.floor(i / 10) + 1
    const col = (i % 10) + 1
    const layer = (i % 4) + 1
    const status = statuses[Math.floor(Math.random() * 3)]
    
    data.push({
      id: i,
      locationCode: `${area}-${String(row).padStart(2, '0')}-${String(col).padStart(2, '0')}-${layer}`,
      warehouse: ['MRO主仓库', '原料仓库', '成品仓库'][i % 3],
      area,
      row,
      column: col,
      layer,
      type: types[Math.floor(Math.random() * 3)],
      status,
      materialCode: status === 'occupied' ? `MAT${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}` : '',
      quantity: status === 'occupied' ? Math.floor(Math.random() * 100) + 10 : 0,
      capacity: 200,
      abcClass: abcClasses[Math.floor(Math.random() * 4)]
    })
  }
  return data
}

const loadData = () => {
  loading.value = true
  setTimeout(() => { locationList.value = generateData(); loading.value = false }, 500)
}

const handleSearch = () => { loadData() }
const handleReset = () => { Object.assign(searchForm, { warehouse: '', area: '', type: '', status: '' }); loadData() }

const handleAdd = () => { ElMessage.info('新增库位') }
const handleBatchAdd = () => { batchDialogVisible.value = true }
const handleExport = () => { ElMessage.success('正在导出...') }
const handleViewMap = () => { ElMessage.info('查看库位图') }

const handleEdit = (row) => { ElMessage.info(`编辑库位: ${row.locationCode}`) }
const handleLock = (row) => { ElMessage.warning(`库位 ${row.locationCode} 已锁定`) }
const handleUnlock = (row) => { ElMessage.success(`库位 ${row.locationCode} 已解锁`) }
const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除？').then(() => { ElMessage.success('删除成功') }).catch(() => {})
}

const submitBatch = () => {
  const count = batchForm.rows * batchForm.columns * batchForm.layers
  ElMessage.success(`成功生成 ${count} 个库位`)
  batchDialogVisible.value = false
  loadData()
}

onMounted(() => { loadData() })
</script>

<style scoped>
.location-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.stat-cards { margin-bottom: 16px; }
.stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
