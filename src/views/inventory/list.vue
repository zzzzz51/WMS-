<template>
  <div class="inventory-list">
    <h2>库存查询</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="模糊搜索" clearable style="width:140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="模糊搜索" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部" clearable style="width:120px">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="库位">
          <el-input v-model="searchForm.location" placeholder="库位编码" clearable style="width:100px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="success" @click="handleExport">导出</el-button>
      <el-button @click="handlePrint">打印</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条，库存总额 <strong style="color:#409eff">¥{{ totalValue.toLocaleString() }}</strong></span>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe show-summary :summary-method="getSummary">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格型号" width="120" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="location" label="库位" width="90" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="right">
          <template #default="{row}"><span class="text-primary">{{ row.quantity }}</span></template>
        </el-table-column>
        <el-table-column prop="availableQty" label="可用数量" width="100" align="right" />
        <el-table-column prop="lockedQty" label="锁定数量" width="90" align="right">
          <template #default="{row}"><span v-if="row.lockedQty" class="text-warning">{{ row.lockedQty }}</span><span v-else>0</span></template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="90" align="right">
          <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="库存金额" width="110" align="right">
          <template #default="{row}">¥{{ (row.quantity * row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="110" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleDetail(row)">明细</el-button>
            <el-button type="info" link size="small" @click="handleFlow(row)">流水</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20,50,100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const warehouses = ['MRO主仓', '原料仓', '成品仓', '备件仓']
const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ materialCode: '', materialName: '', warehouse: '', location: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const totalValue = computed(() => tableData.value.reduce((s, r) => s + r.quantity * r.price, 0))

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.materialCode, searchForm.materialCode)) return false
    if (!fuzzyMatch(item.materialName, searchForm.materialName)) return false
    if (searchForm.warehouse && item.warehouse !== searchForm.warehouse) return false
    if (!fuzzyMatch(item.location, searchForm.location)) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); pagination.page = 1; handleSearch() }

const getSummary = ({ columns, data }) => {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property === 'quantity') return data.reduce((s, r) => s + r.quantity, 0)
    if (col.property === 'availableQty') return data.reduce((s, r) => s + r.availableQty, 0)
    return ''
  })
}

const handleDetail = row => ElMessage.info(`查看 ${row.materialName} 库存明细`)
const handleFlow = row => ElMessage.info(`查看 ${row.materialName} 库存流水`)
const handleExport = () => ElMessage.success('导出成功')
const handlePrint = () => ElMessage.info('打印库存表')

onMounted(() => {
  allData.value = Array(100).fill(null).map((_, i) => ({
    id: i + 1, materialCode: `MAT${String(i + 1).padStart(6, '0')}`,
    materialName: `物料名称${i + 1}`, spec: `规格${(i % 5) + 1}`, unit: ['个', '件', 'kg', '米'][i % 4],
    warehouse: warehouses[i % 4], location: `A${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
    quantity: Math.floor(Math.random() * 500) + 50,
    availableQty: Math.floor(Math.random() * 400) + 50,
    lockedQty: i % 5 === 0 ? Math.floor(Math.random() * 50) : 0,
    price: Math.floor(Math.random() * 200) + 20,
    batchNo: `B2024${String(i % 30 + 1).padStart(4, '0')}`
  }))
  handleSearch()
})
</script>

<style scoped>
.inventory-list { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-primary { color: #409eff; font-weight: 600; }
.text-warning { color: #e6a23c; }
</style>
