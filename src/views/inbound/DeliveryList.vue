<template>
  <div class="delivery-list">
    <h2>待接收清单</h2>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>
        此列表显示ERP下发的送货单，等待仓库接收分流
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="送货单号">
          <el-input v-model="searchForm.deliveryNo" placeholder="送货单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchForm.supplier" placeholder="供应商" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="采购订单">
          <el-input v-model="searchForm.poNo" placeholder="采购订单号" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="预计到货">
          <el-date-picker v-model="searchForm.expectDate" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 220px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="syncFromErp" :loading="syncing">
            <el-icon><Refresh /></el-icon> 同步ERP
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="deliveryNo" label="送货单号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.deliveryNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="poNo" label="采购订单号" width="140" />
        <el-table-column prop="supplier" label="供应商" min-width="140" show-overflow-tooltip />
        <el-table-column prop="materialCount" label="物料种类" width="90" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.materialCount }} 种</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalQty" label="总数量" width="100" align="right" />
        <el-table-column prop="expectDate" label="预计到货" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" link size="small" @click="handleDispatch(row)" v-if="row.status === 'pending'">分流</el-button>
            <el-button type="warning" link size="small" @click="handleReceive(row)" v-if="row.status === 'dispatched'">收货</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20, 50, 100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="`送货单详情 - ${currentRow?.deliveryNo}`" width="900px">
      <el-descriptions :column="3" border v-if="currentRow">
        <el-descriptions-item label="送货单号">{{ currentRow.deliveryNo }}</el-descriptions-item>
        <el-descriptions-item label="采购订单">{{ currentRow.poNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentRow.supplier }}</el-descriptions-item>
        <el-descriptions-item label="预计到货">{{ currentRow.expectDate }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[currentRow.status]?.type">{{ statusMap[currentRow.status]?.label }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 16px">
        <h4>物料明细</h4>
        <el-table :data="currentRow?.materials" border size="small">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column prop="materialName" label="物料名称" min-width="140" />
          <el-table-column prop="spec" label="规格型号" width="100" />
          <el-table-column prop="orderQty" label="订单数量" width="90" align="right" />
          <el-table-column prop="deliveryQty" label="送货数量" width="90" align="right" />
          <el-table-column prop="unit" label="单位" width="60" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const syncing = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)
const selectedRows = ref([])

const searchForm = reactive({
  deliveryNo: '', supplier: '', poNo: '', expectDate: []
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const statusMap = {
  pending: { label: '待分流', type: 'warning' },
  dispatched: { label: '已分流', type: 'primary' },
  receiving: { label: '收货中', type: '' },
  completed: { label: '已完成', type: 'success' }
}

const tableData = ref([])

// 模拟数据
const generateData = () => {
  const suppliers = ['宝钢集团', '上海五金', '江苏钢铁', '浙江机械']
  tableData.value = Array(15).fill(null).map((_, i) => ({
    id: i + 1,
    deliveryNo: `SH2025011${String(i + 1).padStart(4, '0')}`,
    poNo: `PO2025010${String(i + 1).padStart(4, '0')}`,
    supplier: suppliers[i % 4],
    materialCount: Math.floor(Math.random() * 5) + 1,
    totalQty: Math.floor(Math.random() * 500) + 100,
    expectDate: `2025-01-${String((i % 10) + 10).padStart(2, '0')}`,
    createTime: `2025-01-${String((i % 10) + 5).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: ['pending', 'pending', 'dispatched', 'receiving'][i % 4],
    materials: [
      { materialCode: `MAT00000${i + 1}`, materialName: `物料${i + 1}`, spec: 'DN50', orderQty: 100, deliveryQty: 100, unit: '个' },
      { materialCode: `MAT00000${i + 2}`, materialName: `物料${i + 2}`, spec: 'M10×30', orderQty: 200, deliveryQty: 200, unit: '个' }
    ]
  }))
  pagination.total = tableData.value.length
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'expectDate' ? [] : '')
  handleSearch()
}

const syncFromErp = async () => {
  syncing.value = true
  setTimeout(() => {
    syncing.value = false
    ElMessage.success('已从ERP同步最新送货单')
    generateData()
  }, 1500)
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const handleDispatch = (row) => {
  router.push({ path: '/inbound/delivery-dispatch', query: { id: row.id } })
}

const handleReceive = (row) => {
  router.push({ path: '/inbound/receive-work', query: { deliveryNo: row.deliveryNo } })
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.delivery-list { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
