<template>
  <div class="inventory-accuracy-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">库存准确率分析</span>
          <div class="actions">
            <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点周期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部" clearable>
            <el-option 
              v-for="wh in warehouses" 
              :key="wh.code" 
              :label="wh.name" 
              :value="wh.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物料分类">
          <el-cascader
            v-model="searchForm.category"
            :options="categories"
            :props="{ expandTrigger: 'hover', value: 'code', label: 'name' }"
            placeholder="全部"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 总体准确率卡片 -->
      <div class="overall-accuracy">
        <div class="accuracy-circle">
          <div ref="gaugeChart" style="width: 300px; height: 300px;"></div>
        </div>
        <div class="accuracy-details">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">盘点总次数</div>
                <div class="value">{{ overall.totalCount }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">盘点物料数</div>
                <div class="value">{{ overall.materialCount }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">差异物料数</div>
                <div class="value error">{{ overall.diffCount }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">数量准确率</div>
                <div class="value primary">{{ overall.qtyAccuracy }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">金额准确率</div>
                <div class="value success">{{ overall.amountAccuracy }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <div class="label">储位准确率</div>
                <div class="value warning">{{ overall.locationAccuracy }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 30px">
        <el-col :span="12">
          <div class="chart-container">
            <h3>准确率趋势</h3>
            <div ref="trendChart" style="height: 350px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h3>差异原因分布</h3>
            <div ref="reasonChart" style="height: 350px"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h3>仓库准确率对比</h3>
            <div ref="warehouseChart" style="height: 350px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h3>物料分类准确率</h3>
            <div ref="categoryChart" style="height: 350px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 明细表格 -->
      <el-divider content-position="left">盘点记录明细</el-divider>
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="countNo" label="盘点单号" min-width="160" />
        <el-table-column prop="countDate" label="盘点日期" width="120" align="center" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="countType" label="盘点类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCountTypeColor(row.countType)">
              {{ getCountTypeLabel(row.countType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalItems" label="盘点物料数" width="110" align="right" />
        <el-table-column prop="diffItems" label="差异物料数" width="110" align="right" />
        <el-table-column label="数量准确率" width="110" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.qtyAccuracy" 
              :color="getAccuracyColor(row.qtyAccuracy)"
            />
          </template>
        </el-table-column>
        <el-table-column label="金额准确率" width="110" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.amountAccuracy" 
              :color="getAccuracyColor(row.amountAccuracy)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="盘点人" width="100" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  dateRange: [],
  warehouse: '',
  category: []
})

// 总体数据
const overall = reactive({
  totalCount: 0,
  materialCount: 0,
  diffCount: 0,
  qtyAccuracy: 0,
  amountAccuracy: 0,
  locationAccuracy: 0
})

// 列表数据
const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const warehouses = ref([])
const categories = ref([])

// 图表实例
const gaugeChart = ref(null)
const trendChart = ref(null)
const reasonChart = ref(null)
const warehouseChart = ref(null)
const categoryChart = ref(null)

let gaugeChartInstance = null
let trendChartInstance = null
let reasonChartInstance = null
let warehouseChartInstance = null
let categoryChartInstance = null

// 盘点类型映射
const countTypeMap = {
  'FULL': '全盘',
  'CYCLE': '循环盘点',
  'SPOT': '抽盘',
  'DYNAMIC': '动态盘点'
}

const getCountTypeLabel = (type) => countTypeMap[type] || type
const getCountTypeColor = (type) => {
  const colors = {
    'FULL': 'danger',
    'CYCLE': 'primary',
    'SPOT': 'warning',
    'DYNAMIC': 'info'
  }
  return colors[type] || ''
}

// 准确率颜色
const getAccuracyColor = (accuracy) => {
  if (accuracy >= 99) return '#67C23A'
  if (accuracy >= 95) return '#E6A23C'
  return '#F56C6C'
}

// 加载基础数据
const loadMasterData = async () => {
  try {
    const [whRes, catRes] = await Promise.all([
      request.get('/master/warehouses'),
      request.get('/master/categories')
    ])
    warehouses.value = whRes.data
    categories.value = catRes.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/analysis/inventory-accuracy', {
      params: {
        startMonth: searchForm.dateRange?.[0],
        endMonth: searchForm.dateRange?.[1],
        warehouse: searchForm.warehouse,
        category: searchForm.category?.join(','),
        page: pagination.page,
        size: pagination.size
      }
    })
    
    // 更新总体数据
    Object.assign(overall, res.data.overall)
    
    // 更新表格
    tableData.value = res.data.details.records
    pagination.total = res.data.details.total
    
    // 更新图表
    nextTick(() => {
      updateGaugeChart(overall.qtyAccuracy)
      updateTrendChart(res.data.trendData)
      updateReasonChart(res.data.reasonData)
      updateWarehouseChart(res.data.warehouseData)
      updateCategoryChart(res.data.categoryData)
    })
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 更新仪表盘
const updateGaugeChart = (accuracy) => {
  if (!gaugeChartInstance) {
    gaugeChartInstance = echarts.init(gaugeChart.value)
  }
  
  const option = {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 20,
          color: [
            [0.95, '#F56C6C'],
            [0.99, '#E6A23C'],
            [1, '#67C23A']
          ]
        }
      },
      pointer: {
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        distance: -20,
        length: 8,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      splitLine: {
        distance: -20,
        length: 20,
        lineStyle: {
          color: '#fff',
          width: 4
        }
      },
      axisLabel: {
        color: 'auto',
        distance: 30,
        fontSize: 14
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color: 'auto',
        fontSize: 30
      },
      data: [{
        value: accuracy,
        name: '库存准确率'
      }]
    }]
  }
  
  gaugeChartInstance.setOption(option)
}

// 更新趋势图
const updateTrendChart = (data) => {
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['数量准确率', '金额准确率', '储位准确率']
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.month)
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '数量准确率',
        type: 'line',
        data: data.map(item => item.qtyAccuracy),
        smooth: true
      },
      {
        name: '金额准确率',
        type: 'line',
        data: data.map(item => item.amountAccuracy),
        smooth: true
      },
      {
        name: '储位准确率',
        type: 'line',
        data: data.map(item => item.locationAccuracy),
        smooth: true
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 更新差异原因图
const updateReasonChart = (data) => {
  if (!reasonChartInstance) {
    reasonChartInstance = echarts.init(reasonChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'right'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        formatter: '{b}: {d}%'
      },
      data: data.map(item => ({
        value: item.count,
        name: item.reason
      }))
    }]
  }
  
  reasonChartInstance.setOption(option)
}

// 更新仓库对比图
const updateWarehouseChart = (data) => {
  if (!warehouseChartInstance) {
    warehouseChartInstance = echarts.init(warehouseChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['数量准确率', '金额准确率']
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.warehouse)
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '数量准确率',
        type: 'bar',
        data: data.map(item => item.qtyAccuracy)
      },
      {
        name: '金额准确率',
        type: 'bar',
        data: data.map(item => item.amountAccuracy)
      }
    ]
  }
  
  warehouseChartInstance.setOption(option)
}

