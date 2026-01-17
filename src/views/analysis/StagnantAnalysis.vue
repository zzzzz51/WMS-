<template>
  <div class="stagnant-analysis">
    <h2>呆滞物分析</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.totalSku }}</div>
          <div class="stat-label">呆滞SKU数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red">
          <div class="stat-value">¥{{ (stats.totalValue / 10000).toFixed(1) }}万</div>
          <div class="stat-label">呆滞库存金额</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.stagnantRate.toFixed(1) }}%</div>
          <div class="stat-label">呆滞率</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-value">{{ stats.avgDays }}</div>
          <div class="stat-label">平均呆滞天数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 呆滞分段统计 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>呆滞天数分布</span></template>
          <div class="segment-chart">
            <div v-for="item in segmentData" :key="item.range" class="segment-item">
              <div class="segment-label">{{ item.range }}</div>
              <div class="segment-bar-bg">
                <div class="segment-bar" :style="{width: item.percent + '%', background: item.color}"></div>
              </div>
              <div class="segment-info">
                <span class="sku-count">{{ item.count }}个</span>
                <span class="value">¥{{ (item.value / 10000).toFixed(1) }}万</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 处理建议 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>呆滞物处理建议</span></template>
          <div class="suggestion-list">
            <div class="suggestion-item warning">
              <div class="suggestion-header">
                <el-icon><Timer /></el-icon>
                <span class="range">90-120天</span>
              </div>
              <div class="suggestion-action">促销出清 / 内部调拨</div>
              <div class="suggestion-count">{{ getSegmentCount('90-120') }} 个物料</div>
            </div>
            <div class="suggestion-item danger">
              <div class="suggestion-header">
                <el-icon><Warning /></el-icon>
                <span class="range">120-180天</span>
              </div>
              <div class="suggestion-action">降价处理 / 退货供应商</div>
              <div class="suggestion-count">{{ getSegmentCount('120-180') }} 个物料</div>
            </div>
            <div class="suggestion-item critical">
              <div class="suggestion-header">
                <el-icon><CircleCloseFilled /></el-icon>
                <span class="range">180-360天</span>
              </div>
              <div class="suggestion-action">评估报废 / 计提减值</div>
              <div class="suggestion-count">{{ getSegmentCount('180-360') }} 个物料</div>
            </div>
            <div class="suggestion-item severe">
              <div class="suggestion-header">
                <el-icon><Delete /></el-icon>
                <span class="range">>360天</span>
              </div>
              <div class="suggestion-action">申请报废 / 全额计提</div>
              <div class="suggestion-count">{{ getSegmentCount('>360') }} 个物料</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 物料明细 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>呆滞物料明细</span>
          <div>
            <el-select v-model="filterSegment" placeholder="呆滞天数" clearable style="width:130px;margin-right:12px">
              <el-option label="90-120天" value="90-120" />
              <el-option label="120-180天" value="120-180" />
              <el-option label="180-360天" value="180-360" />
              <el-option label=">360天" value=">360" />
            </el-select>
            <el-button type="warning" @click="handleBatchProcess" :disabled="!selectedRows.length">
              批量处理 ({{ selectedRows.length }})
            </el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredData" border stripe max-height="400" @selection-change="rows => selectedRows = rows">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="warehouse" label="仓库" width="90" />
        <el-table-column prop="quantity" label="库存数量" width="90" align="right" />
        <el-table-column prop="price" label="单价" width="90" align="right">
          <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="value" label="库存金额" width="110" align="right">
          <template #default="{row}"><span class="text-danger">¥{{ row.value.toLocaleString() }}</span></template>
        </el-table-column>
        <el-table-column prop="lastOutDate" label="最后出库日" width="100" />
        <el-table-column prop="stagnantDays" label="呆滞天数" width="90" align="right" sortable>
          <template #default="{row}">
            <span :class="getDaysClass(row.stagnantDays)">{{ row.stagnantDays }}天</span>
          </template>
        </el-table-column>
        <el-table-column label="呆滞等级" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getLevelType(row.stagnantDays)" size="small" effect="dark">{{ getLevelText(row.stagnantDays) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleTransfer(row)">调拨</el-button>
            <el-button type="danger" link size="small" @click="handleScrap(row)">报废</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 呆滞判定说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>📊 呆滞判定标准</span></template>
      <el-row :gutter="20">
        <el-col :xs="24" :md="8">
          <div class="rule-box">
            <div class="rule-title">呆滞判定</div>
            <div class="rule-content">超过 <strong>90天</strong> 无出库记录的物料即为呆滞物料</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="rule-box">
            <div class="rule-title">呆滞率计算</div>
            <div class="rule-formula">呆滞率 = 呆滞库存金额 ÷ 总库存金额 × 100%</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="rule-box">
            <div class="rule-title">目标指标</div>
            <div class="rule-content">呆滞率应控制在 <strong style="color:#67c23a">10%</strong> 以内</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer, Warning, CircleCloseFilled, Delete } from '@element-plus/icons-vue'

const filterSegment = ref('')
const selectedRows = ref([])
const allData = ref([])
const totalInventoryValue = ref(5000000)

