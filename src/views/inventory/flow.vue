<template>
  <div class="inventory-flow">
    <h2>库存流水</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="模糊搜索" clearable style="width:140px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="模糊搜索" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="流水类型">
          <el-select v-model="searchForm.flowType" placeholder="全部" clearable style="width:110px">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
            <el-option label="调拨入" value="transfer_in" />
            <el-option label="调拨出" value="transfer_out" />
            <el-option label="盘盈" value="profit" />
            <el-option label="盘亏" value="loss" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部" clearable style="width:110px">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width:220px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="success" @click="handleExport">导出</el-button>
      <span class="summary-info">
        入库: <span class="text-success">+{{ summary.inQty }}</span> |
        出库: <span class="text-danger">-{{ summary.outQty }}</span> |
        净变化: <span :class="summary.netQty >= 0 ? 'text-success' : 'text-danger'">{{ summary.netQty >= 0 ? '+' : '' }}{{ summary.netQty }}</span>
      </span>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe :header-cell-style="{background:'#f5f7fa'}">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="flowNo" label="流水号" width="160">
          <template #default="{row}"><el-link type="primary">{{ row.flowNo }}</el-link></template>
        </el-table-column>
        <el-table-column prop="flowType" label="类型" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getFlowTypeTag(row.flowType)" size="small">{{ getFlowTypeText(row.flowType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="warehouse" label="仓库" width="90" />
        <el-table-column prop="location" label="库位" width="80" />
        <el-table-column prop="quantity" label="数量" width="90" align="right">
          <template #default="{row}">
            <span :class="isInFlow(row.flowType) ? 'text-success' : 'text-danger'">
              {{ isInFlow(row.flowType) ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQty" label="变更前" width="80" align="right" />
        <el-table-column prop="afterQty" label="变更后" width="80" align="right">
          <template #default="{row}"><span class="text-primary">{{ row.afterQty }}</span></template>
        </el-table-column>
        <el-table-column prop="refNo" label="关联单据" width="140" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="createTime" label="操作时间" width="150" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
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
const searchForm = reactive({ materialCode: '', materialName: '', flowType: '', warehouse: '', dateRange: [] })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const flowTypes = {
  in: { text: '入库', tag: 'success' },
  out: { text: '出库', tag: 'danger' },
  transfer_in: { text: '调拨入', tag: 'primary' },
  transfer_out: { text: '调拨出', tag: 'warning' },
  profit: { text: '盘盈', tag: 'success' },
  loss: { text: '盘亏', tag: 'danger' }
}
const getFlowTypeText = t => flowTypes[t]?.text || t
const getFlowTypeTag = t => flowTypes[t]?.tag || 'info'
const isInFlow = t => ['in', 'transfer_in', 'profit'].includes(t)

const summary = computed(() => {
  const inQty = tableData.value.filter(r => isInFlow(r.flowType)).reduce((s, r) => s + r.quantity, 0)
  const outQty = tableData.value.filter(r => !isInFlow(r.flowType)).reduce((s, r) => s + r.quantity, 0)
  return { inQty, outQty, netQty: inQty - outQty }
})

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.materialCode, searchForm.materialCode)) return false
    if (!fuzzyMatch(item.materialName, searchForm.materialName)) return false
    if (searchForm.flowType && item.flowType !== searchForm.flowType) return false
    if (searchForm.warehouse && item.warehouse !== searchForm.warehouse) return false
    if (searchForm.dateRange?.length === 2) {
      const date = item.createTime.slice(0, 10)
      if (date < searchForm.dateRange[0] || date > searchForm.dateRange[1]) return false
    }
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '')
  pagination.page = 1
  handleSearch()
}

const handleExport = () => {
  const csv = [['流水号', '类型', '物料编码', '物料名称', '仓库', '库位', '数量', '变更前', '变更后', '关联单据', '操作人', '时间'].join(','),
    ...tableData.value.map(r => [r.flowNo, getFlowTypeText(r.flowType), r.materialCode, r.materialName, r.warehouse, r.location, r.quantity, r.beforeQty, r.afterQty, r.refNo, r.operator, r.createTime].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `库存流水_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const types = ['in', 'out', 'transfer_in', 'transfer_out', 'profit', 'loss']
  const operators = ['张三', '李四', '王五', '赵六']
  allData.value = Array(200).fill(null).map((_, i) => {
    const flowType = types[i % 6]
    const beforeQty = Math.floor(Math.random() * 200) + 50
    const quantity = Math.floor(Math.random() * 50) + 10
    return {
      id: i + 1, flowNo: `FLW${new Date().getFullYear()}${String(i).padStart(8, '0')}`,
      flowType, materialCode: `MAT${String((i % 50) + 1).padStart(6, '0')}`,
      materialName: `物料名称${(i % 50) + 1}`,
      warehouse: warehouses[i % 4], location: `A${(i % 5) + 1}-${(i % 10) + 1}`,
      quantity, beforeQty,
      afterQty: isInFlow(flowType) ? beforeQty + quantity : beforeQty - quantity,
      refNo: flowType === 'in' ? `RCV${i}` : flowType === 'out' ? `REQ${i}` : `TRF${i}`,
      operator: operators[i % 4],
      createTime: `2025-01-${String((i % 9) + 1).padStart(2, '0')} ${String(8 + (i % 10))}:${String(i % 60).padStart(2, '0')}:00`,
      remark: ''
    }
  })
  handleSearch()
})
</script>

<style scoped>
.inventory-flow { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.summary-info { font-size: 14px; color: #606266; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-primary { color: #409eff; font-weight: 600; }
.text-success { color: #67c23a; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
