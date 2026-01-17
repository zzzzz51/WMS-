<template>
  <div class="requisition-list">
    <h2>待发料清单</h2>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      <template #title>
        此列表显示ERP审批通过的领用单，等待仓库执行发料作业
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="领用单号">
          <el-input v-model="searchForm.orderNo" placeholder="领用单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="领用人">
          <el-input v-model="searchForm.requisitioner" placeholder="领用人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="领用部门">
          <el-select v-model="searchForm.department" placeholder="全部" clearable style="width: 140px">
            <el-option label="生产一部" value="生产一部" />
            <el-option label="生产二部" value="生产二部" />
            <el-option label="维修部" value="维修部" />
            <el-option label="研发部" value="研发部" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="searchForm.urgency" placeholder="全部" clearable style="width: 100px">
            <el-option label="普通" value="normal" />
            <el-option label="紧急" value="urgent" />
            <el-option label="特急" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" style="width: 220px" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="syncFromErp" :loading="syncing">
            <el-icon><Refresh /></el-icon> 同步ERP
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">待发料总数</div>
      </div>
      <div class="stat-card urgent">
        <div class="stat-value">{{ stats.urgent }}</div>
        <div class="stat-label">紧急单据</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">{{ stats.overdue }}</div>
        <div class="stat-label">即将超期</div>
      </div>
      <div class="stat-card success">
        <div class="stat-value">{{ stats.todayComplete }}</div>
        <div class="stat-label">今日已完成</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading" @selection-change="handleSelectionChange" 
        :row-class-name="getRowClassName">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="领用单号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="erpOrderNo" label="ERP单号" width="140" />
        <el-table-column prop="requisitioner" label="领用人" width="80" />
        <el-table-column prop="department" label="领用部门" width="100" />
        <el-table-column prop="materialCount" label="物料种类" width="90" align="center" />
        <el-table-column prop="totalQty" label="领用数量" width="100" align="right" />
        <el-table-column prop="urgency" label="紧急程度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="urgencyMap[row.urgency]?.type" size="small">{{ urgencyMap[row.urgency]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requestDate" label="申请日期" width="100" />
        <el-table-column prop="expectDate" label="期望日期" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.expectDate) }">{{ row.expectDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryPoint" label="配送点" width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handlePick(row)">发料</el-button>
            <el-button v-if="row.status === 'picking'" type="warning" link size="small" @click="handleContinue(row)">继续</el-button>
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
    <el-dialog v-model="detailVisible" :title="`领用单详情 - ${currentRow?.orderNo}`" width="900px">
      <el-descriptions :column="3" border v-if="currentRow">
        <el-descriptions-item label="领用单号">{{ currentRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="ERP单号">{{ currentRow.erpOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag :type="urgencyMap[currentRow.urgency]?.type">{{ urgencyMap[currentRow.urgency]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="领用人">{{ currentRow.requisitioner }}</el-descriptions-item>
        <el-descriptions-item label="领用部门">{{ currentRow.department }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ currentRow.requestDate }}</el-descriptions-item>
        <el-descriptions-item label="期望日期">{{ currentRow.expectDate }}</el-descriptions-item>
        <el-descriptions-item label="配送点">{{ currentRow.deliveryPoint }}</el-descriptions-item>
        <el-descriptions-item label="用途说明" :span="3">{{ currentRow.purpose }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px">
        <h4>物料明细</h4>
        <el-table :data="currentRow?.materials" border size="small">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="materialCode" label="物料编码" width="120" />
          <el-table-column prop="materialName" label="物料名称" min-width="140" />
          <el-table-column prop="spec" label="规格型号" width="100" />
          <el-table-column prop="requestQty" label="申请数量" width="90" align="right" />
          <el-table-column prop="approvedQty" label="批准数量" width="90" align="right">
            <template #default="{ row }">
              <span class="text-primary">{{ row.approvedQty }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pickedQty" label="已发数量" width="90" align="right">
            <template #default="{ row }">
              <span class="text-success">{{ row.pickedQty || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="stockQty" label="可用库存" width="90" align="right">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.stockQty < row.approvedQty }">{{ row.stockQty }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePick(currentRow)" v-if="currentRow?.status === 'pending'">开始发料</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const syncing = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)
const selectedRows = ref([])

const searchForm = reactive({
  orderNo: '', requisitioner: '', department: '', urgency: '', dateRange: []
})

const pagination = reactive({ page: 1, size: 20, total: 0 })

const stats = reactive({
  total: 28,
  urgent: 5,
  overdue: 3,
  todayComplete: 12
})

const urgencyMap = {
  normal: { label: '普通', type: 'info' },
  urgent: { label: '紧急', type: 'warning' },
  critical: { label: '特急', type: 'danger' }
}

const statusMap = {
  pending: { label: '待发料', type: 'warning' },
  picking: { label: '拣货中', type: '' },
  partial: { label: '部分发料', type: 'primary' },
  completed: { label: '已完成', type: 'success' }
}

const tableData = ref([])

const isOverdue = (date) => {
  return new Date(date) < new Date()
}

const getRowClassName = ({ row }) => {
  if (row.urgency === 'critical') return 'row-critical'
  if (row.urgency === 'urgent') return 'row-urgent'
  if (isOverdue(row.expectDate)) return 'row-overdue'
  return ''
}

const generateData = () => {
  const departments = ['生产一部', '生产二部', '维修部', '研发部']
  const urgencies = ['normal', 'normal', 'normal', 'urgent', 'critical']
  const statuses = ['pending', 'pending', 'pending', 'picking', 'partial']
  
  tableData.value = Array(28).fill(null).map((_, i) => ({
    id: i + 1,
    orderNo: `LY2025011${String(i + 1).padStart(4, '0')}`,
    erpOrderNo: `ERP-LY2025011${String(i + 1).padStart(4, '0')}`,
    requisitioner: ['张三', '李四', '王五', '赵六'][i % 4],
    department: departments[i % 4],
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    materialCount: Math.floor(Math.random() * 5) + 1,
    totalQty: Math.floor(Math.random() * 100) + 20,
    urgency: urgencies[i % 5],
    requestDate: `2025-01-${String((i % 10) + 1).padStart(2, '0')}`,
    expectDate: `2025-01-${String((i % 10) + 10).padStart(2, '0')}`,
    deliveryPoint: ['A区配送点', 'B区配送点', 'C区配送点'][i % 3],
    purpose: '生产使用',
    status: statuses[i % 5],
    materials: [
      { materialCode: `MAT00000${i + 1}`, materialName: `物料${i + 1}`, spec: 'DN50', requestQty: 50, approvedQty: 50, pickedQty: i % 5 === 3 ? 20 : 0, unit: '个', stockQty: Math.floor(Math.random() * 100) + 30 },
      { materialCode: `MAT00000${i + 2}`, materialName: `物料${i + 2}`, spec: 'M10×30', requestQty: 100, approvedQty: 80, pickedQty: 0, unit: '个', stockQty: Math.floor(Math.random() * 100) + 50 }
    ]
  }))
  pagination.total = tableData.value.length
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => loading.value = false, 300)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '')
  handleSearch()
}

const syncFromErp = async () => {
  syncing.value = true
  setTimeout(() => {
    syncing.value = false
    ElMessage.success('已从ERP同步最新领用单')
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

const handlePick = (row) => {
  router.push({ path: '/outbound/picking', query: { orderNo: row.orderNo } })
}

const handleContinue = (row) => {
  router.push({ path: '/outbound/picking', query: { orderNo: row.orderNo } })
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.requisition-list { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }

.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.stat-card.urgent .stat-value { color: #e6a23c; }
.stat-card.warning .stat-value { color: #f56c6c; }
.stat-card.success .stat-value { color: #67c23a; }

.stat-card .stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.text-primary { color: #409eff; font-weight: 600; }
.text-success { color: #67c23a; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }

:deep(.row-critical) { background-color: #fef0f0 !important; }
:deep(.row-urgent) { background-color: #fdf6ec !important; }
:deep(.row-overdue) { background-color: #fef0f0 !important; }
</style>
