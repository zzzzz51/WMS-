<template>
  <div class="requisition-rate">
    <h2>领用及时率分析</h2>

    <!-- 筛选条件 -->
    <el-card shadow="never" class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="统计周期">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="领用部门">
          <el-select v-model="filterForm.department" placeholder="全部部门" clearable style="width: 140px">
            <el-option label="生产一部" value="生产一部" />
            <el-option label="生产二部" value="生产二部" />
            <el-option label="维修部" value="维修部" />
            <el-option label="研发部" value="研发部" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="filterForm.warehouse" placeholder="全部仓库" clearable style="width: 120px">
            <el-option label="WH01" value="WH01" />
            <el-option label="WH02" value="WH02" />
            <el-option label="WH03" value="WH03" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">整体及时率</span>
          <el-tag :type="kpiData.overallRate >= 95 ? 'success' : kpiData.overallRate >= 85 ? 'warning' : 'danger'" size="small">
            {{ kpiData.overallRate >= 95 ? '优秀' : kpiData.overallRate >= 85 ? '良好' : '待改进' }}
          </el-tag>
        </div>
        <div class="kpi-value" :class="getRateClass(kpiData.overallRate)">{{ kpiData.overallRate }}%</div>
        <div class="kpi-trend">
          <span :class="kpiData.overallTrend > 0 ? 'trend-up' : 'trend-down'">
            {{ kpiData.overallTrend > 0 ? '↑' : '↓' }} {{ Math.abs(kpiData.overallTrend) }}%
          </span>
          较上期
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">领用单总数</span>
        </div>
        <div class="kpi-value text-primary">{{ kpiData.totalOrders }}</div>
        <div class="kpi-detail">及时: {{ kpiData.onTimeOrders }} | 超期: {{ kpiData.overdueOrders }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">平均响应时间</span>
        </div>
        <div class="kpi-value text-primary">{{ kpiData.avgResponseTime }}h</div>
        <div class="kpi-detail">目标: ≤4h</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">平均完成时间</span>
        </div>
        <div class="kpi-value text-primary">{{ kpiData.avgCompleteTime }}h</div>
        <div class="kpi-detail">目标: ≤8h</div>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 及时率趋势图 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>及时率趋势</span>
              <el-radio-group v-model="trendType" size="small">
                <el-radio-button label="day">按日</el-radio-button>
                <el-radio-button label="week">按周</el-radio-button>
                <el-radio-button label="month">按月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 部门及时率排名 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>部门及时率排名</template>
          <div class="rank-list">
            <div class="rank-item" v-for="(item, index) in departmentRank" :key="item.name">
              <div class="rank-left">
                <span class="rank-num" :class="getRankClass(index)">{{ index + 1 }}</span>
                <span class="rank-name">{{ item.name }}</span>
              </div>
              <div class="rank-right">
                <el-progress :percentage="item.rate" :color="getProgressColor(item.rate)" :stroke-width="8" :show-text="false" style="width: 100px" />
                <span class="rank-value" :class="getRateClass(item.rate)">{{ item.rate }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- 超期原因分析 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>超期原因分析</template>
          <div ref="reasonChartRef" class="chart-container-sm"></div>
        </el-card>
      </el-col>

      <!-- 物料发料时效分布 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>发料时效分布</template>
          <div ref="timeDistChartRef" class="chart-container-sm"></div>
        </el-card>
      </el-col>

      <!-- 紧急程度分析 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>按紧急程度统计</template>
          <div class="urgency-stats">
            <div class="urgency-item" v-for="item in urgencyStats" :key="item.label">
              <div class="urgency-label">
                <el-tag :type="item.type" size="small">{{ item.label }}</el-tag>
              </div>
              <div class="urgency-data">
                <span class="urgency-count">{{ item.count }} 单</span>
                <span class="urgency-rate" :class="getRateClass(item.rate)">{{ item.rate }}%</span>
              </div>
              <el-progress :percentage="item.rate" :color="getProgressColor(item.rate)" :stroke-width="6" :show-text="false" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 明细数据表格 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>超期单据明细</span>
          <el-button type="primary" link @click="showAllOverdue = !showAllOverdue">
            {{ showAllOverdue ? '收起' : '查看全部' }}
          </el-button>
        </div>
      </template>
      <el-table :data="overdueList" border size="small" v-loading="loading">
        <el-table-column prop="orderNo" label="领用单号" width="140" />
        <el-table-column prop="department" label="领用部门" width="100" />
        <el-table-column prop="requisitioner" label="领用人" width="80" />
        <el-table-column prop="expectDate" label="期望日期" width="100" />
        <el-table-column prop="completeDate" label="完成日期" width="100" />
        <el-table-column prop="overdueDays" label="超期天数" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.overdueDays }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overdueReason" label="超期原因" min-width="150" />
        <el-table-column prop="handler" label="处理人" width="80" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const loading = ref(false)
const trendType = ref('day')
const showAllOverdue = ref(false)
const trendChartRef = ref(null)
const reasonChartRef = ref(null)
const timeDistChartRef = ref(null)

let trendChart = null
let reasonChart = null
let timeDistChart = null

const filterForm = reactive({
  dateRange: ['2025-01-01', '2025-01-10'],
  department: '',
  warehouse: ''
})

const kpiData = reactive({
  overallRate: 92.5,
  overallTrend: 2.3,
  totalOrders: 156,
  onTimeOrders: 144,
  overdueOrders: 12,
  avgResponseTime: 2.5,
  avgCompleteTime: 5.8
})

const departmentRank = ref([
  { name: '研发部', rate: 98.2 },
  { name: '生产一部', rate: 94.5 },
  { name: '维修部', rate: 91.3 },
  { name: '生产二部', rate: 88.7 },
  { name: '品质部', rate: 85.2 }
])

const urgencyStats = ref([
  { label: '普通', type: 'info', count: 120, rate: 94.2 },
  { label: '紧急', type: 'warning', count: 28, rate: 89.3 },
  { label: '特急', type: 'danger', count: 8, rate: 87.5 }
])

const overdueList = ref([
  { orderNo: 'LY20250105001', department: '生产二部', requisitioner: '张三', expectDate: '2025-01-06', completeDate: '2025-01-08', overdueDays: 2, overdueReason: '库存不足，紧急采购', handler: '李四' },
  { orderNo: 'LY20250106003', department: '维修部', requisitioner: '王五', expectDate: '2025-01-07', completeDate: '2025-01-09', overdueDays: 2, overdueReason: '物料需调拨', handler: '赵六' },
  { orderNo: 'LY20250107005', department: '生产一部', requisitioner: '孙七', expectDate: '2025-01-08', completeDate: '2025-01-10', overdueDays: 2, overdueReason: '人员不足', handler: '周八' }
])

const getRateClass = (rate) => {
  if (rate >= 95) return 'rate-excellent'
  if (rate >= 85) return 'rate-good'
  return 'rate-poor'
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const getProgressColor = (rate) => {
  if (rate >= 95) return '#67c23a'
  if (rate >= 85) return '#e6a23c'
  return '#f56c6c'
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['及时率', '目标线'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06', '01-07', '01-08', '01-09', '01-10']
    },
    yAxis: { type: 'value', min: 80, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '及时率',
        type: 'line',
        smooth: true,
        data: [91, 93, 90, 94, 92, 95, 93, 91, 94, 92.5],
        itemStyle: { color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
      },
      {
        name: '目标线',
        type: 'line',
        data: [95, 95, 95, 95, 95, 95, 95, 95, 95, 95],
        lineStyle: { type: 'dashed', color: '#67c23a' },
        itemStyle: { color: '#67c23a' }
      }
    ]
  }
  trendChart.setOption(option)
}

const initReasonChart = () => {
  if (!reasonChartRef.value) return
  reasonChart = echarts.init(reasonChartRef.value)
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: [
        { value: 5, name: '库存不足', itemStyle: { color: '#f56c6c' } },
        { value: 3, name: '物料调拨', itemStyle: { color: '#e6a23c' } },
        { value: 2, name: '人员不足', itemStyle: { color: '#909399' } },
        { value: 2, name: '其他原因', itemStyle: { color: '#c0c4cc' } }
      ],
      label: { show: false }
    }]
  }
  reasonChart.setOption(option)
}

