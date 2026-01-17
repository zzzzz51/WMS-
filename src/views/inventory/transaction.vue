<template>
  <div class="inventory-transaction">
    <h2>库存流水</h2>
    
    <!-- 统计区域 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <div class="stat-card green">
          <div class="stat-label">今日入库</div>
          <div class="stat-value">+{{ stats.todayIn }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card red">
          <div class="stat-label">今日出库</div>
          <div class="stat-value">-{{ stats.todayOut }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card blue">
          <div class="stat-label">本月入库</div>
          <div class="stat-value">+{{ stats.monthIn }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card orange">
          <div class="stat-label">本月出库</div>
          <div class="stat-value">-{{ stats.monthOut }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="物料编码" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="物料名称" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="单据类型">
          <el-select v-model="searchForm.transType" placeholder="全部" clearable style="width: 120px">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调拨" value="transfer" />
            <el-option label="盘点" value="check" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
          <el-button type="warning" @click="handleExport">
            <el-icon><Download /></el-icon> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 流水列表 -->
    <el-card shadow="never">
      <el-table :data="transactionList" v-loading="loading" border stripe
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="transNo" label="流水号" width="180">
          <template #default="{ row }">
            <el-link type="primary">{{ row.transNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="transType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeStyle(row.transType)" size="small">{{ getTypeText(row.transType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="quantity" label="变动数量" width="100" align="right">
          <template #default="{ row }">
            <span :class="row.quantity > 0 ? 'text-success' : 'text-danger'">
              {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQty" label="变动前" width="90" align="right" />
        <el-table-column prop="afterQty" label="变动后" width="90" align="right">
          <template #default="{ row }">
            <span class="text-primary">{{ row.afterQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="sourceNo" label="关联单据" width="150" show-overflow-tooltip />
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column prop="transTime" label="发生时间" width="160" />
        <el-table-column prop="operator" label="操作人" width="90" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next" background />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

const loading = ref(false)

const stats = reactive({
  todayIn: 1580,
  todayOut: 1230,
  monthIn: 25600,
  monthOut: 22800
})

const searchForm = reactive({
  materialCode: '',
  materialName: '',
  transType: '',
  dateRange: []
})

const pagination = reactive({ page: 1, size: 20, total: 5000 })
const transactionList = ref([])

const getTypeStyle = (type) => ({ in: 'success', out: 'danger', transfer: 'warning', check: 'info' }[type] || 'info')
const getTypeText = (type) => ({ in: '入库', out: '出库', transfer: '调拨', check: '盘点' }[type] || '')

const generateData = () => {
  const types = ['in', 'out', 'transfer', 'check']
  const operators = ['张三', '李四', '王五', '赵六']
  const data = []
  
  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * 4)]
    const beforeQty = Math.floor(Math.random() * 500) + 100
    const changeQty = Math.floor(Math.random() * 100) + 10
    const quantity = type === 'in' ? changeQty : type === 'out' ? -changeQty : (Math.random() > 0.5 ? changeQty : -changeQty)
    
    data.push({
      id: i,
      transNo: `TRX${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(i).padStart(6, '0')}`,
      transType: type,
      materialCode: `MAT${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
      materialName: `物料名称${i % 20 + 1}`,
      quantity,
      beforeQty,
      afterQty: beforeQty + quantity,
      unit: ['个', '件', '箱', 'kg'][i % 4],
      sourceNo: type === 'in' ? `RCV202412${String(i).padStart(4, '0')}` : type === 'out' ? `REQ202412${String(i).padStart(4, '0')}` : `TRF202412${String(i).padStart(4, '0')}`,
      location: `A-${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
      transTime: `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
      operator: operators[i % 4],
      remark: type === 'in' ? '采购入库' : type === 'out' ? '生产领用' : type === 'transfer' ? '仓库调拨' : '盘点调整'
    })
  }
  
  return data.sort((a, b) => b.transTime.localeCompare(a.transTime))
}

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    transactionList.value = generateData()
    loading.value = false
  }, 500)
}

const handleSearch = () => { loadData() }
const handleReset = () => { Object.assign(searchForm, { materialCode: '', materialName: '', transType: '', dateRange: [] }); loadData() }
const handleExport = () => { ElMessage.success('正在导出库存流水...') }

onMounted(() => { loadData() })
</script>

<style scoped>
.inventory-transaction { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.stat-cards { margin-bottom: 16px; }
.stat-card { padding: 20px; border-radius: 8px; color: white; text-align: center; }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #5cb85c); }
.stat-card.red { background: linear-gradient(135deg, #f56c6c, #e64545); }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #f5a623); }
.stat-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: bold; }

.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.text-success { color: #67c23a; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-primary { color: #409eff; font-weight: 600; }
</style>
