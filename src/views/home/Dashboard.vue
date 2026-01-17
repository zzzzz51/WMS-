<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h2>👋 欢迎回来，管理员</h2>
        <p>{{ currentTime }} | 今日是您使用WMS系统的第 <b>128</b> 天</p>
      </div>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/inbound/receive')">
          <el-icon><Download /></el-icon> 快速入库
        </el-button>
        <el-button type="success" @click="$router.push('/outbound/requisition')">
          <el-icon><Upload /></el-icon> 快速出库
        </el-button>
        <el-button type="warning" @click="$router.push('/inventory/check')">
          <el-icon><Document /></el-icon> 库存盘点
        </el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card blue" @click="$router.push('/inventory/list')">
          <div class="stat-icon"><el-icon><Box /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.totalSku }}</div>
            <div class="stat-label">物料SKU数</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon> 较上月 +12%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card green" @click="$router.push('/inventory/list')">
          <div class="stat-icon"><el-icon><Goods /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.totalQty }}</div>
            <div class="stat-label">库存总数量</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon> 较上月 +8%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card orange" @click="$router.push('/inventory/safety-warning')">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedStats.warningCount }}</div>
            <div class="stat-label">预警物料</div>
            <div class="stat-trend down">
              <el-icon><Bottom /></el-icon> 较上月 -5%
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card purple">
          <div class="stat-icon"><el-icon><Money /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">¥{{ animatedStats.totalValue }}万</div>
            <div class="stat-label">库存总金额</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon> 较上月 +3%
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">出入库趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div class="trend-chart">
              <div class="chart-legend">
                <span class="legend-item"><span class="dot inbound"></span> 入库</span>
                <span class="legend-item"><span class="dot outbound"></span> 出库</span>
              </div>
              <div class="chart-body">
                <div class="y-axis">
                  <span>500</span><span>400</span><span>300</span><span>200</span><span>100</span><span>0</span>
                </div>
                <div class="bars-container">
                  <div v-for="(item, index) in trendData" :key="index" class="bar-group">
                    <div class="bar-wrapper">
                      <div class="bar inbound" :style="{ height: item.inbound / 5 + '%' }">
                        <span class="bar-value">{{ item.inbound }}</span>
                      </div>
                      <div class="bar outbound" :style="{ height: item.outbound / 5 + '%' }">
                        <span class="bar-value">{{ item.outbound }}</span>
                      </div>
                    </div>
                    <div class="bar-label">{{ item.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">库存分布</span>
          </template>
          <div class="chart-container">
            <div class="pie-chart">
              <div class="pie" style="background: conic-gradient(#409eff 0deg 144deg, #67c23a 144deg 252deg, #e6a23c 252deg 324deg, #909399 324deg 360deg);"></div>
              <div class="pie-center">
                <div class="pie-total">{{ stats.totalSku }}</div>
                <div class="pie-label">SKU总数</div>
              </div>
            </div>
            <div class="pie-legend">
              <div class="legend-row">
                <span class="dot" style="background: #409eff;"></span>
                <span class="legend-text">MRO主仓库</span>
                <span class="legend-value">40%</span>
              </div>
              <div class="legend-row">
                <span class="dot" style="background: #67c23a;"></span>
                <span class="legend-text">原料仓库</span>
                <span class="legend-value">30%</span>
              </div>
              <div class="legend-row">
                <span class="dot" style="background: #e6a23c;"></span>
                <span class="legend-text">成品仓库</span>
                <span class="legend-value">20%</span>
              </div>
              <div class="legend-row">
                <span class="dot" style="background: #909399;"></span>
                <span class="legend-text">其他仓库</span>
                <span class="legend-value">10%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方区域 -->
    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">待办事项</span>
              <el-badge :value="todoList.length" type="danger" />
            </div>
          </template>
          <div class="todo-list">
            <div v-for="item in todoList" :key="item.id" class="todo-item" @click="handleTodo(item)">
              <div class="todo-icon" :class="item.type">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <div class="todo-content">
                <div class="todo-title">{{ item.title }}</div>
                <div class="todo-desc">{{ item.desc }}</div>
              </div>
              <div class="todo-count">{{ item.count }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近操作</span>
              <el-link type="primary" @click="$router.push('/system/log')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentLogs" size="small" :show-header="false">
            <el-table-column width="60">
              <template #default="{ row }">
                <el-tag :type="row.type" size="small">{{ row.action }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" show-overflow-tooltip />
            <el-table-column prop="time" width="90" align="right">
              <template #default="{ row }">
                <span class="log-time">{{ row.time }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card shadow="never" class="shortcuts-card">
      <template #header>
        <span class="card-title">快捷入口</span>
      </template>
      <div class="shortcuts-grid">
        <div v-for="item in shortcuts" :key="item.path" class="shortcut-item" @click="$router.push(item.path)">
          <div class="shortcut-icon" :style="{ background: item.color }">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <span class="shortcut-text">{{ item.title }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Download, Upload, Document, Box, Goods, Warning, Money, Top, Bottom, Bell, Tickets, List, Setting, User, DataAnalysis, Grid, Iphone } from '@element-plus/icons-vue'

const trendPeriod = ref('week')
const currentTime = ref('')
let timer = null

const stats = reactive({
  totalSku: 15680,
  totalQty: 2580000,
  warningCount: 79,
  totalValue: 1258
})

const animatedStats = reactive({
  totalSku: 0,
  totalQty: 0,
  warningCount: 0,
  totalValue: 0
})

const trendData = ref([
  { label: '周一', inbound: 320, outbound: 280 },
  { label: '周二', inbound: 280, outbound: 350 },
  { label: '周三', inbound: 450, outbound: 320 },
  { label: '周四', inbound: 380, outbound: 410 },
  { label: '周五', inbound: 420, outbound: 380 },
  { label: '周六', inbound: 180, outbound: 150 },
  { label: '周日', inbound: 120, outbound: 100 }
])

const todoList = ref([
  { id: 1, type: 'warning', icon: 'Warning', title: '库存预警', desc: '有物料低于安全库存', count: 23 },
  { id: 2, type: 'danger', icon: 'Bell', title: '待收货', desc: '采购订单待收货确认', count: 8 },
  { id: 3, type: 'primary', icon: 'Tickets', title: '待上架', desc: '收货完成待上架', count: 15 },
  { id: 4, type: 'success', icon: 'List', title: '待出库', desc: '领用单待拣货出库', count: 12 }
])

const recentLogs = ref([
  { action: '入库', type: 'success', content: 'MAT000123 轴承 入库200件', time: '10:32' },
  { action: '出库', type: 'warning', content: 'MAT000456 密封圈 出库50件', time: '10:28' },
  { action: '盘点', type: 'primary', content: 'A区库存盘点完成', time: '10:15' },
  { action: '调拨', type: 'info', content: 'MAT000789 从MRO仓调拨至成品仓', time: '09:45' },
  { action: '入库', type: 'success', content: 'MAT000321 润滑油 入库100桶', time: '09:30' }
])

const shortcuts = ref([
  { title: '库存查询', path: '/inventory/list', icon: 'Box', color: '#409eff' },
  { title: '入库管理', path: '/inbound/receive', icon: 'Download', color: '#67c23a' },
  { title: '出库管理', path: '/outbound/requisition', icon: 'Upload', color: '#e6a23c' },
  { title: '库存盘点', path: '/inventory/check', icon: 'Document', color: '#909399' },
  { title: 'PDA扫描', path: '/pda/scan', icon: 'Iphone', color: '#f56c6c' },
  { title: '库存报表', path: '/report/inventory', icon: 'DataAnalysis', color: '#9b59b6' },
  { title: '物料管理', path: '/basedata/material', icon: 'Grid', color: '#3498db' },
  { title: '系统设置', path: '/system/config', icon: 'Setting', color: '#1abc9c' }
])

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'long'
  })
}

const animateNumbers = () => {
  const duration = 1500
  const steps = 60
  const interval = duration / steps
  
  let step = 0
  const animate = setInterval(() => {
    step++
    const progress = step / steps
    animatedStats.totalSku = Math.floor(stats.totalSku * progress).toLocaleString()
    animatedStats.totalQty = Math.floor(stats.totalQty * progress).toLocaleString()
    animatedStats.warningCount = Math.floor(stats.warningCount * progress)
    animatedStats.totalValue = (stats.totalValue * progress).toFixed(0)
    
    if (step >= steps) clearInterval(animate)
  }, interval)
}

const handleTodo = (item) => {
  console.log('处理待办:', item.title)
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  animateNumbers()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard { padding: 16px; background: #f0f2f5; min-height: calc(100vh - 84px); }

.welcome-section { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 16px; color: white; }
.welcome-text h2 { margin: 0 0 8px; font-size: 22px; }
.welcome-text p { margin: 0; opacity: 0.9; font-size: 14px; }
.welcome-text b { font-size: 18px; }
.quick-actions { display: flex; gap: 12px; }

.stat-cards { margin-bottom: 16px; }
.stat-card { display: flex; padding: 20px; border-radius: 12px; color: white; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; margin-bottom: 16px; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
.stat-card.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-card.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-card.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-card.purple { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon { font-size: 48px; margin-right: 16px; opacity: 0.9; }
.stat-value { font-size: 32px; font-weight: bold; }
.stat-label { font-size: 14px; opacity: 0.9; margin: 4px 0 8px; }
.stat-trend { font-size: 12px; opacity: 0.85; display: flex; align-items: center; gap: 4px; }
.stat-trend.up { color: #b7eb8f; }
.stat-trend.down { color: #ffccc7; }

.chart-row { margin-bottom: 16px; }
.chart-container { height: 280px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; }

.trend-chart { height: 100%; display: flex; flex-direction: column; }
.chart-legend { display: flex; gap: 20px; margin-bottom: 12px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.inbound { background: #409eff; }
.dot.outbound { background: #67c23a; }
.chart-body { flex: 1; display: flex; }
.y-axis { display: flex; flex-direction: column; justify-content: space-between; padding-right: 8px; font-size: 11px; color: #999; width: 30px; text-align: right; }
.bars-container { flex: 1; display: flex; justify-content: space-around; align-items: flex-end; padding-bottom: 25px; position: relative; }
.bar-group { display: flex; flex-direction: column; align-items: center; }
.bar-wrapper { display: flex; gap: 4px; height: 180px; align-items: flex-end; }
.bar { width: 20px; border-radius: 4px 4px 0 0; position: relative; transition: height 0.5s; min-height: 20px; }
.bar.inbound { background: linear-gradient(to top, #409eff, #79bbff); }
.bar.outbound { background: linear-gradient(to top, #67c23a, #95d475); }
.bar-value { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #666; white-space: nowrap; }
.bar-label { margin-top: 8px; font-size: 12px; color: #666; }

.pie-chart { display: flex; flex-direction: column; align-items: center; gap: 20px; height: 100%; justify-content: center; }
.pie { width: 160px; height: 160px; border-radius: 50%; position: relative; }
.pie-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.pie-total { font-size: 24px; font-weight: bold; color: #303133; }
.pie-label { font-size: 12px; color: #909399; }
.pie-legend { width: 100%; }
.legend-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.legend-row:last-child { border-bottom: none; }
.legend-row .dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
.legend-text { flex: 1; font-size: 13px; color: #606266; }
.legend-value { font-size: 13px; font-weight: 600; color: #303133; }

.todo-list { display: flex; flex-direction: column; gap: 12px; }
.todo-item { display: flex; align-items: center; padding: 12px; background: #f9f9f9; border-radius: 8px; cursor: pointer; transition: background 0.3s; }
.todo-item:hover { background: #f0f0f0; }
.todo-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; margin-right: 12px; font-size: 18px; }
.todo-icon.warning { background: linear-gradient(135deg, #f093fb, #f5576c); }
.todo-icon.danger { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
.todo-icon.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
.todo-icon.success { background: linear-gradient(135deg, #11998e, #38ef7d); }
.todo-content { flex: 1; }
.todo-title { font-size: 14px; font-weight: 600; color: #303133; }
.todo-desc { font-size: 12px; color: #909399; margin-top: 2px; }
.todo-count { font-size: 20px; font-weight: bold; color: #409eff; }

.log-time { font-size: 12px; color: #909399; }

.shortcuts-card { margin-top: 16px; }
.shortcuts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; }
.shortcut-item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border-radius: 8px; cursor: pointer; transition: background 0.3s; }
.shortcut-item:hover { background: #f5f5f5; }
.shortcut-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
.shortcut-text { font-size: 13px; color: #606266; }
</style>
