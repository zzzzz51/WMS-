<template>
  <div class="age-analysis">
    <h2>库龄分析</h2>
    
    <!-- 库龄统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ ageStats.fresh.count }}</div>
          <div class="stat-label">新鲜库存 (0-30天)</div>
          <div class="stat-percent">占比 {{ ageStats.fresh.percent }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ ageStats.normal.count }}</div>
          <div class="stat-label">正常库存 (31-90天)</div>
          <div class="stat-percent">占比 {{ ageStats.normal.percent }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ ageStats.aging.count }}</div>
          <div class="stat-label">老化库存 (91-180天)</div>
          <div class="stat-percent">占比 {{ ageStats.aging.percent }}%</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red">
          <div class="stat-value">{{ ageStats.old.count }}</div>
          <div class="stat-label">超龄库存 (>180天)</div>
          <div class="stat-percent">占比 {{ ageStats.old.percent }}%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 库龄分布图 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>库龄金额分布</span></template>
          <div class="age-chart">
            <div class="stacked-bar">
              <div class="bar-segment fresh" :style="{width: ageStats.fresh.valuePercent + '%'}" :title="'新鲜: ' + ageStats.fresh.valuePercent + '%'"></div>
              <div class="bar-segment normal" :style="{width: ageStats.normal.valuePercent + '%'}" :title="'正常: ' + ageStats.normal.valuePercent + '%'"></div>
              <div class="bar-segment aging" :style="{width: ageStats.aging.valuePercent + '%'}" :title="'老化: ' + ageStats.aging.valuePercent + '%'"></div>
              <div class="bar-segment old" :style="{width: ageStats.old.valuePercent + '%'}" :title="'超龄: ' + ageStats.old.valuePercent + '%'"></div>
            </div>
            <div class="bar-legend">
              <div class="legend-item"><span class="dot fresh"></span>新鲜 ¥{{ (ageStats.fresh.value / 10000).toFixed(1) }}万 ({{ ageStats.fresh.valuePercent }}%)</div>
              <div class="legend-item"><span class="dot normal"></span>正常 ¥{{ (ageStats.normal.value / 10000).toFixed(1) }}万 ({{ ageStats.normal.valuePercent }}%)</div>
              <div class="legend-item"><span class="dot aging"></span>老化 ¥{{ (ageStats.aging.value / 10000).toFixed(1) }}万 ({{ ageStats.aging.valuePercent }}%)</div>
              <div class="legend-item"><span class="dot old"></span>超龄 ¥{{ (ageStats.old.value / 10000).toFixed(1) }}万 ({{ ageStats.old.valuePercent }}%)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 库龄周转率对比 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>各库龄段周转率对比</span></template>
          <div class="turnover-compare">
            <div v-for="item in turnoverCompare" :key="item.age" class="compare-item">
              <div class="compare-label">{{ item.age }}</div>
              <div class="compare-bar-bg">
                <div class="compare-bar" :style="{width: item.rate / 15 * 100 + '%', background: item.color}"></div>
              </div>
              <div class="compare-value">{{ item.rate.toFixed(1) }}次/年</div>
              <div class="compare-days">{{ item.days }}天</div>
            </div>
          </div>
          <div class="compare-summary">
            <p>📊 分析结论：</p>
            <ul>
              <li>新鲜库存周转率最高，说明近期入库物料流动性好</li>
              <li>超龄库存周转率极低，需重点关注处理</li>
              <li>建议将老化和超龄库存控制在总金额的 <strong>15%</strong> 以内</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 物料明细 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>库龄明细</span>
          <div>
            <el-radio-group v-model="filterAge" size="small" style="margin-right:12px">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="fresh">新鲜</el-radio-button>
              <el-radio-button label="normal">正常</el-radio-button>
              <el-radio-button label="aging">老化</el-radio-button>
              <el-radio-button label="old">超龄</el-radio-button>
            </el-radio-group>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredData" border stripe max-height="400">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="batchNo" label="批次号" width="140" />
        <el-table-column prop="warehouse" label="仓库" width="90" />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="value" label="金额" width="100" align="right">
          <template #default="{row}">¥{{ row.value.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="inboundDate" label="入库日期" width="100" />
        <el-table-column prop="age" label="库龄(天)" width="90" align="right" sortable>
          <template #default="{row}">
            <span :class="getAgeClass(row.age)">{{ row.age }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库龄等级" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getAgeType(row.ageLevel)" size="small" effect="dark">{{ getAgeLevelText(row.ageLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="turnoverRate" label="周转率" width="80" align="right">
          <template #default="{row}">{{ row.turnoverRate.toFixed(1) }}</template>
        </el-table-column>
        <el-table-column label="建议" min-width="120">
          <template #default="{row}">
            <span class="suggest-text">{{ getAgeSuggestion(row.ageLevel) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 库龄说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>📊 库龄计算与管理说明</span></template>
      <el-row :gutter="20">
        <el-col :xs="24" :md="6">
          <div class="info-box fresh">
            <div class="info-title">新鲜库存 (0-30天)</div>
            <div class="info-desc">刚入库物料，流动性最佳</div>
            <div class="info-action">正常管理</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="info-box normal">
            <div class="info-title">正常库存 (31-90天)</div>
            <div class="info-desc">库龄正常范围内</div>
            <div class="info-action">定期关注</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="info-box aging">
            <div class="info-title">老化库存 (91-180天)</div>
            <div class="info-desc">库龄偏长，需关注</div>
            <div class="info-action">优先消耗</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="info-box old">
            <div class="info-title">超龄库存 (>180天)</div>
            <div class="info-desc">长期积压，占用资金</div>
            <div class="info-action">促销/调拨/报废</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const filterAge = ref('')
const allData = ref([])

const ageStats = computed(() => {
  const data = allData.value
  const total = data.length || 1
  const totalValue = data.reduce((s, d) => s + d.value, 0) || 1
  const fresh = data.filter(d => d.ageLevel === 'fresh')
  const normal = data.filter(d => d.ageLevel === 'normal')
  const aging = data.filter(d => d.ageLevel === 'aging')
  const old = data.filter(d => d.ageLevel === 'old')
  return {
    fresh: { count: fresh.length, percent: Math.round(fresh.length / total * 100), value: fresh.reduce((s, d) => s + d.value, 0), valuePercent: Math.round(fresh.reduce((s, d) => s + d.value, 0) / totalValue * 100) },
    normal: { count: normal.length, percent: Math.round(normal.length / total * 100), value: normal.reduce((s, d) => s + d.value, 0), valuePercent: Math.round(normal.reduce((s, d) => s + d.value, 0) / totalValue * 100) },
    aging: { count: aging.length, percent: Math.round(aging.length / total * 100), value: aging.reduce((s, d) => s + d.value, 0), valuePercent: Math.round(aging.reduce((s, d) => s + d.value, 0) / totalValue * 100) },
    old: { count: old.length, percent: Math.round(old.length / total * 100), value: old.reduce((s, d) => s + d.value, 0), valuePercent: Math.round(old.reduce((s, d) => s + d.value, 0) / totalValue * 100) }
  }
})

const turnoverCompare = computed(() => [
  { age: '新鲜(0-30天)', rate: 12.5, days: 29, color: '#67c23a' },
  { age: '正常(31-90天)', rate: 6.8, days: 54, color: '#409eff' },
  { age: '老化(91-180天)', rate: 3.2, days: 114, color: '#e6a23c' },
  { age: '超龄(>180天)', rate: 1.2, days: 304, color: '#f56c6c' }
])

const filteredData = computed(() => {
  if (!filterAge.value) return allData.value
  return allData.value.filter(d => d.ageLevel === filterAge.value)
})

const getAgeClass = age => age > 180 ? 'text-danger' : age > 90 ? 'text-warning' : age > 30 ? 'text-primary' : 'text-success'
const getAgeType = level => ({ fresh: 'success', normal: 'primary', aging: 'warning', old: 'danger' }[level] || 'info')
const getAgeLevelText = level => ({ fresh: '新鲜', normal: '正常', aging: '老化', old: '超龄' }[level] || level)
const getAgeSuggestion = level => ({ fresh: '正常管理', normal: '定期关注', aging: '优先消耗', old: '尽快处理' }[level] || '')

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '批次号', '仓库', '数量', '金额', '入库日期', '库龄', '等级', '周转率'].join(','),
    ...filteredData.value.map(r => [r.materialCode, r.materialName, r.batchNo, r.warehouse, r.quantity, r.value, r.inboundDate, r.age, getAgeLevelText(r.ageLevel), r.turnoverRate.toFixed(1)].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `库龄分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const warehouses = ['MRO主仓', '原料仓', '成品仓', '备件仓']
  allData.value = Array(100).fill(null).map((_, i) => {
    const age = Math.floor(Math.random() * 300) + 1
    const price = Math.floor(Math.random() * 200) + 30
    const quantity = Math.floor(Math.random() * 100) + 10
    const inboundDate = new Date(Date.now() - age * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const ageLevel = age <= 30 ? 'fresh' : age <= 90 ? 'normal' : age <= 180 ? 'aging' : 'old'
    const turnoverRate = age <= 30 ? 10 + Math.random() * 5 : age <= 90 ? 5 + Math.random() * 4 : age <= 180 ? 2 + Math.random() * 2 : Math.random() * 2
    return {
      id: i + 1,
      materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `物料名称${i + 1}`,
      batchNo: `BT${inboundDate.replace(/-/g, '')}${String(i).padStart(4, '0')}`,
      warehouse: warehouses[i % 4],
      quantity, value: quantity * price,
      inboundDate, age, ageLevel, turnoverRate
    }
  })
})
</script>

<style scoped>
.age-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-value { font-size: 32px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }
.stat-percent { font-size: 12px; opacity: 0.8; margin-top: 4px; }

.age-chart { padding: 20px 0; }
.stacked-bar { height: 40px; display: flex; border-radius: 20px; overflow: hidden; margin-bottom: 20px; }
.bar-segment { height: 100%; transition: width 0.5s; }
.bar-segment.fresh { background: #67c23a; }
.bar-segment.normal { background: #409eff; }
.bar-segment.aging { background: #e6a23c; }
.bar-segment.old { background: #f56c6c; }
.bar-legend { display: flex; flex-wrap: wrap; gap: 16px; }
.legend-item { font-size: 13px; display: flex; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; }
.dot.fresh { background: #67c23a; }
.dot.normal { background: #409eff; }
.dot.aging { background: #e6a23c; }
.dot.old { background: #f56c6c; }

.turnover-compare { margin-bottom: 20px; }
.compare-item { display: flex; align-items: center; margin-bottom: 12px; }
.compare-label { width: 120px; font-size: 13px; }
.compare-bar-bg { flex: 1; height: 20px; background: #ebeef5; border-radius: 10px; overflow: hidden; margin: 0 12px; }
.compare-bar { height: 100%; border-radius: 10px; }
.compare-value { width: 70px; text-align: right; font-weight: bold; color: #409eff; }
.compare-days { width: 50px; text-align: right; font-size: 12px; color: #909399; }
.compare-summary { background: #f5f7fa; padding: 12px; border-radius: 8px; font-size: 13px; }
.compare-summary p { margin: 0 0 8px; font-weight: bold; }
.compare-summary ul { margin: 0; padding-left: 20px; }
.compare-summary li { margin: 4px 0; color: #606266; }

.info-box { padding: 16px; border-radius: 8px; text-align: center; }
.info-box.fresh { background: #f0f9eb; border: 1px solid #c2e7b0; }
.info-box.normal { background: #ecf5ff; border: 1px solid #b3d8ff; }
.info-box.aging { background: #fdf6ec; border: 1px solid #f5dab1; }
.info-box.old { background: #fef0f0; border: 1px solid #fbc4c4; }
.info-title { font-weight: bold; color: #303133; margin-bottom: 8px; }
.info-desc { font-size: 13px; color: #606266; margin-bottom: 8px; }
.info-action { font-size: 12px; color: #909399; }

.text-success { color: #67c23a; font-weight: 600; }
.text-primary { color: #409eff; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.suggest-text { font-size: 12px; color: #909399; }
</style>