const stats = computed(() => ({
  totalSku: allData.value.length,
  totalValue: allData.value.reduce((s, d) => s + d.value, 0),
  stagnantRate: allData.value.reduce((s, d) => s + d.value, 0) / totalInventoryValue.value * 100,
  avgDays: Math.round(allData.value.reduce((s, d) => s + d.stagnantDays, 0) / (allData.value.length || 1))
}))

const segmentData = computed(() => {
  const segments = [
    { range: '90-120天', min: 90, max: 120, color: '#e6a23c' },
    { range: '120-180天', min: 120, max: 180, color: '#f56c6c' },
    { range: '180-360天', min: 180, max: 360, color: '#c45656' },
    { range: '>360天', min: 360, max: Infinity, color: '#8b0000' }
  ]
  const total = allData.value.length || 1
  return segments.map(s => {
    const items = allData.value.filter(d => d.stagnantDays >= s.min && d.stagnantDays < s.max)
    return { ...s, count: items.length, value: items.reduce((sum, d) => sum + d.value, 0), percent: Math.round(items.length / total * 100) }
  })
})

const getSegmentCount = range => {
  const seg = segmentData.value.find(s => s.range === range || s.range === range + '天')
  return seg ? seg.count : 0
}

const filteredData = computed(() => {
  if (!filterSegment.value) return allData.value
  const ranges = { '90-120': [90, 120], '120-180': [120, 180], '180-360': [180, 360], '>360': [360, Infinity] }
  const [min, max] = ranges[filterSegment.value] || [0, Infinity]
  return allData.value.filter(d => d.stagnantDays >= min && d.stagnantDays < max)
})

const getDaysClass = days => days > 360 ? 'text-severe' : days > 180 ? 'text-critical' : days > 120 ? 'text-danger' : 'text-warning'
const getLevelType = days => days > 360 ? 'danger' : days > 180 ? 'danger' : days > 120 ? 'warning' : 'warning'
const getLevelText = days => days > 360 ? '严重' : days > 180 ? '高' : days > 120 ? '中' : '低'

const handleTransfer = row => ElMessage.info(`申请调拨: ${row.materialName}`)
const handleScrap = row => ElMessageBox.confirm(`确定申请报废 ${row.materialName}？`, '确认').then(() => ElMessage.success('已提交报废申请')).catch(() => {})
const handleBatchProcess = () => ElMessage.success(`已选择 ${selectedRows.value.length} 个物料进行批量处理`)

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '仓库', '数量', '单价', '金额', '最后出库日', '呆滞天数', '等级'].join(','),
    ...filteredData.value.map(r => [r.materialCode, r.materialName, r.warehouse, r.quantity, r.price, r.value, r.lastOutDate, r.stagnantDays, getLevelText(r.stagnantDays)].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `呆滞物分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const warehouses = ['MRO主仓', '原料仓', '成品仓', '备件仓']
  allData.value = Array(60).fill(null).map((_, i) => {
    const price = Math.floor(Math.random() * 300) + 50
    const quantity = Math.floor(Math.random() * 100) + 10
    const stagnantDays = Math.floor(Math.random() * 400) + 90
    const lastOutDate = new Date(Date.now() - stagnantDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return {
      id: i + 1,
      materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `呆滞物料${i + 1}`,
      warehouse: warehouses[i % 4],
      quantity, price, value: quantity * price,
      lastOutDate, stagnantDays
    }
  })
})
</script>

<style scoped>
.stagnant-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }

.segment-chart { padding: 10px 0; }
.segment-item { display: flex; align-items: center; margin-bottom: 16px; }
.segment-label { width: 90px; font-size: 13px; font-weight: bold; }
.segment-bar-bg { flex: 1; height: 24px; background: #ebeef5; border-radius: 12px; overflow: hidden; margin: 0 12px; }
.segment-bar { height: 100%; border-radius: 12px; }
.segment-info { width: 130px; text-align: right; font-size: 12px; }
.segment-info .sku-count { margin-right: 10px; }
.segment-info .value { color: #f56c6c; font-weight: bold; }

.suggestion-list { display: flex; flex-direction: column; gap: 12px; }
.suggestion-item { padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 16px; }
.suggestion-item.warning { background: #fdf6ec; border-left: 4px solid #e6a23c; }
.suggestion-item.danger { background: #fef0f0; border-left: 4px solid #f56c6c; }
.suggestion-item.critical { background: #fde2e2; border-left: 4px solid #c45656; }
.suggestion-item.severe { background: #f5d5d5; border-left: 4px solid #8b0000; }
.suggestion-header { display: flex; align-items: center; gap: 8px; width: 100px; }
.suggestion-header .range { font-weight: bold; font-size: 13px; }
.suggestion-action { flex: 1; color: #606266; font-size: 13px; }
.suggestion-count { font-size: 12px; color: #909399; }

.rule-box { background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center; }
.rule-title { font-weight: bold; color: #303133; margin-bottom: 8px; }
.rule-content { font-size: 14px; color: #606266; }
.rule-formula { font-family: 'Courier New', monospace; color: #409eff; font-size: 13px; }

.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-critical { color: #c45656; font-weight: 600; }
.text-severe { color: #8b0000; font-weight: 600; }
</style>
