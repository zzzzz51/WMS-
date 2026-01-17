<template>
  <div class="abc-analysis">
    <h2>ABC分类分析</h2>
    
    <!-- 分类统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="stat-card class-a">
          <div class="class-header">
            <span class="class-tag">A类</span>
            <span class="class-desc">重点管控</span>
          </div>
          <div class="class-stats">
            <div class="stat-item">
              <span class="stat-value">{{ classStats.a.count }}</span>
              <span class="stat-unit">SKU ({{ classStats.a.skuPercent }}%)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">¥{{ (classStats.a.value / 10000).toFixed(1) }}万</span>
              <span class="stat-unit">金额 ({{ classStats.a.valuePercent }}%)</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="stat-card class-b">
          <div class="class-header">
            <span class="class-tag">B类</span>
            <span class="class-desc">常规管理</span>
          </div>
          <div class="class-stats">
            <div class="stat-item">
              <span class="stat-value">{{ classStats.b.count }}</span>
              <span class="stat-unit">SKU ({{ classStats.b.skuPercent }}%)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">¥{{ (classStats.b.value / 10000).toFixed(1) }}万</span>
              <span class="stat-unit">金额 ({{ classStats.b.valuePercent }}%)</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="stat-card class-c">
          <div class="class-header">
            <span class="class-tag">C类</span>
            <span class="class-desc">简化管理</span>
          </div>
          <div class="class-stats">
            <div class="stat-item">
              <span class="stat-value">{{ classStats.c.count }}</span>
              <span class="stat-unit">SKU ({{ classStats.c.skuPercent }}%)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">¥{{ (classStats.c.value / 10000).toFixed(1) }}万</span>
              <span class="stat-unit">金额 ({{ classStats.c.valuePercent }}%)</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- ABC分布图 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>ABC分类分布</span></template>
          <div class="pie-chart">
            <div class="pie-ring">
              <div class="ring-a" :style="{'--a-deg': classStats.a.valuePercent * 3.6 + 'deg'}"></div>
              <div class="ring-b" :style="{'--b-start': classStats.a.valuePercent * 3.6 + 'deg', '--b-deg': classStats.b.valuePercent * 3.6 + 'deg'}"></div>
              <div class="ring-center">
                <div class="center-value">¥{{ (totalValue / 10000).toFixed(0) }}万</div>
                <div class="center-label">库存总额</div>
              </div>
            </div>
            <div class="pie-legend">
              <div class="legend-item"><span class="dot a"></span>A类 {{ classStats.a.valuePercent }}%</div>
              <div class="legend-item"><span class="dot b"></span>B类 {{ classStats.b.valuePercent }}%</div>
              <div class="legend-item"><span class="dot c"></span>C类 {{ classStats.c.valuePercent }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 管理策略 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <template #header><span>分类管理策略</span></template>
          <div class="strategy-list">
            <div class="strategy-item a">
              <div class="strategy-header">
                <el-tag type="danger" effect="dark">A类物料</el-tag>
                <span class="strategy-rule">金额占70-80%，SKU占10-20%</span>
              </div>
              <ul class="strategy-points">
                <li>重点监控，精确预测需求</li>
                <li>缩短采购周期，降低库存</li>
                <li>频繁盘点（每周/每月）</li>
                <li>与供应商建立战略合作</li>
              </ul>
            </div>
            <div class="strategy-item b">
              <div class="strategy-header">
                <el-tag type="warning" effect="dark">B类物料</el-tag>
                <span class="strategy-rule">金额占15-20%，SKU占20-30%</span>
              </div>
              <ul class="strategy-points">
                <li>常规管理，适中库存</li>
                <li>定期审核采购策略</li>
                <li>季度盘点</li>
              </ul>
            </div>
            <div class="strategy-item c">
              <div class="strategy-header">
                <el-tag type="info" effect="dark">C类物料</el-tag>
                <span class="strategy-rule">金额占5-10%，SKU占50-70%</span>
              </div>
              <ul class="strategy-points">
                <li>简化管理，批量采购</li>
                <li>适当增加安全库存</li>
                <li>年度盘点即可</li>
              </ul>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 物料明细 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>物料ABC分类明细</span>
          <div>
            <el-radio-group v-model="filterClass" size="small" style="margin-right:12px">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="A">A类</el-radio-button>
              <el-radio-button label="B">B类</el-radio-button>
              <el-radio-button label="C">C类</el-radio-button>
            </el-radio-group>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredData" border stripe max-height="400">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" sortable />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category" label="物料分类" width="100" />
        <el-table-column prop="annualUsage" label="年消耗量" width="100" align="right" sortable />
        <el-table-column prop="price" label="单价" width="90" align="right">
          <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="annualValue" label="年消耗金额" width="120" align="right" sortable>
          <template #default="{row}">¥{{ row.annualValue.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="cumulativePercent" label="累计占比" width="100" align="right">
          <template #default="{row}">{{ row.cumulativePercent.toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column prop="abcClass" label="ABC分类" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getClassType(row.abcClass)" effect="dark" size="small">{{ row.abcClass }}类</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="管理建议" min-width="140">
          <template #default="{row}">
            <span class="suggest-text">{{ getClassSuggestion(row.abcClass) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分类说明 -->
    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>📊 ABC分类计算说明</span></template>
      <div class="calc-steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <div class="step-title">计算年消耗金额</div>
            <div class="step-desc">年消耗金额 = 年消耗量 × 单价</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <div class="step-title">按金额降序排列</div>
            <div class="step-desc">将所有物料按年消耗金额从高到低排序</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <div class="step-title">计算累计占比</div>
            <div class="step-desc">逐项累加金额，计算占总金额的百分比</div>
          </div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-content">
            <div class="step-title">划分ABC类别</div>
            <div class="step-desc">累计≤80%为A类，≤95%为B类，其余为C类</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const filterClass = ref('')
const allData = ref([])

const totalValue = computed(() => allData.value.reduce((s, d) => s + d.annualValue, 0))

const classStats = computed(() => {
  const data = allData.value
  const total = data.length || 1
  const totalVal = totalValue.value || 1
  const aItems = data.filter(d => d.abcClass === 'A')
  const bItems = data.filter(d => d.abcClass === 'B')
  const cItems = data.filter(d => d.abcClass === 'C')
  return {
    a: { count: aItems.length, skuPercent: Math.round(aItems.length / total * 100), value: aItems.reduce((s, d) => s + d.annualValue, 0), valuePercent: Math.round(aItems.reduce((s, d) => s + d.annualValue, 0) / totalVal * 100) },
    b: { count: bItems.length, skuPercent: Math.round(bItems.length / total * 100), value: bItems.reduce((s, d) => s + d.annualValue, 0), valuePercent: Math.round(bItems.reduce((s, d) => s + d.annualValue, 0) / totalVal * 100) },
    c: { count: cItems.length, skuPercent: Math.round(cItems.length / total * 100), value: cItems.reduce((s, d) => s + d.annualValue, 0), valuePercent: Math.round(cItems.reduce((s, d) => s + d.annualValue, 0) / totalVal * 100) }
  }
})

const filteredData = computed(() => {
  if (!filterClass.value) return allData.value
  return allData.value.filter(d => d.abcClass === filterClass.value)
})

const getClassType = c => ({ A: 'danger', B: 'warning', C: 'info' }[c] || 'info')
const getClassSuggestion = c => ({ A: '重点管控，精确预测', B: '常规管理，定期审核', C: '简化管理，批量采购' }[c] || '')

const handleExport = () => {
  const csv = [['物料编码', '物料名称', '分类', '年消耗量', '单价', '年消耗金额', '累计占比', 'ABC分类'].join(','),
    ...filteredData.value.map(r => [r.materialCode, r.materialName, r.category, r.annualUsage, r.price, r.annualValue, r.cumulativePercent.toFixed(1) + '%', r.abcClass + '类'].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `ABC分类分析_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const categories = ['MRO备件', '原材料', '包装材料', '办公用品', '设备配件']
  // 生成数据并排序
  let data = Array(100).fill(null).map((_, i) => {
    const price = Math.floor(Math.random() * 500) + 50
    const annualUsage = Math.floor(Math.random() * 1000) + 100
    return {
      id: i + 1,
      materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
      materialName: `物料名称${i + 1}`,
      category: categories[i % 5],
      price,
      annualUsage,
      annualValue: price * annualUsage
    }
  })
  // 按金额降序排序
  data.sort((a, b) => b.annualValue - a.annualValue)
  // 计算累计占比和ABC分类
  const total = data.reduce((s, d) => s + d.annualValue, 0)
  let cumulative = 0
  data.forEach(item => {
    cumulative += item.annualValue
    item.cumulativePercent = cumulative / total * 100
    item.abcClass = item.cumulativePercent <= 80 ? 'A' : item.cumulativePercent <= 95 ? 'B' : 'C'
  })
  allData.value = data
})
</script>

<style scoped>
.abc-analysis { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { color: white; }
.stat-card.class-a { background: linear-gradient(135deg, #f56c6c, #f89898); }
.stat-card.class-b { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.class-c { background: linear-gradient(135deg, #909399, #a6a9ad); }
.class-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.class-tag { font-size: 24px; font-weight: bold; }
.class-desc { font-size: 13px; opacity: 0.9; }
.class-stats { display: flex; justify-content: space-around; }
.stat-item { text-align: center; }
.stat-item .stat-value { display: block; font-size: 20px; font-weight: bold; }
.stat-item .stat-unit { font-size: 12px; opacity: 0.8; }

.pie-chart { display: flex; align-items: center; padding: 20px; }
.pie-ring { position: relative; width: 160px; height: 160px; border-radius: 50%; background: conic-gradient(#f56c6c 0deg var(--a-deg, 288deg), #e6a23c var(--a-deg, 288deg) calc(var(--a-deg, 288deg) + var(--b-deg, 54deg)), #909399 calc(var(--a-deg, 288deg) + var(--b-deg, 54deg)) 360deg); margin-right: 30px; }
.ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.center-value { font-size: 18px; font-weight: bold; color: #303133; }
.center-label { font-size: 12px; color: #909399; }
.pie-legend { flex: 1; }
.legend-item { margin: 12px 0; font-size: 14px; display: flex; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
.dot.a { background: #f56c6c; }
.dot.b { background: #e6a23c; }
.dot.c { background: #909399; }

.strategy-list { }
.strategy-item { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
.strategy-item.a { background: #fef0f0; }
.strategy-item.b { background: #fdf6ec; }
.strategy-item.c { background: #f4f4f5; }
.strategy-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.strategy-rule { font-size: 12px; color: #909399; }
.strategy-points { margin: 0; padding-left: 20px; font-size: 13px; color: #606266; }
.strategy-points li { margin: 4px 0; }

.calc-steps { display: flex; gap: 20px; flex-wrap: wrap; }
.step { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 200px; }
.step-num { width: 32px; height: 32px; background: #409eff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.step-title { font-weight: bold; color: #303133; margin-bottom: 4px; }
.step-desc { font-size: 13px; color: #909399; }
.suggest-text { font-size: 12px; color: #909399; }
</style>
