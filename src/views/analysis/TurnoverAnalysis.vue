<template>
  <div class="turnover-analysis">
    <h2>周转率分析</h2>
    
    <!-- KPI卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ kpi.avgTurnover.toFixed(2) }}</div>
          <div class="stat-label">平均周转率(次/年)</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ kpi.avgDays.toFixed(0) }}</div>
          <div class="stat-label">平均周转天数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ kpi.highTurnover }}</div>
          <div class="stat-label">高周转物料(≥12次)</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red">
          <div class="stat-value">{{ kpi.lowTurnover }}</div>
          <div class="stat-label">低周转物料(<3次)</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 周转率分布 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>周转率分布</span></template>
          <div class="distribution-chart">
            <div v-for="item in distributionData" :key="item.range" class="dist-item">
              <div class="dist-label">{{ item.range }}</div>
              <div class="dist-bar-bg">
                <div class="dist-bar" :style="{width: item.percent + '%', background: item.color}"></div>
              </div>
              <div class="dist-info">
                <span class="count">{{ item.count }}个</span>
                <span class="percent">{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 周转趋势 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>周转率趋势</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button label="month">月度</el-radio-button>
                <el-radio-button label="quarter">季度</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="trend-chart">
            <div class="chart-bars">
              <div v-for="item in trendData" :key="item.period" class="chart-bar-group">
                <div class="chart-bar" :style="{height: item.rate * 8 + 'px'}" :title="item.rate + '次'"></div>
                <div class="chart-label">{{ item.period }}</div>
                <div class="chart-value">{{ item.rate }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>物料周转率明细</span>
          <div>
            <el-input v-model="searchKeyword" placeholder="搜索物料" clearable style="width:200px;margin-right:12px" />
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredData" border stripe max-height="400">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" sortable />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column prop="avgInventory" label="平均库存" width="100" align="right" sortable>
          <template #default="{row}">¥{{ row.avgInventory.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="outboundValue" label="年出库金额" width="110" align="right" sortable>
          <template #default="{row}">¥{{ row.outboundValue.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="turnoverRate" label="周转率" width="90" align="right" sortable>
          <template #default="{row}">
            <span :class="getTurnoverClass(row.turnoverRate)">{{ row.turnoverRate.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="turnoverDays" label="周转天数" width="90" align="right" sortable>
          <template #default="{row}">
            <span :class="getDaysClass(row.turnoverDays)">{{ row.turnoverDays }}</span>
          </template>
        </el-table-column>
        <el-table-column label="评级" width="80" align="center">
          <template #default="{row}">
            <el-tag :type="getRatingType(row.turnoverRate)" size="small">{{ getRatingText(row.turnoverRate) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建议" min-width="120">
          <template #default="{row}">
            <span class="suggest-text">{{ getSuggestion(row.turnoverRate) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 计算公式说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>📊 周转率计算说明</span></template>
      <el-row :gutter="20">
        <el-col :xs="24" :md="8">
          <div class="formula-box">
            <div class="formula-title">库存周转率</div>
            <div class="formula">周转率 = 年出库金额 ÷ 平均库存金额</div>
            <div class="formula-desc">反映库存流动速度，值越高越好</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="formula-box">
            <div class="formula-title">周转天数</div>
            <div class="formula">周转天数 = 365 ÷ 周转率</div>
            <div class="formula-desc">库存平均停留时间，值越低越好</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="formula-box">
            <div class="formula-title">平均库存</div>
            <div class="formula">平均库存 = (期初 + 期末) ÷ 2</div>
            <div class="formula-desc">或各月末库存平均值</div>
          </div>
        </el-col>
      </el-row>
      <div class="rating-guide">
        <h4>评级标准：</h4>
        <el-tag type="success">优秀: ≥12次/年 (≤30天)</el-tag>
        <el-tag type="primary">良好: 6-12次/年 (30-60天)</el-tag>
        <el-tag type="warning">一般: 3-6次/年 (60-120天)</el-tag>
        <el-tag type="danger">较差: <3次/年 (>120天)</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const trendPeriod = ref('month')
const searchKeyword = ref('')
const allData = ref([])

const kpi = computed(() => {
  const data = allData.value
  if (!data.length) return { avgTurnover: 0, avgDays: 0, highTurnover: 0, lowTurnover: 0 }
  const avgTurnover = data.reduce((s, d) => s + d.turnoverRate, 0) / data.length
  const avgDays = data.reduce((s, d) => s + d.turnoverDays, 0) / data.length
  const highTurnover = data.filter(d => d.turnoverRate >= 12).length
  const lowTurnover = data.filter(d => d.turnoverRate < 3).length
  return { avgTurnover, avgDays, highTurnover, lowTurnover }
})

const distributionData = computed(() => {
  const data = allData.value
  const total = data.length || 1
  const ranges = [
    { range: '≥12次 (优秀)', min: 12, max: Infinity, color: '#67c23a' },
    { range: '6-12次 (良好)', min: 6, max: 12, color: '#409eff' },
    { range: '3-6次 (一般)', min: 3, max: 6, color: '#e6a23c' },
    { range: '<3次 (较差)', min: 0, max: 3, color: '#f56c6c' }
  ]
  return ranges.map(r => {
    const count = data.filter(d => d.turnoverRate >= r.min && d.turnoverRate < r.max).length
    return { ...r, count, percent: Math.round(count / total * 100) }
  })
})

const trendData = ref([
  { period: '7月', rate: 6.2 }, { period: '8月', rate: 6.5 }, { period: '9月', rate: 6.8 },
  { period: '10月', rate: 7.0 }, { period: '11月', rate: 7.1 }, { period: '12月', rate: 7.28 }
])

const filteredData = computed(() => {
  if (!searchKeyword.value) return allData.value
  const kw = searchKeyword.value.toLowerCase()
  return allData.value.filter(d => 
    d.materialCode.toLowerCase().includes(kw) || d.materialName.toLowerCase().includes(kw)
  )
})

const getTurnoverClass = rate => rate >= 12 ? 'text-success' : rate >= 6 ? 'text-primary' : rate >= 3 ? 'text-warning' : 'text-danger'
const getDaysClass = days => days <= 30 ? 'text-success' : days <= 60 ? 'text-primary' : days <= 120 ? 'text-warning' : 'text-danger'
const getRatingType = rate => rate >= 12 ? 'success' : rate >= 6 ? 'primary' : rate >= 3 ? 'warning' : 'danger'
const getRatingText = rate => rate >= 12 ? '优秀' : rate >= 6 ? '良好' : rate >= 3 ? '一般' : '较差'
const getSuggestion = rate => {
  if (rate >= 12) return '保持现状'
  if (rate >= 6) return '可适当减少安全库存'
  if (rate >= 3) return '建议优化采购计划'
  return '需重点关注，考虑促销或调拨'
}

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '分类', '平均库存', '年出库金额', '周转率', '周转天数', '评级'].join(','),
    ...filteredData.value.map(r => [r.materialCode, r.materialName, r.category, r.avgInventory, r.outboundValue, r.turnoverRate.toFixed(2), r.turnoverDays, getRatingText(r.turnoverRate)].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `周转率分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const categories = ['MRO备件', '原材料', '包装材料', '办公用品', '设备配件']
  allData.value = Array(100).fill(null).map((_, i) => {
    const avgInventory = Math.floor(Math.random() * 50000) + 5000
    const turnoverRate = Math.random() * 15 + 1
    return {
      id: i + 1,
      materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `物料名称${i + 1}`,
      category: categories[i % 5],
      avgInventory,
      outboundValue: Math.floor(avgInventory * turnoverRate),
      turnoverRate,
      turnoverDays: Math.round(365 / turnoverRate)
    }
  })
})
</script>

<style scoped>
.turnover-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-value { font-size: 32px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }

.distribution-chart { padding: 10px 0; }
.dist-item { display: flex; align-items: center; margin-bottom: 16px; }
.dist-label { width: 120px; font-size: 13px; }
.dist-bar-bg { flex: 1; height: 24px; background: #ebeef5; border-radius: 12px; overflow: hidden; margin: 0 12px; }
.dist-bar { height: 100%; border-radius: 12px; transition: width 0.5s; }
.dist-info { width: 100px; text-align: right; font-size: 13px; }
.dist-info .count { margin-right: 8px; }
.dist-info .percent { color: #409eff; font-weight: bold; }

.trend-chart { padding: 20px 0; }
.chart-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 150px; }
.chart-bar-group { text-align: center; }
.chart-bar { width: 40px; background: linear-gradient(180deg, #409eff, #66b1ff); border-radius: 4px 4px 0 0; }
.chart-label { font-size: 12px; color: #909399; margin-top: 8px; }
.chart-value { font-size: 14px; color: #409eff; font-weight: bold; }

.formula-box { background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.formula-title { font-weight: bold; color: #303133; margin-bottom: 8px; }
.formula { font-family: 'Courier New', monospace; color: #409eff; font-size: 14px; margin-bottom: 8px; }
.formula-desc { font-size: 12px; color: #909399; }
.rating-guide { margin-top: 16px; }
.rating-guide h4 { margin-bottom: 12px; }
.rating-guide .el-tag { margin-right: 12px; }

.text-success { color: #67c23a; font-weight: 600; }
.text-primary { color: #409eff; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.suggest-text { font-size: 12px; color: #909399; }
</style>
