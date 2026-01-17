<template>
  <div class="stock-warning">
    <h2>库存预警</h2>
    
    <!-- 预警统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red" @click="filterByType('low')">
          <div class="stat-icon"><el-icon :size="32"><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.lowStock }}</div>
            <div class="stat-label">低库存预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange" @click="filterByType('overstock')">
          <div class="stat-icon"><el-icon :size="32"><Box /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overStock }}</div>
            <div class="stat-label">超储预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple" @click="filterByType('stagnant')">
          <div class="stat-icon"><el-icon :size="32"><Clock /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.stagnant }}</div>
            <div class="stat-label">呆滞预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue" @click="filterByType('expiring')">
          <div class="stat-icon"><el-icon :size="32"><Timer /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.expiring }}</div>
            <div class="stat-label">临期预警</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警类型切换 -->
    <el-card shadow="never" class="filter-card">
      <el-radio-group v-model="warningType" @change="handleSearch">
        <el-radio-button label="">全部预警 ({{ stats.total }})</el-radio-button>
        <el-radio-button label="low">低库存 ({{ stats.lowStock }})</el-radio-button>
        <el-radio-button label="overstock">超储 ({{ stats.overStock }})</el-radio-button>
        <el-radio-button label="stagnant">呆滞 ({{ stats.stagnant }})</el-radio-button>
        <el-radio-button label="expiring">临期 ({{ stats.expiring }})</el-radio-button>
      </el-radio-group>
      <div class="filter-right">
        <el-input v-model="searchKeyword" placeholder="搜索物料编码/名称" clearable style="width:200px" @keyup.enter="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="success" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <!-- 预警列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe :header-cell-style="{background:'#f5f7fa'}"
        :row-class-name="getRowClass">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130">
          <template #default="{row}"><el-link type="primary">{{ row.materialCode }}</el-link></template>
        </el-table-column>
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="currentStock" label="当前库存" width="100" align="right">
          <template #default="{row}">
            <span :class="getStockClass(row)">{{ row.currentStock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="safetyStock" label="安全库存" width="90" align="right" />
        <el-table-column prop="maxStock" label="最大库存" width="90" align="right" />
        <el-table-column label="库存状态" width="120" align="center">
          <template #default="{row}">
            <el-progress :percentage="getStockPercent(row)" :color="getProgressColor(row)" 
              :stroke-width="8" :show-text="false" style="width:80px;display:inline-block" />
            <span style="margin-left:5px;font-size:12px">{{ getStockPercent(row) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="warningType" label="预警类型" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getWarningType(row.warningType)" size="small" effect="dark">
              {{ getWarningText(row.warningType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastOutDate" label="最后出库" width="100" />
        <el-table-column prop="expiryDate" label="有效期至" width="100">
          <template #default="{row}">
            <span :class="{'text-danger': isExpiringSoon(row)}">{{ row.expiryDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="建议操作" width="120" align="center">
          <template #default="{row}">
            <span class="suggest-action">{{ getSuggestAction(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleAction(row)">
              {{ getActionText(row) }}
            </el-button>
            <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="handleIgnore(row)">忽略</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20,50,100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="库存详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="物料编码">{{ currentRow?.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentRow?.materialName }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentRow?.currentStock }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ currentRow?.safetyStock }}</el-descriptions-item>
        <el-descriptions-item label="最大库存">{{ currentRow?.maxStock }}</el-descriptions-item>
        <el-descriptions-item label="补货点">{{ currentRow?.reorderPoint }}</el-descriptions-item>
        <el-descriptions-item label="采购周期">{{ currentRow?.leadTime }}天</el-descriptions-item>
        <el-descriptions-item label="日均消耗">{{ currentRow?.avgDailyUsage }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">
          <el-tag :type="getWarningType(currentRow?.warningType)" size="small">{{ getWarningText(currentRow?.warningType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="建议操作">{{ getSuggestAction(currentRow) }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top:20px">
        <h4>近期出入库记录</h4>
        <el-table :data="stockHistory" size="small" border max-height="200">
          <el-table-column prop="date" label="日期" width="100" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{row}">
              <el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">{{ row.type === 'in' ? '入库' : '出库' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="balance" label="结余" width="80" align="right" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAction(currentRow)">{{ getActionText(currentRow) }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Box, Clock, Timer, Search } from '@element-plus/icons-vue'

const warningType = ref('')
const searchKeyword = ref('')
const detailDialogVisible = ref(false)
const currentRow = ref(null)

const allData = ref([])
const tableData = ref([])
const stockHistory = ref([])
const pagination = reactive({ page: 1, size: 20, total: 0 })

const stats = computed(() => ({
  lowStock: allData.value.filter(d => d.warningType === 'low').length,
  overStock: allData.value.filter(d => d.warningType === 'overstock').length,
  stagnant: allData.value.filter(d => d.warningType === 'stagnant').length,
  expiring: allData.value.filter(d => d.warningType === 'expiring').length,
  total: allData.value.length
}))

const getWarningType = t => ({ low: 'danger', overstock: 'warning', stagnant: 'info', expiring: 'primary' }[t] || 'info')
const getWarningText = t => ({ low: '低库存', overstock: '超储', stagnant: '呆滞', expiring: '临期' }[t] || t)

const getStockClass = row => {
  if (row.currentStock < row.safetyStock) return 'text-danger'
  if (row.currentStock > row.maxStock) return 'text-warning'
  return ''
}

const getStockPercent = row => {
  if (!row.maxStock) return 0
  return Math.min(100, Math.round(row.currentStock / row.maxStock * 100))
}

const getProgressColor = row => {
  const percent = getStockPercent(row)
  if (percent < 30) return '#f56c6c'
  if (percent > 90) return '#e6a23c'
  return '#67c23a'
}

const getRowClass = ({ row }) => {
  if (row.warningType === 'low') return 'warning-row-danger'
  if (row.warningType === 'overstock') return 'warning-row-warning'
  return ''
}

const isExpiringSoon = row => {
  if (!row.expiryDate) return false
  const days = (new Date(row.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  return days <= 30
}

const getSuggestAction = row => {
  if (!row) return ''
  switch (row.warningType) {
    case 'low': return `建议补货 ${Math.max(0, row.safetyStock * 2 - row.currentStock)} 件`
    case 'overstock': return `建议调拨 ${row.currentStock - row.maxStock} 件`
    case 'stagnant': return '建议促销或调拨'
    case 'expiring': return '建议优先出库'
    default: return '-'
  }
}

const getActionText = row => {
  if (!row) return '处理'
  switch (row.warningType) {
    case 'low': return '申请采购'
    case 'overstock': return '申请调拨'
    case 'stagnant': return '处置申请'
    case 'expiring': return '优先出库'
    default: return '处理'
  }
}

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (warningType.value && item.warningType !== warningType.value) return false
    if (searchKeyword.value && !fuzzyMatch(item.materialCode, searchKeyword.value) && !fuzzyMatch(item.materialName, searchKeyword.value)) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const filterByType = type => { warningType.value = type; handleSearch() }

const handleDetail = row => {
  currentRow.value = row
  stockHistory.value = Array(10).fill(null).map((_, i) => ({
    date: `2024-12-${String(28 - i).padStart(2, '0')}`,
    type: i % 3 === 0 ? 'in' : 'out',
    quantity: Math.floor(Math.random() * 50) + 10,
    balance: row.currentStock + (i * 10),
    remark: i % 3 === 0 ? '采购入库' : '生产领用'
  }))
  detailDialogVisible.value = true
}

const handleAction = row => {
  ElMessageBox.confirm(`确认${getActionText(row)}？`, '确认').then(() => {
    ElMessage.success(`已创建${getActionText(row)}单`)
  }).catch(() => {})
}

const handleIgnore = row => {
  ElMessageBox.confirm('确认忽略此预警？', '确认').then(() => {
    allData.value = allData.value.filter(d => d.id !== row.id)
    ElMessage.success('已忽略')
    handleSearch()
  }).catch(() => {})
}

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '仓库', '当前库存', '安全库存', '最大库存', '预警类型', '建议操作'].join(','),
    ...tableData.value.map(r => [r.materialCode, r.materialName, r.warehouse, r.currentStock, r.safetyStock, r.maxStock, getWarningText(r.warningType), getSuggestAction(r)].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `库存预警_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const warehouses = ['MRO主仓', '原料仓', '成品仓']
  const types = ['low', 'low', 'overstock', 'stagnant', 'expiring']
  allData.value = Array(80).fill(null).map((_, i) => {
    const wType = types[i % 5]
    const safetyStock = Math.floor(Math.random() * 100) + 50
    const maxStock = safetyStock * 3
    let currentStock
    if (wType === 'low') currentStock = Math.floor(safetyStock * 0.5)
    else if (wType === 'overstock') currentStock = maxStock + Math.floor(Math.random() * 100)
    else currentStock = safetyStock + Math.floor(Math.random() * 50)
    
    return {
      id: i + 1, materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `物料名称${i + 1}`, warehouse: warehouses[i % 3],
      currentStock, safetyStock, maxStock,
      reorderPoint: Math.floor(safetyStock * 0.8),
      leadTime: Math.floor(Math.random() * 14) + 3,
      avgDailyUsage: Math.floor(Math.random() * 10) + 1,
      warningType: wType,
      lastOutDate: wType === 'stagnant' ? '2024-09-15' : `2024-12-${String((i % 20) + 1).padStart(2, '0')}`,
      expiryDate: wType === 'expiring' ? '2025-02-01' : null
    }
  })
  handleSearch()
})
</script>

<style scoped>
.stock-warning { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.stat-row { margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; padding: 0 20px; color: white; cursor: pointer; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-3px); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-icon { margin-right: 16px; }
.stat-value { font-size: 32px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { display: flex; align-items: center; justify-content: space-between; }
.filter-right { display: flex; gap: 12px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
.suggest-action { color: #409eff; font-size: 12px; }
:deep(.warning-row-danger) { background: #fef0f0 !important; }
:deep(.warning-row-warning) { background: #fdf6ec !important; }
</style>