// 更新分类对比图
const updateCategoryChart = (data) => {
  if (!categoryChartInstance) {
    categoryChartInstance = echarts.init(categoryChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 90,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.category)
    },
    series: [{
      type: 'bar',
      data: data.map(item => ({
        value: item.accuracy,
        itemStyle: {
          color: getAccuracyColor(item.accuracy)
        }
      })),
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%'
      }
    }]
  }
  
  categoryChartInstance.setOption(option)
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    dateRange: [],
    warehouse: '',
    category: []
  })
  handleSearch()
}

// 查看详情
const handleViewDetail = (row) => {
  ElMessage.info('详情功能待实现')
}

// 导出
const handleExport = () => {
  ElMessage.success('导出功能待实现')
}

// 窗口调整
window.addEventListener('resize', () => {
  gaugeChartInstance?.resize()
  trendChartInstance?.resize()
  reasonChartInstance?.resize()
  warehouseChartInstance?.resize()
  categoryChartInstance?.resize()
})

onMounted(() => {
  loadMasterData()
  
  // 默认查询最近6个月
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  searchForm.dateRange = [
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
  ]
  
  loadData()
})
</script>

<style scoped lang="scss">
.inventory-accuracy-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .actions {
    display: flex;
    gap: 10px;
  }
}

.search-form {
  margin-bottom: 20px;
}

.overall-accuracy {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 40px;
  color: white;
  margin-bottom: 20px;

  .accuracy-circle {
    flex-shrink: 0;
  }

  .accuracy-details {
    flex: 1;

    .detail-item {
      text-align: center;
      padding: 15px 0;

      .label {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
      }

      .value {
        font-size: 26px;
        font-weight: bold;

        &.primary {
          color: #409EFF;
        }

        &.success {
          color: #67C23A;
        }

        &.warning {
          color: #E6A23C;
        }

        &.error {
          color: #F56C6C;
        }
      }
    }
  }
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #303133;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
