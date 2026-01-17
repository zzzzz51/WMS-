<template>
  <div class="misc-record-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">杂项入库记录</span>
          <div class="actions">
            <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="入库单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="入库类型">
          <el-select v-model="searchForm.inboundType" placeholder="全部" clearable>
            <el-option label="生产退料" value="PRODUCTION_RETURN" />
            <el-option label="采购退货返回" value="PURCHASE_RETURN" />
            <el-option label="盘盈入库" value="ADJUSTMENT" />
            <el-option label="其他入库" value="OTHER" />
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
        <el-form-item label="入库日期">
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
              <div class="stat-label">入库单数</div>
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
              <div class="stat-label">入库物料数</div>
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
              <div class="stat-label">入库总数量</div>
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
              <div class="stat-label">入库总金额</div>
              <div class="stat-value">¥{{ stats.totalAmount }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 列表 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="orderNo" label="入库单号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="inboundType" label="入库类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.inboundType)">
              {{ getTypeLabel(row.inboundType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="itemCount" label="物料数" width="90" align="right" />
        <el-table-column prop="totalQty" label="入库数量" width="100" align="right" />
        <el-table-column prop="totalAmount" label="入库金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="erpStatus" label="ERP同步" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.erpStatus === 'SYNCED' ? 'success' : 'warning'">
              {{ row.erpStatus === 'SYNCED' ? '已同步' : '同步中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="inboundTime" label="入库时间" width="160" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
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
      :title="`入库详情 - ${detailDialog.orderNo}`" 
      width="80%"
    >
      <el-descriptions :column="3" border>
        <el-descriptions-item label="入库单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="入库类型">
          <el-tag :type="getTypeColor(detailData.inboundType)">
            {{ getTypeLabel(detailData.inboundType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailData.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detailData.createdBy }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createdTime }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.operator }}</el-descriptions-item>
        <el-descriptions-item label="入库时间">{{ detailData.inboundTime }}</el-descriptions-item>
        <el-descriptions-item label="ERP状态">
          <el-tag :type="detailData.erpStatus === 'SYNCED' ? 'success' : 'warning'">
            {{ detailData.erpStatus === 'SYNCED' ? '已同步' : '同步中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="ERP单号">{{ detailData.erpOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">物料明细</el-divider>
      <el-table :data="detailData.items" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="qty" label="入库数量" width="100" align="right" />
        <el-table-column prop="location" label="储位" width="120" />
        <el-table-column prop="batchNo" label="批次号" width="150" />
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.qty * row.price).toFixed(2) }}</span>
          </template>
        </el-table-column>
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

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  inboundType: '',
  warehouse: '',
  dateRange: []
})

// 统计数据
const stats = reactive({
  totalOrders: 0,
  totalItems: 0,
  totalQty: 0,
  totalAmount: 0
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

// 详情对话框
const detailDialog = reactive({
  visible: false,
  orderNo: ''
})

const detailData = reactive({
  orderNo: '',
  inboundType: '',
  warehouse: '',
  createdBy: '',
  createdTime: '',
  operator: '',
  inboundTime: '',
  erpStatus: '',
  erpOrderNo: '',
  remark: '',
  items: []
})

// 入库类型映射
const typeMap = {
  'PRODUCTION_RETURN': '生产退料',
  'PURCHASE_RETURN': '采购退货返回',
  'ADJUSTMENT': '盘盈入库',
  'OTHER': '其他入库'
}

const getTypeLabel = (type) => typeMap[type] || type
const getTypeColor = (type) => {
  const colors = {
    'PRODUCTION_RETURN': 'warning',
    'PURCHASE_RETURN': 'success',
    'ADJUSTMENT': 'info',
    'OTHER': ''
  }
  return colors[type] || ''
}

// 加载基础数据
const loadMasterData = async () => {
  try {
    const res = await request.get('/master/warehouses')
    warehouses.value = res.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/inbound/misc/records', {
      params: {
        orderNo: searchForm.orderNo,
        inboundType: searchForm.inboundType,
        warehouse: searchForm.warehouse,
        startDate: searchForm.dateRange?.[0],
        endDate: searchForm.dateRange?.[1],
        page: pagination.page,
        size: pagination.size
      }
    })
    
    tableData.value = res.data.records
    pagination.total = res.data.total
    
    // 更新统计
    Object.assign(stats, res.data.stats)
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    orderNo: '',
    inboundType: '',
    warehouse: '',
    dateRange: []
  })
  handleSearch()
}

// 查看详情
const handleDetail = async (row) => {
  try {
    const res = await request.get(`/inbound/misc/records/${row.id}`)
    
    detailDialog.orderNo = row.orderNo
    Object.assign(detailData, res.data)
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

// 打印
const handlePrint = (row) => {
  ElMessage.info('打印功能待实现')
}

// 导出
const handleExport = async () => {
  try {
    ElMessage.success('导出功能待实现')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadMasterData()
  
  // 默认查询最近7天
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
.misc-record-container {
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
