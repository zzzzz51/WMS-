<template>
  <div class="dashboard">
    <!-- 顶部统计卡片 -->
    <div class="stat-row">
      <div class="stat-card" v-for="stat in topStats" :key="stat.title">
        <div class="stat-icon" :style="{ background: stat.color }">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
        </div>
        <div class="stat-trend" v-if="stat.trend">
          <span :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
          </span>
          <span class="trend-label">较昨日</span>
        </div>
      </div>
    </div>

    <!-- 待办任务 -->
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card shadow="never" class="todo-card">
          <template #header>
            <div class="card-header">
              <span>待办任务</span>
              <el-button type="primary" link>查看全部</el-button>
            </div>
          </template>
          <div class="todo-grid">
            <div class="todo-item" v-for="todo in todoList" :key="todo.title" @click="handleTodo(todo)">
              <div class="todo-icon" :style="{ background: todo.color }">
                {{ todo.icon }}
              </div>
              <div class="todo-info">
                <div class="todo-title">{{ todo.title }}</div>
                <div class="todo-desc">{{ todo.desc }}</div>
              </div>
              <div class="todo-count">
                <span class="count-value">{{ todo.count }}</span>
                <span class="count-unit">{{ todo.unit }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="quick-card">
          <template #header>快捷操作</template>
          <div class="quick-grid">
            <div class="quick-item" v-for="item in quickActions" :key="item.title" @click="handleQuick(item)">
              <div class="quick-icon" :style="{ background: item.color }">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <div class="quick-title">{{ item.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>出入库趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>库存分布</span>
              <el-select v-model="stockType" size="small" style="width: 100px">
                <el-option label="按仓库" value="warehouse" />
                <el-option label="按类别" value="category" />
              </el-select>
            </div>
          </template>
          <div ref="stockChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部信息 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>库存预警</template>
          <div class="warning-list">
            <div class="warning-item" v-for="item in warningList" :key="item.materialCode">
              <div class="warning-info">
                <div class="warning-name">{{ item.materialName }}</div>
                <div class="warning-code">{{ item.materialCode }}</div>
              </div>
              <div class="warning-status">
                <el-tag :type="item.type" size="small">{{ item.status }}</el-tag>
                <span class="warning-qty">{{ item.qty }} {{ item.unit }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>ERP同步状态</template>
          <div class="sync-status">
            <div class="sync-item" v-for="item in syncStatus" :key="item.name">
              <div class="sync-left">
                <el-icon :color="item.success ? '#67c23a' : '#f56c6c'">
                  <component :is="item.success ? 'CircleCheck' : 'CircleClose'" />
                </el-icon>
                <span>{{ item.name }}</span>
              </div>
              <div class="sync-right">
                <span class="sync-time">{{ item.time }}</span>
              </div>
            </div>
          </div>
          <el-button type="primary" style="width: 100%; margin-top: 12px" @click="syncAll">
            <el-icon><Refresh /></el-icon> 全部同步
          </el-button>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>今日作业统计</template>
          <div class="work-stats">
            <div class="work-item" v-for="item in workStats" :key="item.label">
              <div class="work-label">{{ item.label }}</div>
              <div class="work-value">
                <span class="value-num">{{ item.value }}</span>
                <span class="value-unit">{{ item.unit }}</span>
              </div>
              <el-progress :percentage="item.percent" :color="item.color" :stroke-width="6" :show-text="false" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Download, Upload, Switch, Document, Box, DataLine,
  Plus, Search, Refresh, CircleCheck, CircleClose
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()
const trendPeriod = ref('week')
const stockType = ref('warehouse')
const trendChartRef = ref(null)
const stockChartRef = ref(null)

let trendChart = null
let stockChart = null

const topStats = ref([
  { title: '今日入库', value: '1,258', icon: 'Download', color: 'linear-gradient(135deg, #409eff, #66b1ff)', trend: 12.5 },
  { title: '今日出库', value: '892', icon: 'Upload', color: 'linear-gradient(135deg, #67c23a, #85ce61)', trend: -3.2 },
  { title: '库存总量', value: '52,368', icon: 'Box', color: 'linear-gradient(135deg, #e6a23c, #f0c78a)', trend: 0 },
  { title: '待处理单据', value: '36', icon: 'Document', color: 'linear-gradient(135deg, #f56c6c, #f89898)', trend: 0 }
])

const todoList = ref([
  { title: '待收货', icon: '📥', desc: 'ERP送货单', count: 8, unit: '单', color: '#e6f4ff', path: '/inbound/delivery' },
  { title: '待上架', icon: '⬆️', desc: '收货后待上架', count: 15, unit: '任务', color: '#f0f9eb', path: '/inbound/putaway' },
  { title: '待发料', icon: '📤', desc: 'ERP领用单', count: 12, unit: '单', color: '#fdf6ec', path: '/outbound/requisition' },
  { title: '待审批', icon: '✍️', desc: 'WMS创建单据', count: 5, unit: '单', color: '#fef0f0', path: '/transfer/order' },
  { title: '待执行', icon: '🔄', desc: '审批通过的单据', count: 9, unit: '单', color: '#f4f4f5', path: '/transfer/execute' },
  { title: '待盘点', icon: '📋', desc: '盘点任务', count: 2, unit: '任务', color: '#ecf5ff', path: '/count/task' }
])

const quickActions = ref([
  { title: '杂项入库', icon: 'Plus', color: '#409eff', path: '/inbound/misc' },
  { title: '退料单', icon: 'RefreshLeft', color: '#67c23a', path: '/outbound/return' },
  { title: '移拨单', icon: 'Switch', color: '#e6a23c', path: '/transfer/order' },
  { title: '库存查询', icon: 'Search', color: '#909399', path: '/inventory/list' },
  { title: '条码打印', icon: 'Ticket', color: '#f56c6c', path: '/barcode/print' },
  { title: 'PDA终端', icon: 'Iphone', color: '#9c27b0', path: '/pda' }
])

const warningList = ref([
  { materialCode: 'MAT000001', materialName: '螺栓M10×30', qty: 50, unit: '个', status: '低于安全库存', type: 'danger' },
  { materialCode: 'MAT000025', materialName: '轴承6205', qty: 20, unit: '个', status: '低于安全库存', type: 'danger' },
  { materialCode: 'MAT000108', materialName: '密封圈DN50', qty: 150, unit: '个', status: '接近安全库存', type: 'warning' },
  { materialCode: 'MAT000203', materialName: '电机YE2', qty: 3, unit: '台', status: '低于安全库存', type: 'danger' }
])

const syncStatus = ref([
  { name: '物料主数据', success: true, time: '10:30:00' },
  { name: '领用单同步', success: true, time: '10:28:00' },
  { name: '送货单同步', success: true, time: '10:25:00' },
  { name: '库存数据回传', success: false, time: '10:20:00' }
])

const workStats = ref([
  { label: '收货完成', value: 12, unit: '单', percent: 80, color: '#409eff' },
  { label: '上架完成', value: 28, unit: '任务', percent: 65, color: '#67c23a' },
  { label: '发料完成', value: 18, unit: '单', percent: 90, color: '#e6a23c' },
  { label: '移库完成', value: 5, unit: '单', percent: 50, color: '#909399' }
])

const handleTodo = (todo) => {
  router.push(todo.path)
}

const handleQuick = (item) => {
  if (item.path === '/pda') {
    window.open('/pda', '_blank')
  } else {
    router.push(item.path)
  }
}

const syncAll = () => {
  ElMessage.success('开始同步ERP数据...')
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['入库', '出库'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: ['01-04', '01-05', '01-06', '01-07', '01-08', '01-09', '01-10'] },
    yAxis: { type: 'value' },
    series: [
      { name: '入库', type: 'bar', data: [820, 932, 901, 1234, 1090, 1230, 1258], itemStyle: { color: '#409eff' } },
      { name: '出库', type: 'bar', data: [620, 732, 801, 934, 890, 930, 892], itemStyle: { color: '#67c23a' } }
    ]
  }
  trendChart.setOption(option)
}

const initStockChart = () => {
  if (!stockChartRef.value) return
  stockChart = echarts.init(stockChartRef.value)
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      data: [
        { value: 18500, name: '主仓库', itemStyle: { color: '#409eff' } },
        { value: 12300, name: '原料仓', itemStyle: { color: '#67c23a' } },
        { value: 15600, name: '成品仓', itemStyle: { color: '#e6a23c' } },
        { value: 5968, name: '备件仓', itemStyle: { color: '#909399' } }
      ],
      label: { formatter: '{b}: {d}%' }
    }]
  }
  stockChart.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initStockChart()
  })
  
  window.addEventListener('resize', () => {
    trendChart?.resize()
    stockChart?.resize()
  })
})
</script>