const initTimeDistChart = () => {
  if (!timeDistChartRef.value) return
  timeDistChart = echarts.init(timeDistChartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['<2h', '2-4h', '4-8h', '8-24h', '>24h'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        { value: 45, itemStyle: { color: '#67c23a' } },
        { value: 58, itemStyle: { color: '#67c23a' } },
        { value: 32, itemStyle: { color: '#409eff' } },
        { value: 15, itemStyle: { color: '#e6a23c' } },
        { value: 6, itemStyle: { color: '#f56c6c' } }
      ],
      barWidth: 30
    }]
  }
  timeDistChart.setOption(option)
}

const handleQuery = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已更新')
  }, 500)
}

const handleExport = () => {
  ElMessage.success('报表导出成功')
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initReasonChart()
    initTimeDistChart()
  })
  
  window.addEventListener('resize', () => {
    trendChart?.resize()
    reasonChart?.resize()
    timeDistChart?.resize()
  })
})
</script>

<style scoped>
.requisition-rate { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-card__body) { padding: 16px 16px 0; }

.kpi-cards { display: flex; gap: 16px; margin-bottom: 16px; }
.kpi-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.kpi-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.kpi-title { font-size: 13px; color: #909399; }
.kpi-value { font-size: 32px; font-weight: 700; }
.kpi-trend { font-size: 12px; color: #909399; margin-top: 4px; }
.kpi-detail { font-size: 12px; color: #909399; margin-top: 4px; }

.text-primary { color: #409eff; }
.rate-excellent { color: #67c23a; }
.rate-good { color: #e6a23c; }
.rate-poor { color: #f56c6c; }
.trend-up { color: #67c23a; }
.trend-down { color: #f56c6c; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.chart-container { height: 300px; }
.chart-container-sm { height: 220px; }

.rank-list { padding: 8px 0; }
.rank-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #ebeef5; }
.rank-item:last-child { border-bottom: none; }
.rank-left { display: flex; align-items: center; gap: 12px; }
.rank-num { width: 20px; height: 20px; border-radius: 4px; background: #f0f2f5; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #909399; }
.rank-num.rank-gold { background: #ffd700; color: #fff; }
.rank-num.rank-silver { background: #c0c0c0; color: #fff; }
.rank-num.rank-bronze { background: #cd7f32; color: #fff; }
.rank-name { font-size: 14px; color: #303133; }
.rank-right { display: flex; align-items: center; gap: 12px; }
.rank-value { font-size: 14px; font-weight: 600; min-width: 50px; text-align: right; }

.urgency-stats { padding: 8px 0; }
.urgency-item { margin-bottom: 16px; }
.urgency-item:last-child { margin-bottom: 0; }
.urgency-label { margin-bottom: 6px; }
.urgency-data { display: flex; justify-content: space-between; margin-bottom: 6px; }
.urgency-count { font-size: 13px; color: #606266; }
.urgency-rate { font-size: 14px; font-weight: 600; }
</style>
