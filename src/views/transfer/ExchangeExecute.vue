<template>
  <div class="exchange-execute-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">以物换物执行</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="换物单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
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
        <el-table-column prop="orderNo" label="换物单号" min-width="160" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="reason" label="换物原因" width="150">
          <template #default="{ row }">
            <el-tag :type="getReasonColor(row.reason)">{{ getReasonLabel(row.reason) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="outItemCount" label="换出物料数" width="110" align="right" />
        <el-table-column prop="inItemCount" label="换入物料数" width="110" align="right" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
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
      :title="`换物执行 - ${executeDialog.orderNo}`" 
      width="90%"
      :close-on-click-modal="false"
    >
      <div class="exchange-info">
        <el-alert
          title="以物换物说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>需要先从仓库中取出换出物料，然后再入库换入物料。请按照步骤完成操作。</p>
          </template>
        </el-alert>

        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step title="换出" description="从仓库取出物料" />
          <el-step title="确认" description="确认换物信息" />
          <el-step title="换入" description="换入物料入库" />
        </el-steps>
      </div>

      <el-divider />

      <!-- 步骤1：换出物料 -->
      <div v-if="currentStep === 0">
        <h3>第一步：换出物料出库</h3>
        <el-table :data="executeForm.outItems" border max-height="400">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="70" align="center" />
          <el-table-column prop="planQty" label="计划数量" width="100" align="right" />
          <el-table-column prop="location" label="储位" width="120" />
          <el-table-column label="实际出库" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.actualQty" 
                :min="0" 
                :max="row.planQty"
                :precision="2"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="扫码" width="100">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                icon="Barcode"
                @click="handleScan(row, 'out')"
              >
                扫码
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 步骤2：确认信息 -->
      <div v-if="currentStep === 1">
        <h3>第二步：确认换物信息</h3>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <h4 style="color: #F56C6C;">换出物料</h4>
            <el-table :data="executeForm.outItems" border max-height="300">
              <el-table-column prop="materialCode" label="物料编码" width="120" />
              <el-table-column prop="materialName" label="物料名称" min-width="150" />
              <el-table-column prop="actualQty" label="换出数量" width="100" align="right" />
              <el-table-column prop="price" label="单价" width="100" align="right">
                <template #default="{ row }">
                  ¥{{ row.price }}
                </template>
              </el-table-column>
            </el-table>
            <div class="summary">
              总价值: <span class="amount">¥{{ calculateOutTotal() }}</span>
            </div>
          </el-col>

          <el-col :span="12">
            <h4 style="color: #67C23A;">换入物料</h4>
            <el-table :data="executeForm.inItems" border max-height="300">
              <el-table-column prop="materialCode" label="物料编码" width="120" />
              <el-table-column prop="materialName" label="物料名称" min-width="150" />
              <el-table-column prop="planQty" label="换入数量" width="100" align="right" />
              <el-table-column prop="price" label="单价" width="100" align="right">
                <template #default="{ row }">
                  ¥{{ row.price }}
                </template>
              </el-table-column>
            </el-table>
            <div class="summary">
              总价值: <span class="amount">¥{{ calculateInTotal() }}</span>
            </div>
          </el-col>
        </el-row>

        <el-alert
          v-if="Math.abs(calculateOutTotal() - calculateInTotal()) > 0.01"
          title="价值差异提醒"
          type="warning"
          style="margin-top: 20px"
        >
          <template #default>
            <p>换出价值与换入价值存在差异：
              <span :style="{ color: calculateOutTotal() > calculateInTotal() ? '#F56C6C' : '#67C23A' }">
                ¥{{ Math.abs(calculateOutTotal() - calculateInTotal()).toFixed(2) }}
              </span>
            </p>
          </template>
        </el-alert>
      </div>

      <!-- 步骤3：换入物料 -->
      <div v-if="currentStep === 2">
        <h3>第三步：换入物料入库</h3>
        <el-table :data="executeForm.inItems" border max-height="400">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="70" align="center" />
          <el-table-column prop="planQty" label="计划数量" width="100" align="right" />
          <el-table-column label="实际入库" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.actualQty" 
                :min="0" 
                :max="row.planQty"
                :precision="2"
                size="small"
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
      </div>

      <el-form :model="executeForm" label-width="80px" style="margin-top: 20px">
        <el-form-item label="执行备注">
          <el-input v-model="executeForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="executeDialog.visible = false">取消</el-button>
        <el-button 
          v-if="currentStep > 0" 
          @click="handlePrevStep"
        >
          上一步
        </el-button>
        <el-button 
          v-if="currentStep < 2" 
          type="primary" 
          @click="handleNextStep"
        >
          下一步
        </el-button>
        <el-button 
          v-if="currentStep === 2" 
          type="success" 
          @click="confirmExecute"
          :loading="executing"
        >
          确认完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const searchForm = reactive({
  orderNo: '',
  warehouse: '',
  status: 'APPROVED'
})

const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const warehouses = ref([])

const executeDialog = reactive({
  visible: false,
  orderNo: ''
})

const executeForm = reactive({
  id: '',
  warehouse: '',
  outItems: [],
  inItems: [],
  remark: ''
})

const currentStep = ref(0)
const availableLocations = ref([])
const executing = ref(false)

const reasonMap = {
  'OBSOLETE': '物料淘汰',
  'UPGRADE': '升级替换',
  'EQUIVALENT': '等价替换',
  'COST_SAVING': '成本优化',
  'OTHER': '其他'
}

const getReasonLabel = (reason) => reasonMap[reason] || reason
const getReasonColor = (reason) => {
  const colors = {
    'OBSOLETE': 'warning',
    'UPGRADE': 'success',
    'EQUIVALENT': 'info',
    'COST_SAVING': 'primary',
    'OTHER': ''
  }
  return colors[reason] || ''
}

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

const calculateOutTotal = () => {
  return executeForm.outItems.reduce((sum, item) => {
    return sum + (item.actualQty || 0) * (item.price || 0)
  }, 0).toFixed(2)
}

const calculateInTotal = () => {
  return executeForm.inItems.reduce((sum, item) => {
    return sum + (item.actualQty || item.planQty || 0) * (item.price || 0)
  }, 0).toFixed(2)
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
    const res = await request.get('/transfer/exchange/execute-list', {
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

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    orderNo: '',
    warehouse: '',
    status: 'APPROVED'
  })
  handleSearch()
}

const handleExecute = async (row) => {
  try {
    const res = await request.get(`/transfer/exchange/${row.id}`)
    const detail = res.data
    
    executeDialog.orderNo = detail.orderNo
    executeForm.id = detail.id
    executeForm.warehouse = detail.warehouse
    executeForm.outItems = detail.outItems.map(item => ({
      ...item,
      actualQty: item.planQty
    }))
    executeForm.inItems = detail.inItems.map(item => ({
      ...item,
      actualQty: item.planQty,
      location: '',
      batchNo: ''
    }))
    executeForm.remark = ''
    
    currentStep.value = 0
    await loadLocations(detail.warehouse)
    executeDialog.visible = true
  } catch (error) {
    ElMessage.error('获取单据详情失败')
  }
}

const handleContinue = (row) => {
  handleExecute(row)
}

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

const handleScan = (row, type) => {
  ElMessage.info('扫码功能待实现')
}

const handleNextStep = () => {
  if (currentStep.value === 0) {
    const hasOut = executeForm.outItems.some(item => item.actualQty > 0)
    if (!hasOut) {
      ElMessage.warning('请至少换出一条物料')
      return
    }
  }
  
  if (currentStep.value === 1) {
    executeForm.inItems.forEach(item => {
      if (!item.actualQty) {
        item.actualQty = item.planQty
      }
    })
  }
  
  currentStep.value++
}

const handlePrevStep = () => {
  currentStep.value--
}

const confirmExecute = async () => {
  const validInItems = executeForm.inItems.filter(item => item.actualQty > 0)
  if (validInItems.length === 0) {
    ElMessage.warning('请至少换入一条物料')
    return
  }

  for (const item of validInItems) {
    if (!item.location) {
      ElMessage.warning(`物料 ${item.materialName} 未选择储位`)
      return
    }
  }

  try {
    await ElMessageBox.confirm('确认完成以物换物操作？', '提示', {
      type: 'warning'
    })

    executing.value = true
    
    await request.post('/transfer/exchange/execute', {
      id: executeForm.id,
      outItems: executeForm.outItems.map(item => ({
        materialId: item.materialId,
        qty: item.actualQty
      })),
      inItems: validInItems.map(item => ({
        materialId: item.materialId,
        qty: item.actualQty,
        location: item.location,
        batchNo: item.batchNo
      })),
      remark: executeForm.remark
    })

    ElMessage.success('换物执行成功')
    executeDialog.visible = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('换物执行失败')
    }
  } finally {
    executing.value = false
  }
}

const handleDetail = () => {
  ElMessage.info('详情功能待实现')
}

onMounted(() => {
  loadMasterData()
  loadData()
})
</script>

<style scoped lang="scss">
.exchange-execute-container {
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

.exchange-info {
  margin-bottom: 20px;
}

.summary {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  text-align: right;
  font-size: 16px;

  .amount {
    color: #F56C6C;
    font-weight: bold;
    font-size: 18px;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

h3 {
  margin-bottom: 15px;
  color: #303133;
}

h4 {
  margin-bottom: 10px;
}
</style>
