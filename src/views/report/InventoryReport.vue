<template>
  <div class="inventory-report">
    <h2>库存报表</h2>
    
    <!-- 筛选条件 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="报表类型">
          <el-select v-model="filterForm.reportType" style="width: 160px" @change="loadData">
            <el-option label="库存汇总报表" value="summary" />
            <el-option label="库存明细报表" value="detail" />
            <el-option label="库存金额报表" value="value" />
            <el-option label="库龄分析报表" value="age" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="filterForm.warehouse" placeholder="全部" clearable style="width: 140px">
            <el-option label="MRO主仓库" value="WH001" />
            <el-option label="原料仓库" value="WH002" />
            <el-option label="成品仓库" value="WH003" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料分类">
          <el-select v-model="filterForm.category" placeholder="全部" clearable style="width: 120px">
            <el-option label="A类" value="A" />
            <el-option label="B类" value="B" />
            <el-option label="C类" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计日期">
          <el-date-picker v-model="filterForm.date" type="date" placeholder="选择日期" style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button type="success" @click="handleExportExcel">
            <el-icon><Download /></el-icon> 导出Excel
          </el-button>
          <el-button type="warning" @click="handlePrint">
            <el-icon><Printer /></el-icon> 打印
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 汇总数据 -->
    <el-row :gutter="16" class="summary-cards">
      <el-col :xs="12" :sm="6">
        <div class="summary-card blue">
          <div class="summary-label">SKU总数</div>
          <div class="summary-value">{{ summary.skuCount }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card green">
          <div class="summary-label">库存总量</div>
          <div class="summary-value">{{ summary.totalQty }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card orange">
          <div class="summary-label">库存总金额</div>
          <div class="summary-value">¥{{ summary.totalValue }}万</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card purple">
          <div class="summary-label">库位利用率</div>
          <div class="summary-value">{{ summary.utilization }}%</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header><span class="card-title">各仓库库存分布</span></template>
          <div class="chart-container">
            <div class="bar-chart">
              <div class="bar-item" v-for="item in warehouseData" :key="item.name">
                <span class="bar-name">{{ item.name }}</span>
                <div class="bar-bg">
                  <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
                </div>
                <span class="bar-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header><span class="card-title">ABC分类库存金额</span></template>
          <div class="chart-container">
            <div class="pie-chart-wrapper">
              <div class="pie-chart" style="background: conic-gradient(#f56c6c 0deg 252deg, #e6a23c 252deg 324deg, #909399 324deg 360deg);"></div>
              <div class="pie-legend">
                <div class="legend-item"><span class="dot" style="background: #f56c6c;"></span>A类: ¥880万 (70%)</div>
                <div class="legend-item"><span class="dot" style="background: #e6a23c;"></span>B类: ¥252万 (20%)</div>
                <div class="legend-item"><span class="dot" style="background: #909399;"></span>C类: ¥126万 (10%)</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 报表数据 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ getReportTitle() }}</span>
          <el-tag type="info">共 {{ reportData.length }} 条</el-tag>
        </div>
      </template>
      <el-table :data="reportData" v-loading="loading" border stripe show-summary
        :summary-method="getSummaries"
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="ABC" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="right" />
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="totalValue" label="库存金额" width="120" align="right">
          <template #default="{ row }">
            <span class="text-primary">¥{{ row.totalValue.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stockAge" label="库龄(天)" width="90" align="right" v-if="filterForm.reportType === 'age'">
          <template #default="{ row }">
            <span :class="getAgeClass(row.stockAge)">{{ row.stockAge }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next" background />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Printer } from '@element-plus/icons-vue'

const loading = ref(false)

const filterForm = reactive({
  reportType: 'summary',
  warehouse: '',
  category: '',
  date: new Date()
})

const summary = reactive({
  skuCount: 1560,
  totalQty: '258万',
  totalValue: 1258,
  utilization: 75
})

const warehouseData = ref([
  { name: 'MRO主仓库', value: 580, percent: 46, color: '#409eff' },
  { name: '原料仓库', value: 350, percent: 28, color: '#67c23a' },
  { name: '成品仓库', value: 230, percent: 18, color: '#e6a23c' },
  { name: '暂存仓库', value: 98, percent: 8, color: '#909399' }
])

const pagination = reactive({ page: 1, size: 20, total: 500 })
const reportData = ref([])

const getCategoryType = (cat) => ({ A: 'danger', B: 'warning', C: 'info' }[cat] || 'info')
const getAgeClass = (age) => age > 180 ? 'text-danger' : age > 90 ? 'text-warning' : ''

const getReportTitle = () => {
  const titles = { summary: '库存汇总报表', detail: '库存明细报表', value: '库存金额报表', age: '库龄分析报表' }
  return titles[filterForm.reportType] || '库存报表'
}

const generateData = () => {
  const categories = ['A', 'B', 'C']
  const warehouses = ['MRO主仓库', '原料仓库', '成品仓库']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const unitPrice = Math.floor(Math.random() * 500) + 10
    const quantity = Math.floor(Math.random() * 500) + 50
    
    data.push({
      id: i,
      materialCode: `MAT${String(i).padStart(6, '0')}`,
      materialName: `物料名称${i}`,
      category: categories[i % 3],
      warehouse: warehouses[i % 3],
      quantity,
      unit: ['个', '件', '箱', 'kg'][i % 4],
      unitPrice,
      totalValue: unitPrice * quantity,
      stockAge: Math.floor(Math.random() * 300) + 10
    })
  }
  return data.sort((a, b) => b.totalValue - a.totalValue)
}

const loadData = () => {
  loading.value = true
  setTimeout(() => { reportData.value = generateData(); loading.value = false }, 500)
}

const getSummaries = ({ columns, data }) => {
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    if (column.property === 'quantity') {
      sums[index] = data.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()
    } else if (column.property === 'totalValue') {
      sums[index] = '¥' + data.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()
    } else {
      sums[index] = ''
    }
  })
  return sums
}

const handleExportExcel = () => { ElMessage.success('正在导出Excel...') }
const handlePrint = () => { ElMessage.success('正在打印报表...') }

onMounted(() => { loadData() })
</script>

<style scoped>
.inventory-report { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding: 16px 16px 0; }

.summary-cards { margin-bottom: 16px; }
.summary-card { padding: 20px; border-radius: 8px; color: white; text-align: center; }
.summary-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.summary-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.summary-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.summary-card.purple { background: linear-gradient(135deg, #9b59b6, #a66bbe); }
.summary-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.summary-value { font-size: 28px; font-weight: bold; }

.chart-row { margin-bottom: 16px; }
.chart-container { height: 250px; padding: 20px; }
.card-title { font-size: 16px; font-weight: 600; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.bar-chart { height: 100%; display: flex; flex-direction: column; justify-content: space-around; }
.bar-item { display: flex; align-items: center; gap: 12px; }
.bar-name { width: 80px; font-size: 13px; text-align: right; }
.bar-bg { flex: 1; height: 24px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.bar-value { width: 50px; font-size: 14px; font-weight: 600; }

.pie-chart-wrapper { display: flex; align-items: center; justify-content: center; gap: 40px; height: 100%; }
.pie-chart { width: 160px; height: 160px; border-radius: 50%; }
.pie-legend { display: flex; flex-direction: column; gap: 12px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.text-primary { color: #409eff; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
