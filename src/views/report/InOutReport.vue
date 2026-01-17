<template>
  <div class="inout-report">
    <h2>出入库报表</h2>
    
    <!-- 筛选条件 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="日期范围">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 260px" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="filterForm.warehouse" placeholder="全部" clearable style="width: 140px">
            <el-option label="MRO主仓库" value="WH001" />
            <el-option label="原料仓库" value="WH002" />
            <el-option label="成品仓库" value="WH003" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计维度">
          <el-select v-model="filterForm.dimension" style="width: 120px" @change="loadData">
            <el-option label="按日" value="day" />
            <el-option label="按周" value="week" />
            <el-option label="按月" value="month" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 汇总数据 -->
    <el-row :gutter="16" class="summary-cards">
      <el-col :xs="12" :sm="6">
        <div class="summary-card green">
          <div class="summary-icon"><el-icon><Download /></el-icon></div>
          <div class="summary-content">
            <div class="summary-label">入库总数</div>
            <div class="summary-value">{{ summary.inboundQty }}</div>
            <div class="summary-trend up">
              <el-icon><Top /></el-icon> 较上期 +12%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card orange">
          <div class="summary-icon"><el-icon><Upload /></el-icon></div>
          <div class="summary-content">
            <div class="summary-label">出库总数</div>
            <div class="summary-value">{{ summary.outboundQty }}</div>
            <div class="summary-trend up">
              <el-icon><Top /></el-icon> 较上期 +8%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card blue">
          <div class="summary-icon"><el-icon><Money /></el-icon></div>
          <div class="summary-content">
            <div class="summary-label">入库金额</div>
            <div class="summary-value">¥{{ summary.inboundValue }}万</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="summary-card purple">
          <div class="summary-icon"><el-icon><Money /></el-icon></div>
          <div class="summary-content">
            <div class="summary-label">出库金额</div>
            <div class="summary-value">¥{{ summary.outboundValue }}万</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card shadow="never" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">出入库趋势</span>
          <el-radio-group v-model="chartType" size="small">
            <el-radio-button label="qty">数量</el-radio-button>
            <el-radio-button label="value">金额</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="chart-container">
        <div class="line-chart">
          <div class="chart-legend">
            <span class="legend-item"><span class="dot inbound"></span> 入库</span>
            <span class="legend-item"><span class="dot outbound"></span> 出库</span>
          </div>
          <div class="chart-body">
            <div class="y-axis">
              <span>{{ chartType === 'qty' ? '500' : '50万' }}</span>
              <span>{{ chartType === 'qty' ? '400' : '40万' }}</span>
              <span>{{ chartType === 'qty' ? '300' : '30万' }}</span>
              <span>{{ chartType === 'qty' ? '200' : '20万' }}</span>
              <span>{{ chartType === 'qty' ? '100' : '10万' }}</span>
              <span>0</span>
            </div>
            <div class="chart-area">
              <svg width="100%" height="200" viewBox="0 0 700 200">
                <!-- 入库线 -->
                <polyline :points="inboundPoints" fill="none" stroke="#67c23a" stroke-width="3"/>
                <g>
                  <circle v-for="(point, i) in inboundData" :key="'in'+i" 
                    :cx="i * 100 + 50" :cy="200 - point.value * 0.4" r="5" fill="#67c23a"/>
                </g>
                <!-- 出库线 -->
                <polyline :points="outboundPoints" fill="none" stroke="#e6a23c" stroke-width="3"/>
                <g>
                  <circle v-for="(point, i) in outboundData" :key="'out'+i" 
                    :cx="i * 100 + 50" :cy="200 - point.value * 0.4" r="5" fill="#e6a23c"/>
                </g>
              </svg>
              <div class="x-axis">
                <span v-for="(item, i) in trendLabels" :key="i">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 明细数据 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">出入库明细</span>
          <el-radio-group v-model="detailType" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="in">入库</el-radio-button>
            <el-radio-button label="out">出库</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="detailData" v-loading="loading" border stripe
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'warning'" size="small">
              {{ row.type === 'in' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="单据号" width="160" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="90" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'in' ? 'text-success' : 'text-warning'">
              {{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="operator" label="操作人" width="90" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Upload, Money, Top } from '@element-plus/icons-vue'

const loading = ref(false)
const chartType = ref('qty')
const detailType = ref('all')

const filterForm = reactive({
  dateRange: [],
  warehouse: '',
  dimension: 'day'
})

const summary = reactive({
  inboundQty: '12,580',
  outboundQty: '10,230',
  inboundValue: 256,
  outboundValue: 198
})

const trendLabels = ref(['12-01', '12-02', '12-03', '12-04', '12-05', '12-06', '12-07'])
const inboundData = ref([
  { value: 320 }, { value: 350 }, { value: 280 }, { value: 420 }, { value: 380 }, { value: 450 }, { value: 400 }
])
const outboundData = ref([
  { value: 280 }, { value: 310 }, { value: 350 }, { value: 300 }, { value: 420 }, { value: 380 }, { value: 360 }
])

const inboundPoints = computed(() => {
  return inboundData.value.map((p, i) => `${i * 100 + 50},${200 - p.value * 0.4}`).join(' ')
})

const outboundPoints = computed(() => {
  return outboundData.value.map((p, i) => `${i * 100 + 50},${200 - p.value * 0.4}`).join(' ')
})

const pagination = reactive({ page: 1, size: 20, total: 500 })
const detailData = ref([])

const generateDetailData = () => {
  const types = ['in', 'out']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const type = types[i % 2]
    const quantity = Math.floor(Math.random() * 100) + 10
    const unitPrice = Math.floor(Math.random() * 200) + 20
    
    data.push({
      id: i,
      date: `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      type,
      orderNo: type === 'in' ? `RCV2024${String(i).padStart(6, '0')}` : `REQ2024${String(i).padStart(6, '0')}`,
      materialCode: `MAT${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
      materialName: `物料名称${i}`,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      warehouse: ['MRO主仓库', '原料仓库', '成品仓库'][i % 3],
      operator: ['张三', '李四', '王五'][i % 3]
    })
  }
  return data.sort((a, b) => b.date.localeCompare(a.date))
}

const loadData = () => {
  loading.value = true
  setTimeout(() => { detailData.value = generateDetailData(); loading.value = false }, 500)
}

const handleExport = () => { ElMessage.success('正在导出报表...') }

onMounted(() => { loadData() })
</script>

<style scoped>
.inout-report { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding: 16px 16px 0; }

.summary-cards { margin-bottom: 16px; }
.summary-card { display: flex; padding: 20px; border-radius: 8px; color: white; }
.summary-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.summary-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.summary-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.summary-card.purple { background: linear-gradient(135deg, #9b59b6, #a66bbe); }
.summary-icon { font-size: 40px; margin-right: 16px; opacity: 0.8; }
.summary-label { font-size: 14px; opacity: 0.9; }
.summary-value { font-size: 26px; font-weight: bold; margin: 4px 0; }
.summary-trend { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 4px; }
.summary-trend.up { color: #b7eb8f; }

.chart-card { margin-bottom: 16px; }
.chart-container { height: 280px; padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; }

.line-chart { height: 100%; }
.chart-legend { display: flex; gap: 24px; margin-bottom: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.inbound { background: #67c23a; }
.dot.outbound { background: #e6a23c; }

.chart-body { display: flex; height: 220px; }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; padding-right: 8px; font-size: 11px; color: #999; width: 40px; text-align: right; }
.chart-area { flex: 1; position: relative; }
.x-axis { display: flex; justify-content: space-around; margin-top: 8px; font-size: 12px; color: #666; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.text-success { color: #67c23a; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
</style>
