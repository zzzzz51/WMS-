<template>
  <div class="safety-stock-analysis">
    <h2>安全库存分析</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">分析物料数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card red">
          <div class="stat-value">{{ stats.belowSafety }}</div>
          <div class="stat-label">低于安全库存</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.optimal }}</div>
          <div class="stat-label">库存合理</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.overStock }}</div>
          <div class="stat-label">超出安全库存</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 库存状态分布 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>库存状态分布</span></template>
          <div class="status-chart">
            <div v-for="item in statusData" :key="item.status" class="status-item">
              <div class="status-icon" :class="item.class">
                <el-icon :size="24"><component :is="item.icon" /></el-icon>
              </div>
              <div class="status-info">
                <div class="status-name">{{ item.name }}</div>
                <div class="status-count">{{ item.count }} 个 ({{ item.percent }}%)</div>
              </div>
              <div class="status-bar-bg">
                <div class="status-bar" :style="{width: item.percent + '%'}" :class="item.class"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 计算参数设置 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>安全库存计算参数</span></template>
          <el-form label-width="120px" size="small">
            <el-form-item label="计算方式">
              <el-radio-group v-model="calcMethod">
                <el-radio label="standard">标准公式</el-radio>
                <el-radio label="simple">简化公式</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="服务水平" v-if="calcMethod === 'standard'">
              <el-select v-model="serviceLevel" style="width:200px">
                <el-option label="90% (Z=1.28)" :value="0.90" />
                <el-option label="95% (Z=1.65)" :value="0.95" />
                <el-option label="97% (Z=1.88)" :value="0.97" />
                <el-option label="99% (Z=2.33)" :value="0.99" />
              </el-select>
            </el-form-item>
            <el-form-item label="安全系数" v-else>
              <el-slider v-model="safetyFactor" :min="0.2" :max="0.8" :step="0.1" show-input style="width:300px" />
            </el-form-item>
            <el-form-item label="默认采购周期">
              <el-input-number v-model="defaultLeadTime" :min="1" :max="90" /> 天
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="recalculate">重新计算</el-button>
            </el-form-item>
          </el-form>
          <div class="formula-display">
            <div class="formula-title">当前使用公式:</div>
            <div class="formula-text" v-if="calcMethod === 'standard'">
              安全库存 = Z × σ × √L<br/>
              <span class="formula-note">Z={{ getZValue(serviceLevel) }}, σ=需求标准差, L=采购周期</span>
            </div>
            <div class="formula-text" v-else>
              安全库存 = 日均需求 × 采购周期 × {{ safetyFactor }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 物料明细 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>安全库存分析明细</span>
          <div>
            <el-select v-model="filterStatus" placeholder="库存状态" clearable style="width:130px;margin-right:12px">
              <el-option label="低于安全库存" value="below" />
              <el-option label="库存合理" value="optimal" />
              <el-option label="超出安全库存" value="over" />
            </el-select>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredData" border stripe max-height="400">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="dailyUsage" label="日均消耗" width="90" align="right" />
        <el-table-column prop="leadTime" label="采购周期" width="80" align="right">
          <template #default="{row}">{{ row.leadTime }}天</template>
        </el-table-column>
        <el-table-column prop="safetyStock" label="安全库存" width="90" align="right">
          <template #default="{row}"><span class="text-primary">{{ row.safetyStock }}</span></template>
        </el-table-column>
        <el-table-column prop="reorderPoint" label="补货点" width="80" align="right">
          <template #default="{row}"><span class="text-warning">{{ row.reorderPoint }}</span></template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="90" align="right">
          <template #default="{row}">
            <span :class="getStockClass(row)">{{ row.currentStock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row)" size="small">{{ getStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="缺口/盈余" width="90" align="right">
          <template #default="{row}">
            <span :class="row.gap >= 0 ? 'text-success' : 'text-danger'">
              {{ row.gap >= 0 ? '+' : '' }}{{ row.gap }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="建议操作" min-width="120">
          <template #default="{row}">
            <span class="suggest-text">{{ getSuggestion(row) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 计算说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>📊 安全库存计算说明</span></template>
      <el-row :gutter="20">
        <el-col :xs="24" :md="6">
          <div class="calc-box">
            <div class="calc-title">标准公式</div>
            <div class="calc-formula">SS = Z × σ × √L</div>
            <div class="calc-desc">适用于需求波动大的物料</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="calc-box">
            <div class="calc-title">简化公式</div>
            <div class="calc-formula">SS = D × L × α</div>
            <div class="calc-desc">D=日均需求,L=周期,α=系数</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="calc-box">
            <div class="calc-title">补货点</div>
            <div class="calc-formula">ROP = D × L + SS</div>
            <div class="calc-desc">库存降到此点时应补货</div>
          </div>
        </el-col>
        <el-col :xs="24" :md="6">
          <div class="calc-box">
            <div class="calc-title">服务水平系数</div>
            <div class="calc-table">
              <div>90% → Z=1.28</div>
              <div>95% → Z=1.65</div>
              <div>99% → Z=2.33</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, CircleCheckFilled, InfoFilled } from '@element-plus/icons-vue'

const calcMethod = ref('simple')
const serviceLevel = ref(0.95)
const safetyFactor = ref(0.4)
const defaultLeadTime = ref(7)
const filterStatus = ref('')
const allData = ref([])

const getZValue = level => ({ 0.90: 1.28, 0.95: 1.65, 0.97: 1.88, 0.99: 2.33 }[level] || 1.65)

const stats = computed(() => ({
  total: allData.value.length,
  belowSafety: allData.value.filter(d => d.currentStock < d.safetyStock).length,
  optimal: allData.value.filter(d => d.currentStock >= d.safetyStock && d.currentStock <= d.safetyStock * 2).length,
  overStock: allData.value.filter(d => d.currentStock > d.safetyStock * 2).length
}))

const statusData = computed(() => {
  const total = allData.value.length || 1
  return [
    { status: 'below', name: '低于安全库存', icon: 'WarningFilled', class: 'danger', count: stats.value.belowSafety, percent: Math.round(stats.value.belowSafety / total * 100) },
    { status: 'optimal', name: '库存合理', icon: 'CircleCheckFilled', class: 'success', count: stats.value.optimal, percent: Math.round(stats.value.optimal / total * 100) },
    { status: 'over', name: '超出安全库存', icon: 'InfoFilled', class: 'warning', count: stats.value.overStock, percent: Math.round(stats.value.overStock / total * 100) }
  ]
})

const filteredData = computed(() => {
  if (!filterStatus.value) return allData.value
  return allData.value.filter(d => {
    if (filterStatus.value === 'below') return d.currentStock < d.safetyStock
    if (filterStatus.value === 'optimal') return d.currentStock >= d.safetyStock && d.currentStock <= d.safetyStock * 2
    if (filterStatus.value === 'over') return d.currentStock > d.safetyStock * 2
    return true
  })
})

const getStockClass = row => row.currentStock < row.safetyStock ? 'text-danger' : row.currentStock > row.safetyStock * 2 ? 'text-warning' : 'text-success'
const getStatusType = row => row.currentStock < row.safetyStock ? 'danger' : row.currentStock > row.safetyStock * 2 ? 'warning' : 'success'
const getStatusText = row => row.currentStock < row.safetyStock ? '库存不足' : row.currentStock > row.safetyStock * 2 ? '库存偏高' : '库存合理'
const getSuggestion = row => {
  if (row.currentStock < row.safetyStock) return `建议补货 ${row.safetyStock - row.currentStock} 件`
  if (row.currentStock > row.safetyStock * 2) return '可考虑调拨或减少采购'
  return '保持现状'
}

const recalculate = () => {
  allData.value.forEach(item => {
    if (calcMethod.value === 'simple') {
      item.safetyStock = Math.ceil(item.dailyUsage * item.leadTime * safetyFactor.value)
    } else {
      const z = getZValue(serviceLevel.value)
      item.safetyStock = Math.ceil(z * item.stdDev * Math.sqrt(item.leadTime))
    }
    item.reorderPoint = Math.ceil(item.dailyUsage * item.leadTime + item.safetyStock)
    item.gap = item.currentStock - item.safetyStock
  })
  ElMessage.success('重新计算完成')
}

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '日均消耗', '采购周期', '安全库存', '补货点', '当前库存', '状态', '缺口/盈余'].join(','),
    ...filteredData.value.map(r => [r.materialCode, r.materialName, r.dailyUsage, r.leadTime, r.safetyStock, r.reorderPoint, r.currentStock, getStatusText(r), r.gap].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `安全库存分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  allData.value = Array(80).fill(null).map((_, i) => {
    const dailyUsage = Math.floor(Math.random() * 20) + 5
    const leadTime = Math.floor(Math.random() * 14) + 3
    const stdDev = Math.floor(Math.random() * 5) + 2
    const safetyStock = Math.ceil(dailyUsage * leadTime * 0.4)
    const reorderPoint = Math.ceil(dailyUsage * leadTime + safetyStock)
    const currentStock = Math.floor(Math.random() * safetyStock * 3) + Math.floor(safetyStock * 0.3)
    return {
      id: i + 1,
      materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `物料名称${i + 1}`,
      dailyUsage, leadTime, stdDev, safetyStock, reorderPoint, currentStock,
      gap: currentStock - safetyStock
    }
  })
})
</script>

<style scoped>
.safety-stock-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-value { font-size: 32px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }

.status-chart { padding: 10px 0; }
.status-item { display: flex; align-items: center; margin-bottom: 20px; }
.status-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; margin-right: 16px; }
.status-icon.danger { background: #f56c6c; }
.status-icon.success { background: #67c23a; }
.status-icon.warning { background: #e6a23c; }
.status-info { width: 140px; }
.status-name { font-weight: bold; color: #303133; }
.status-count { font-size: 13px; color: #909399; }
.status-bar-bg { flex: 1; height: 12px; background: #ebeef5; border-radius: 6px; overflow: hidden; }
.status-bar { height: 100%; border-radius: 6px; }
.status-bar.danger { background: #f56c6c; }
.status-bar.success { background: #67c23a; }
.status-bar.warning { background: #e6a23c; }

.formula-display { margin-top: 16px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
.formula-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.formula-text { font-family: 'Courier New', monospace; color: #409eff; font-size: 14px; }
.formula-note { font-size: 12px; color: #909399; }

.calc-box { background: #f5f7fa; padding: 16px; border-radius: 8px; text-align: center; }
.calc-title { font-weight: bold; color: #303133; margin-bottom: 8px; }
.calc-formula { font-family: 'Courier New', monospace; color: #409eff; font-size: 16px; margin-bottom: 8px; }
.calc-desc { font-size: 12px; color: #909399; }
.calc-table { font-size: 13px; color: #606266; text-align: left; }
.calc-table div { margin: 4px 0; }

.text-primary { color: #409eff; font-weight: 600; }
.text-success { color: #67c23a; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.suggest-text { font-size: 12px; color: #909399; }
</style>
