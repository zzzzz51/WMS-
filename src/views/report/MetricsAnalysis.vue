<template>
  <div class="metrics-analysis">
    <h2>物流指标分析</h2>
    
    <!-- 核心KPI卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">库存周转率</div>
          <div class="kpi-value" :class="getKpiClass(kpi.turnoverRate, 6, 12)">{{ kpi.turnoverRate.toFixed(2) }}</div>
          <div class="kpi-unit">次/年</div>
          <div class="kpi-trend up">↑ 12.5%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">周转天数</div>
          <div class="kpi-value" :class="getKpiClass(90 - kpi.turnoverDays, 0, 30)">{{ kpi.turnoverDays.toFixed(0) }}</div>
          <div class="kpi-unit">天</div>
          <div class="kpi-trend down">↓ 5天</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">库存准确率</div>
          <div class="kpi-value" :class="getKpiClass(kpi.accuracy, 95, 99)">{{ kpi.accuracy.toFixed(1) }}%</div>
          <div class="kpi-unit"></div>
          <div class="kpi-trend up">↑ 0.5%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">订单满足率</div>
          <div class="kpi-value" :class="getKpiClass(kpi.fillRate, 95, 99)">{{ kpi.fillRate.toFixed(1) }}%</div>
          <div class="kpi-unit"></div>
          <div class="kpi-trend up">↑ 2.1%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">呆滞库存率</div>
          <div class="kpi-value" :class="getKpiClass(10 - kpi.stagnantRate, 0, 5)">{{ kpi.stagnantRate.toFixed(1) }}%</div>
          <div class="kpi-unit"></div>
          <div class="kpi-trend down">↓ 1.2%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="4">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-title">仓库利用率</div>
          <div class="kpi-value" :class="getKpiClass(kpi.utilization, 60, 80)">{{ kpi.utilization.toFixed(1) }}%</div>
          <div class="kpi-unit"></div>
          <div class="kpi-trend">→ 0%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 库存周转趋势 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>库存周转趋势</span>
              <el-radio-group v-model="turnoverPeriod" size="small">
                <el-radio-button label="month">月度</el-radio-button>
                <el-radio-button label="quarter">季度</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div class="simple-chart">
              <div class="chart-bars">
                <div v-for="(item, i) in turnoverTrend" :key="i" class="chart-bar-group">
                  <div class="chart-bar" :style="{height: item.rate * 8 + 'px'}" :title="item.rate + '次'"></div>
                  <div class="chart-label">{{ item.month }}</div>
                </div>
              </div>
              <div class="chart-line">
                <svg width="100%" height="100" viewBox="0 0 600 100" preserveAspectRatio="none">
                  <polyline :points="getTurnoverPoints()" fill="none" stroke="#409eff" stroke-width="2"/>
                </svg>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- ABC分类占比 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>ABC分类分析</span>
            </div>
          </template>
          <div class="abc-container">
            <div class="abc-chart">
              <div class="abc-ring">
                <div class="ring-segment a" :style="{transform: 'rotate(0deg)', '--percent': abcData.a.percent}"></div>
                <div class="ring-segment b" :style="{transform: `rotate(${abcData.a.percent * 3.6}deg)`, '--percent': abcData.b.percent}"></div>
                <div class="ring-segment c" :style="{transform: `rotate(${(abcData.a.percent + abcData.b.percent) * 3.6}deg)`, '--percent': abcData.c.percent}"></div>
                <div class="ring-center">SKU<br/>分布</div>
              </div>
            </div>
            <div class="abc-legend">
              <div class="legend-item">
                <span class="dot a"></span>
                <span class="label">A类(重要)</span>
                <span class="value">{{ abcData.a.count }}个 / {{ abcData.a.percent }}%</span>
                <span class="amount">¥{{ (abcData.a.value / 10000).toFixed(1) }}万</span>
              </div>
              <div class="legend-item">
                <span class="dot b"></span>
                <span class="label">B类(一般)</span>
                <span class="value">{{ abcData.b.count }}个 / {{ abcData.b.percent }}%</span>
                <span class="amount">¥{{ (abcData.b.value / 10000).toFixed(1) }}万</span>
              </div>
              <div class="legend-item">
                <span class="dot c"></span>
                <span class="label">C类(次要)</span>
                <span class="value">{{ abcData.c.count }}个 / {{ abcData.c.percent }}%</span>
                <span class="amount">¥{{ (abcData.c.value / 10000).toFixed(1) }}万</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <!-- 收发货效率 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>收发货效率</span></template>
          <el-table :data="efficiencyData" size="small" border>
            <el-table-column prop="metric" label="指标" width="150" />
            <el-table-column prop="current" label="本月" align="right">
              <template #default="{row}"><span class="text-primary">{{ row.current }}</span></template>
            </el-table-column>
            <el-table-column prop="lastMonth" label="上月" align="right" />
            <el-table-column prop="target" label="目标" align="right" />
            <el-table-column label="达成" width="100" align="center">
              <template #default="{row}">
                <el-tag :type="row.achieved ? 'success' : 'danger'" size="small">{{ row.achieved ? '达成' : '未达成' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 库存分布 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span>各仓库库存分布</span></template>
          <div class="warehouse-dist">
            <div v-for="wh in warehouseData" :key="wh.name" class="wh-item">
              <div class="wh-name">{{ wh.name }}</div>
              <div class="wh-bar-bg">
                <div class="wh-bar" :style="{width: wh.percent + '%', background: wh.color}"></div>
              </div>
              <div class="wh-info">
                <span class="wh-value">¥{{ (wh.value / 10000).toFixed(1) }}万</span>
                <span class="wh-percent">{{ wh.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 指标说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div class="card-header">
          <span>指标计算说明</span>
          <el-button type="primary" link @click="showFormula = !showFormula">{{ showFormula ? '收起' : '展开' }}</el-button>
        </div>
      </template>
      <div v-show="showFormula" class="formula-list">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">库存周转率</div>
              <div class="formula-content">= 年出库金额 / 平均库存金额</div>
              <div class="formula-desc">反映库存流动性，值越高说明库存周转越快</div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">安全库存</div>
              <div class="formula-content">= Z × σ × √L (或简化: 日均需求 × 采购周期 × 0.4)</div>
              <div class="formula-desc">防止缺货的最低库存水平</div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">补货点</div>
              <div class="formula-content">= 日均需求 × 采购周期 + 安全库存</div>
              <div class="formula-desc">库存降到此水位时应发起补货</div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">经济订货量(EOQ)</div>
              <div class="formula-content">= √(2DS/H)</div>
              <div class="formula-desc">D=年需求量, S=订货成本, H=持有成本</div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">库存准确率</div>
              <div class="formula-content">= 盘点相符SKU数 / 总盘点SKU数 × 100%</div>
              <div class="formula-desc">系统数据与实物一致的程度</div>
            </div>
          </el-col>
          <el-col :xs="24" :md="12">
            <div class="formula-item">
              <div class="formula-title">呆滞库存率</div>
              <div class="formula-content">= 呆滞库存金额 / 总库存金额 × 100%</div>
              <div class="formula-desc">超过90天无出库即为呆滞</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const turnoverPeriod = ref('month')
const showFormula = ref(false)

const kpi = reactive({
  turnoverRate: 7.28,
  turnoverDays: 50.2,
  accuracy: 97.5,
  fillRate: 96.8,
  stagnantRate: 5.2,
  utilization: 72.5
})

const turnoverTrend = ref([
  { month: '7月', rate: 6.2 }, { month: '8月', rate: 6.5 }, { month: '9月', rate: 6.8 },
  { month: '10月', rate: 7.0 }, { month: '11月', rate: 7.1 }, { month: '12月', rate: 7.28 }
])

const abcData = reactive({
  a: { count: 120, percent: 15, value: 850000 },
  b: { count: 280, percent: 35, value: 320000 },
  c: { count: 400, percent: 50, value: 130000 }
})

const efficiencyData = ref([
  { metric: '收货效率(件/小时)', current: '156', lastMonth: '148', target: '150', achieved: true },
  { metric: '拣货效率(行/小时)', current: '42', lastMonth: '38', target: '40', achieved: true },
  { metric: '拣货准确率(%)', current: '99.2', lastMonth: '98.8', target: '99', achieved: true },
  { metric: '发货及时率(%)', current: '94.5', lastMonth: '95.2', target: '95', achieved: false },
  { metric: '人均处理量(件)', current: '520', lastMonth: '485', target: '500', achieved: true }
])

const warehouseData = ref([
  { name: 'MRO主仓库', value: 580000, percent: 45, color: '#409eff' },
  { name: '原料仓库', value: 320000, percent: 25, color: '#67c23a' },
  { name: '成品仓库', value: 260000, percent: 20, color: '#e6a23c' },
  { name: '备件仓库', value: 130000, percent: 10, color: '#9c27b0' }
])

const getKpiClass = (value, warn, good) => {
  if (value >= good) return 'good'
  if (value >= warn) return 'warn'
  return 'bad'
}

const getTurnoverPoints = () => {
  const points = turnoverTrend.value.map((item, i) => {
    const x = (i + 0.5) * (600 / turnoverTrend.value.length)
    const y = 100 - item.rate * 10
    return `${x},${y}`
  })
  return points.join(' ')
}
</script>

<style scoped>
.metrics-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.kpi-row { margin-bottom: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.kpi-value { font-size: 32px; font-weight: bold; color: #303133; }
.kpi-value.good { color: #67c23a; }
.kpi-value.warn { color: #e6a23c; }
.kpi-value.bad { color: #f56c6c; }
.kpi-unit { font-size: 12px; color: #909399; }
.kpi-trend { font-size: 12px; margin-top: 4px; }
.kpi-trend.up { color: #67c23a; }
.kpi-trend.down { color: #f56c6c; }

.chart-card { height: 320px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

.chart-container { height: 240px; padding: 20px; }
.simple-chart { position: relative; height: 100%; }
.chart-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 150px; }
.chart-bar-group { text-align: center; }
.chart-bar { width: 40px; background: linear-gradient(180deg, #409eff, #66b1ff); border-radius: 4px 4px 0 0; transition: height 0.3s; }
.chart-label { font-size: 12px; color: #909399; margin-top: 8px; }

.abc-container { display: flex; align-items: center; padding: 20px; }
.abc-chart { flex: 0 0 150px; }
.abc-ring { position: relative; width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#f56c6c 0% 15%, #e6a23c 15% 50%, #909399 50% 100%); }
.ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; text-align: center; color: #606266; }
.abc-legend { flex: 1; padding-left: 30px; }
.legend-item { display: flex; align-items: center; margin-bottom: 16px; }
.dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; }
.dot.a { background: #f56c6c; }
.dot.b { background: #e6a23c; }
.dot.c { background: #909399; }
.legend-item .label { width: 80px; }
.legend-item .value { width: 100px; color: #606266; }
.legend-item .amount { color: #409eff; font-weight: bold; }

.warehouse-dist { padding: 10px 0; }
.wh-item { margin-bottom: 16px; }
.wh-name { font-size: 13px; margin-bottom: 6px; }
.wh-bar-bg { height: 20px; background: #ebeef5; border-radius: 10px; overflow: hidden; }
.wh-bar { height: 100%; border-radius: 10px; transition: width 0.5s; }
.wh-info { display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; }
.wh-value { color: #409eff; }
.wh-percent { color: #909399; }

.formula-list { padding: 10px 0; }
.formula-item { background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.formula-title { font-weight: bold; color: #303133; margin-bottom: 8px; }
.formula-content { font-family: 'Courier New', monospace; color: #409eff; margin-bottom: 8px; font-size: 14px; }
.formula-desc { font-size: 12px; color: #909399; }

.text-primary { color: #409eff; font-weight: 600; }
</style>
