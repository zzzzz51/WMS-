<template>
  <div class="misc-execute-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">杂项入库执行</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="入库单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待执行" value="APPROVED" />
            <el-option label="执行中" value="EXECUTING" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="orderNo" label="入库单号" min-width="160" />
        <el-table-column prop="inboundType" label="入库类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.inboundType)">{{ getTypeLabel(row.inboundType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="目标仓库" width="120" />
        <el-table-column prop="totalQty" label="计划数量" width="100" align="right" />
        <el-table-column prop="completedQty" label="已入库数量" width="110" align="right" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approver" label="审批人" width="100" />
        <el-table-column prop="approveTime" label="审批时间" width="160" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'APPROVED'" 
              type="primary" 
              size="small" 
              @click="handleExecute(row)"
            >
              开始执行
            </el-button>
            <el-button 
              v-if="row.status === 'EXECUTING'" 
              type="success" 
              size="small" 
              @click="handleContinue(row)"
            >
              继续执行
            </el-button>
            <el-button type="info" size="small" @click="handleDetail(row)">详情</el-button>
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

    <!-- 执行对话框 -->
    <el-dialog 
      v-model="executeDialog.visible" 
      :title="`执行入库 - ${executeDialog.orderNo}`" 
      width="70%"
      :close-on-click-modal="false"
    >
      <el-form :model="executeForm" label-width="100px">
        <el-form-item label="入库仓库">
          <el-input v-model="executeForm.warehouse" disabled />
        </el-form-item>

        <!-- 物料列表 -->
        <el-divider content-position="left">物料明细</el-divider>
        <el-table :data="executeForm.items" border max-height="400">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="planQty" label="计划数量" width="100" align="right" />
          <el-table-column prop="completedQty" label="已入库" width="100" align="right" />
          <el-table-column label="本次入库" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.currentQty" 
                :min="0" 
                :max="row.planQty - row.completedQty"
                :precision="2"
                size="small"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="储位" width="200">
            <template #default="{ row }">
              <el-select 
                v-model="row.location" 
                placeholder="选择储位" 
                filterable
                size="small"
              >
                <el-option
                  v-for="loc in availableLocations"
                  :key="loc.code"
                  :label="`${loc.code} - ${loc.name}`"
                  :value="loc.code"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="批次号" width="150">
            <template #default="{ row }">
              <el-input v-model="row.batchNo" placeholder="可选" size="small" />
            </template>
          </el-table-column>
        </el-table>

        <el-form-item label="备注" style="margin-top: 20px">
          <el-input v-model="executeForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="executeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmExecute" :loading="executing">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  status: 'APPROVED'
})

// 列表数据
const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 执行对话框
const executeDialog = reactive({
  visible: false,
  orderNo: ''
})

const executeForm = reactive({
  id: '',
  warehouse: '',
  items: [],
  remark: ''
})

const availableLocations = ref([])
const executing = ref(false)

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

// 状态映射
const statusMap = {
  'APPROVED': '待执行',
  'EXECUTING': '执行中',
  'COMPLETED': '已完成'
}

const getStatusLabel = (status) => statusMap[status] || status
const getStatusColor = (status) => {
  const colors = {
    'APPROVED': 'warning',
    'EXECUTING': 'primary',
    'COMPLETED': 'success'
  }
  return colors[status] || ''
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/inbound/misc/execute-list', {
      params: {
        ...searchForm,
        page: pagination.page,
        size: pagination.size
      }
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
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
    status: 'APPROVED'
  })
  handleSearch()
}

// 开始执行
const handleExecute = async (row) => {
  try {
    // 获取详情
    const res = await request.get(`/inbound/misc/${row.id}`)
    const detail = res.data
    
    executeDialog.orderNo = detail.orderNo
    executeForm.id = detail.id
    executeForm.warehouse = detail.warehouse
    executeForm.items = detail.items.map(item => ({
      ...item,
      currentQty: item.planQty - item.completedQty,
      location: '',
      batchNo: ''
    }))
    executeForm.remark = ''
    
    // 加载可用储位
    await loadLocations(detail.warehouse)
    
    executeDialog.visible = true
  } catch (error) {
    ElMessage.error('获取单据详情失败')
  }
}

// 继续执行
const handleContinue = (row) => {
  handleExecute(row)
}

// 加载储位
const loadLocations = async (warehouse) => {
  try {
    const res = await request.get('/master/locations', {
      params: { warehouse, status: 'ACTIVE' }
    })
    availableLocations.value = res.data
  } catch (error) {
    ElMessage.error('加载储位失败')
  }
}

// 计算总数
const calculateTotal = () => {
  // 可以在这里添加总数计算逻辑
}

// 确认入库
const confirmExecute = async () => {
  // 验证
  const validItems = executeForm.items.filter(item => item.currentQty > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请至少录入一条物料数量')
    return
  }

  for (const item of validItems) {
    if (!item.location) {
      ElMessage.warning(`物料 ${item.materialName} 未选择储位`)
      return
    }
  }

  try {
    await ElMessageBox.confirm('确认执行入库操作？', '提示', {
      type: 'warning'
    })

    executing.value = true
    
    await request.post('/inbound/misc/execute', {
      id: executeForm.id,
      items: validItems.map(item => ({
        materialId: item.materialId,
        qty: item.currentQty,
        location: item.location,
        batchNo: item.batchNo
      })),
      remark: executeForm.remark
    })

    ElMessage.success('入库执行成功')
    executeDialog.visible = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('入库执行失败')
    }
  } finally {
    executing.value = false
  }
}

// 查看详情
const handleDetail = async (row) => {
  // 跳转到详情页面或打开详情对话框
  ElMessage.info('详情功能待实现')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.misc-execute-container {
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
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
