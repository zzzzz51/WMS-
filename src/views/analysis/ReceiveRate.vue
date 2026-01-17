<template>
  <div class="receive-rate-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">收货及时率分析</span>
          <div class="actions">
            <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 查询条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
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
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplier" placeholder="全部" clearable filterable>
            <el-option 
              v-for="sup in suppliers" 
              :key="sup.code" 
              :label="sup.name" 
              :value="sup.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 指标卡片 -->
      <el-row :gutter="20" class="metrics-row">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon" style="background: #409eff20;">
              <el-icon :size="32" color="#409EFF"><Document /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">送货总单数</div>
              <div class="metric-value">{{ metrics.totalOrders }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon" style="background: #67c23a20;">
              <el-icon :size="32" color="#67C23A"><CircleCheck /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">及时收货单数</div>
              <div class="metric-value">{{ metrics.onTimeOrders }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon" style="background: #f5622220;">
              <el-icon :size="32" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">延迟收货单数</div>
              <div class="metric-value">{{ metrics.delayedOrders }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card highlight">
            <div class="metric-icon" style="background: #e6a23c20;">
              <el-icon :size="32" color="#E6A23C"><TrendCharts /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-label">收货及时率</div>
              <div class="metric-value rate">{{ metrics.onTimeRate }}%</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h3>收货及时率趋势</h3>
            <div ref="trendChart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h3>供应商及时率对比</h3>
            <div ref="supplierChart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 明细表格 -->
      <el-divider content-position="left">明细数据</el-divider>
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="orderNo" label="送货单号" min-width="160" />
        <el-table-column prop="supplier" label="供应商" min-width="150" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="deliveryDate" label="计划到货日期" width="120" align="center" />
        <el-table-column prop="receiveDate" label="实际收货日期" width="120" align="center" />
        <el-table-column label="延迟天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.delayDays > 0 ? 'danger' : 'success'"
              effect="plain"
            >
              {{ row.delayDays > 0 ? `+${row.delayDays}` : row.delayDays }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否及时" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.onTime ? 'success' : 'danger'">
              {{ row.onTime ? '及时' : '延迟' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalQty" label="数量" width="100" align="right" />
        <el-table-column prop="receiver" label="收货人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
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
import { Document, CircleCheck, Warning, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  dateRange: [],
  warehouse: '',
  supplier: ''
})

// 指标数据
const metrics = reactive({
  totalOrders: 0,
  onTimeOrders: 0,
  delayedOrders: 0,
  onTimeRate: 0
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
const suppliers = ref([])

// 图表实例
const trendChart = ref(null)
const supplierChart = ref(null)
let trendChartInstance = null
let supplierChartInstance = null

// 加载基础数据
const loadMasterData = async () => {
  try {
    const [whRes, supRes] = await Promise.all([
      request.get('/master/warehouses'),
      request.get('/master/suppliers')
    ])
    warehouses.value = whRes.data
    suppliers.value = supRes.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/analysis/receive-rate', {
      params: {
        startDate: searchForm.dateRange?.[0],
        endDate: searchForm.dateRange?.[1],
        warehouse: searchForm.warehouse,
        supplier: searchForm.supplier,
        page: pagination.page,
        size: pagination.size
      }
    })
    
    // 更新指标
    Object.assign(metrics, res.data.metrics)
    
    // 更新表格
    tableData.value = res.data.details.records
    pagination.total = res.data.details.total
    
    // 更新图表
    nextTick(() => {
      updateTrendChart(res.data.trendData)
      updateSupplierChart(res.data.supplierData)
    })
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
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
      data: ['及时率', '目标线']
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '及时率',
        type: 'line',
        data: data.map(item => item.rate),
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(64, 158, 255, 0.3)'
            }, {
              offset: 1, color: 'rgba(64, 158, 255, 0.05)'
            }]
          }
        }
      },
      {
        name: '目标线',
        type: 'line',
        data: new Array(data.length).fill(95),
        lineStyle: {
          type: 'dashed',
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 更新供应商图表
const updateSupplierChart = (data) => {
  if (!supplierChartInstance) {
    supplierChartInstance = echarts.init(supplierChart.value)
  }
  
  // 按及时率排序，取前10
  const sortedData = [...data].sort((a, b) => a.rate - b.rate).slice(0, 10)
  
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
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.supplier)
    },
    series: [
      {
        type: 'bar',
        data: sortedData.map(item => ({
          value: item.rate,
          itemStyle: {
            color: item.rate >= 95 ? '#67C23A' : item.rate >= 85 ? '#E6A23C' : '#F56C6C'
          }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%'
        }
      }
    ]
  }
  
  supplierChartInstance.setOption(option)
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
    supplier: ''
  })
  handleSearch()
}

// 导出
const handleExport = async () => {
  try {
    ElMessage.success('导出功能待实现')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 窗口调整时重绘图表
window.addEventListener('resize', () => {
  trendChartInstance?.resize()
  supplierChartInstance?.resize()
})

onMounted(() => {
  loadMasterData()
  
  // 默认查询最近30天
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  searchForm.dateRange = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
  
  loadData()
})
</script>

<style scoped lang="scss">
.receive-rate-container {
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

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }

  &.highlight {
    border: 2px solid #E6A23C;
  }

  .metric-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .metric-content {
    flex: 1;

    .metric-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;

      &.rate {
        color: #E6A23C;
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