<style scoped>
.dashboard { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }

/* 顶部统计 */
.stat-row { display: flex; gap: 16px; margin-bottom: 16px; }
.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}
.stat-content { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-title { font-size: 13px; color: #909399; margin-top: 4px; }
.stat-trend { text-align: right; }
.stat-trend .up { color: #67c23a; font-weight: 600; }
.stat-trend .down { color: #f56c6c; font-weight: 600; }
.stat-trend .trend-label { font-size: 12px; color: #c0c4cc; display: block; }

/* 待办任务 */
.todo-card :deep(.el-card__body) { padding: 0; }
.todo-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}
.todo-item:hover { background: #f5f7fa; }
.todo-item:nth-child(3n) { border-right: none; }
.todo-item:nth-child(n+4) { border-bottom: none; }
.todo-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.todo-info { flex: 1; }
.todo-title { font-size: 14px; font-weight: 500; color: #303133; }
.todo-desc { font-size: 12px; color: #909399; margin-top: 2px; }
.todo-count { text-align: right; }
.count-value { font-size: 24px; font-weight: 700; color: #409eff; }
.count-unit { font-size: 12px; color: #909399; margin-left: 2px; }

/* 快捷操作 */
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.quick-item:hover { background: #f5f7fa; }
.quick-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; }
.quick-title { font-size: 13px; color: #606266; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.chart-container { height: 280px; }

/* 预警列表 */
.warning-list { max-height: 260px; overflow-y: auto; }
.warning-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #ebeef5; }
.warning-item:last-child { border-bottom: none; }
.warning-name { font-size: 14px; color: #303133; }
.warning-code { font-size: 12px; color: #909399; }
.warning-status { text-align: right; }
.warning-qty { font-size: 12px; color: #909399; margin-left: 8px; }

/* 同步状态 */
.sync-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #ebeef5; }
.sync-item:last-child { border-bottom: none; }
.sync-left { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.sync-time { font-size: 12px; color: #909399; }

/* 作业统计 */
.work-item { margin-bottom: 16px; }
.work-item:last-child { margin-bottom: 0; }
.work-item .work-label { font-size: 13px; color: #606266; margin-bottom: 4px; }
.work-item .work-value { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
.value-num { font-size: 20px; font-weight: 600; color: #303133; }
.value-unit { font-size: 12px; color: #909399; }
</style>
