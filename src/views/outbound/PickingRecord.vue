<template>
  <div class="picking-record-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">发料记录</span>
          <div class="actions">
            <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="领用单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="领用部门">
          <el-select v-model="searchForm.department" placeholder="全部" clearable>
            <el-option label="生产部" value="PRODUCTION" />
            <el-option label="维修部" value="MAINTENANCE" />
            <el-option label="研发部" value="RD" />
            <el-option label="品质部" value="QC" />
          </el-select>
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
        <el-form-item label="发料日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff20;">
              <el-icon :size="28" color="#409EFF"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">发料单数</div>
              <div class="stat-value">{{ stats.totalOrders }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a20;">
              <el-icon :size="28" color="#67C23A"><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">发料物料数</div>
              <div class="stat-value">{{ stats.totalItems }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c20;">
              <el-icon :size="28" color="#E6A23C"><ShoppingCart /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">发料总数量</div>
              <div class="stat-value">{{ stats.totalQty }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c20;">
              <el-icon :size="28" color="#F56C6C"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">发料总金额</div>
              <div class="stat-value">¥{{ stats.totalAmount }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 列表 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="orderNo" label="领用单号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="领用部门" width="120" />
        <el-table-column prop="receiver" label="领用人" width="100" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="itemCount" label="物料数" width="90" align="right" />
        <el-table-column prop="totalQty" label="发料数量" width="100" align="right" />
        <el-table-column prop="totalAmount" label="发料金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="urgent" label="紧急程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.urgent" type="danger" effect="dark">紧急</el-tag>
            <el-tag v-else type="info">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="picker" label="发料人" width="100" />
        <el-table-column prop="pickTime" label="发料时间" width="160" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">查看详情</el-button>
            <el-button type="info" link @click="handlePrint(row)">打印</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      :title="`发料详情 - ${detailDialog.orderNo}`" 
      width="85%"
    >
      <el-descriptions :column="3" border>
        <el-descriptions-item label="领用单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="领用部门">{{ detailData.department }}</el-descriptions-item>
        <el-descriptions-item label="领用人">{{ detailData.receiver }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailData.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="需求日期">{{ detailData.requireDate }}</el-descriptions-item>
        <el-descriptions-item label="紧急程度">
          <el-tag v-if="detailData.urgent" type="danger">紧急</el-tag>
          <el-tag v-else type="info">正常</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发料人">{{ detailData.picker }}</el-descriptions-item>
        <el-descriptions-item label="发料时间">{{ detailData.pickTime }}</el-descriptions-item>
        <el-descriptions-item label="耗时">
          <el-tag :type="getTimeColor(detailData.timeUsed)">{{ detailData.timeUsed }}分钟</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">物料明细</el-divider>
      <el-table :data="detailData.items" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="160" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="requestQty" label="申请数量" width="100" align="right" />
        <el-table-column prop="pickQty" label="实发数量" width="100" align="right" />
        <el-table-column label="发料状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.pickQty >= row.requestQty" type="success">足量</el-tag>
            <el-tag v-else-if="row.pickQty > 0" type="warning">缺料</el-tag>
            <el-tag v-else type="danger">未发</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="储位" width="120" />
        <el-table-column prop="batchNo" label="批次号" width="150" />
      </el-table>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint(detailData)">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Box, ShoppingCart, Money } from '@element-plus/icons-vue'
import request from '@/utils/request'

const searchForm = reactive({
  orderNo: '',
  department: '',
  warehouse: '',
  dateRange: []
})

const stats = reactive({
  totalOrders: 0,
  totalItems: 0,
  totalQty: 0,
  totalAmount: 0
})

const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const warehouses = ref([])

const detailDialog = reactive({
  visible: false,
  orderNo: ''
})

const detailData = reactive({
  orderNo: '',
  department: '',
  receiver: '',
  warehouse: '',
  requireDate: '',
  urgent: false,
  picker: '',
  pickTime: '',
  timeUsed: 0,
  remark: '',
  items: []
})

const getTimeColor = (minutes) => {
  if (minutes <= 30) return 'success'
  if (minutes <= 60) return 'warning'
  return 'danger'
}

const loadMasterData = async () => {
  try {
    const res = await request.get('/master/warehouses')
    warehouses.value = res.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/outbound/requisition/records', {
      params: {
        orderNo: searchForm.orderNo,
        department: searchForm.department,
        warehouse: searchForm.warehouse,
        startDate: searchForm.dateRange?.[0],
        endDate: searchForm.dateRange?.[1],
        page: pagination.page,
        size: pagination.size
      }
    })
    
    tableData.value = res.data.records
    pagination.total = res.data.total
    Object.assign(stats, res.data.stats)
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    orderNo: '',
    department: '',
    warehouse: '',
    dateRange: []
  })
  handleSearch()
}

const handleDetail = async (row) => {
  try {
    const res = await request.get(`/outbound/requisition/records/${row.id}`)
    detailDialog.orderNo = row.orderNo
    Object.assign(detailData, res.data)
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

const handlePrint = () => {
  ElMessage.info('打印功能待实现')
}

const handleExport = () => {
  ElMessage.success('导出功能待实现')
}

onMounted(() => {
  loadMasterData()
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  searchForm.dateRange = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
  loadData()
})
</script>

<style scoped lang="scss">
.picking-record-container {
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

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;

  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-content {
    flex: 1;

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
    }
  }
}

.amount {
  color: #F56C6C;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
