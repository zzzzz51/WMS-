<template>
  <div class="transfer-execute-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">移拨执行</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="移拨单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="移拨类型">
          <el-select v-model="searchForm.transferType" placeholder="全部" clearable>
            <el-option label="仓库间移拨" value="WAREHOUSE" />
            <el-option label="储位调整" value="LOCATION" />
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
        <el-table-column prop="orderNo" label="移拨单号" min-width="160" />
        <el-table-column prop="transferType" label="移拨类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.transferType === 'WAREHOUSE' ? 'primary' : 'info'">
              {{ row.transferType === 'WAREHOUSE' ? '仓库间' : '储位调整' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fromWarehouse" label="源仓库" width="120" />
        <el-table-column prop="toWarehouse" label="目标仓库" width="120" />
        <el-table-column prop="totalQty" label="移拨数量" width="100" align="right" />
        <el-table-column prop="completedQty" label="已完成" width="100" align="right" />
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
      :title="`移拨执行 - ${executeDialog.orderNo}`" 
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="transfer-info">
        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step title="出库" description="从源储位出库" />
          <el-step title="转运" description="物料转运中" />
          <el-step title="入库" description="入目标储位" />
        </el-steps>
      </div>

      <el-divider />

      <!-- 出库步骤 -->
      <div v-if="currentStep === 0">
        <h3>第一步：从源仓库出库</h3>
        <el-table :data="executeForm.items" border max-height="400">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="unit" label="单位" width="70" align="center" />
          <el-table-column prop="planQty" label="计划数量" width="100" align="right" />
          <el-table-column prop="fromLocation" label="源储位" width="150" />
          <el-table-column label="实际出库" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.outQty" 
                :min="0" 
                :max="row.planQty"
                :precision="2"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="扫描" width="100">
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

      <!-- 转运步骤 -->
      <div v-if="currentStep === 1">
        <h3>第二步：物料转运确认</h3>
        <el-alert
          title="请确认物料已从源仓库出库，准备转运到目标仓库"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-table :data="executeForm.items" border>
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="outQty" label="已出库数量" width="120" align="right" />
          <el-table-column prop="fromWarehouse" label="源仓库" width="120" />
          <el-table-column prop="toWarehouse" label="目标仓库" width="120" />
          <el-table-column label="状态" width="100">
            <template>
              <el-tag type="warning">转运中</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 入库步骤 -->
      <div v-if="currentStep === 2">
        <h3>第三步：入目标仓库</h3>
        <el-table :data="executeForm.items" border max-height="400">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="materialCode" label="物料编码" width="140" />
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="spec" label="规格" width="120" />
          <el-table-column prop="outQty" label="出库数量" width="100" align="right" />
          <el-table-column label="实际入库" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.inQty" 
                :min="0" 
                :max="row.outQty"
                :precision="2"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="目标储位" width="200">
            <template #default="{ row }">
              <el-select 
                v-model="row.toLocation" 
                placeholder="选择储位" 
                filterable
                size="small"
              >
                <el-option
                  v-for="loc in targetLocations"
                  :key="loc.code"
                  :label="`${loc.code} - ${loc.name}`"
                  :value="loc.code"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="扫描" width="100">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                icon="Barcode"
                @click="handleScan(row, 'in')"
              >
                扫码
              </el-button>
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

    <!-- 扫码对话框 -->
    <el-dialog v-model="scanDialog.visible" title="扫码录入" width="400px">
      <el-input
        v-model="scanDialog.barcode"
        placeholder="请扫描条码或手工输入"
        ref="barcodeInput"
        @keyup.enter="handleBarcodeEnter"
      >
        <template #prepend>
          <el-icon><Barcode /></el-icon>
        </template>
      </el-input>
      <template #footer>
        <el-button @click="scanDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Barcode } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  transferType: '',
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
  fromWarehouse: '',
  toWarehouse: '',
  items: [],
  remark: ''
})

const currentStep = ref(0)
const targetLocations = ref([])
const executing = ref(false)

// 扫码对话框
const scanDialog = reactive({
  visible: false,
  barcode: '',
  currentRow: null,
  type: 'out' // out: 出库, in: 入库
})
const barcodeInput = ref(null)

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
    const res = await request.get('/transfer/execute-list', {
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
    transferType: '',
    status: 'APPROVED'
  })
  handleSearch()
}

// 开始执行
const handleExecute = async (row) => {
  try {
    const res = await request.get(`/transfer/order/${row.id}`)
    const detail = res.data
    
    executeDialog.orderNo = detail.orderNo
    executeForm.id = detail.id
    executeForm.fromWarehouse = detail.fromWarehouse
    executeForm.toWarehouse = detail.toWarehouse
    executeForm.items = detail.items.map(item => ({
      ...item,
      outQty: item.planQty,  // 默认全部出库
      inQty: 0,
      toLocation: ''
    }))
    executeForm.remark = ''
    
    currentStep.value = 0
    executeDialog.visible = true
    
    // 加载目标储位
    await loadTargetLocations(detail.toWarehouse)
  } catch (error) {
    ElMessage.error('获取单据详情失败')
  }
}

// 继续执行
const handleContinue = (row) => {
  handleExecute(row)
}

// 加载目标储位
const loadTargetLocations = async (warehouse) => {
  try {
    const res = await request.get('/master/locations', {
      params: { warehouse, status: 'ACTIVE' }
    })
    targetLocations.value = res.data
  } catch (error) {
    ElMessage.error('加载储位失败')
  }
}

// 下一步
const handleNextStep = () => {
  if (currentStep.value === 0) {
    // 验证出库数量
    const hasOut = executeForm.items.some(item => item.outQty > 0)
    if (!hasOut) {
      ElMessage.warning('请至少出库一条物料')
      return
    }
  }
  
  if (currentStep.value === 1) {
    // 初始化入库数量
    executeForm.items.forEach(item => {
      if (!item.inQty) {
        item.inQty = item.outQty
      }
    })
  }
  
  currentStep.value++
}

// 上一步
const handlePrevStep = () => {
  currentStep.value--
}

// 扫码
const handleScan = (row, type) => {
  scanDialog.currentRow = row
  scanDialog.type = type
  scanDialog.barcode = ''
  scanDialog.visible = true
  
  nextTick(() => {
    barcodeInput.value?.focus()
  })
}

// 条码回车
const handleBarcodeEnter = () => {
  const barcode = scanDialog.barcode.trim()
  if (!barcode) return
  
  const row = scanDialog.currentRow
  
  // 这里应该调用API验证条码并获取数量
  // 简化处理：直接设置数量
  if (scanDialog.type === 'out') {
    ElMessage.success(`出库扫码成功: ${barcode}`)
    row.outQty = row.planQty
  } else {
    ElMessage.success(`入库扫码成功: ${barcode}`)
    row.inQty = row.outQty
  }
  
  scanDialog.barcode = ''
}

// 确认执行
const confirmExecute = async () => {
  // 验证
  const validItems = executeForm.items.filter(item => item.inQty > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请至少入库一条物料')
    return
  }

  for (const item of validItems) {
    if (!item.toLocation) {
      ElMessage.warning(`物料 ${item.materialName} 未选择目标储位`)
      return
    }
  }

  try {
    await ElMessageBox.confirm('确认完成移拨执行？', '提示', {
      type: 'warning'
    })

    executing.value = true
    
    await request.post('/transfer/execute', {
      id: executeForm.id,
      items: validItems.map(item => ({
        materialId: item.materialId,
        outQty: item.outQty,
        inQty: item.inQty,
        fromLocation: item.fromLocation,
        toLocation: item.toLocation
      })),
      remark: executeForm.remark
    })

    ElMessage.success('移拨执行成功')
    executeDialog.visible = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移拨执行失败')
    }
  } finally {
    executing.value = false
  }
}

// 查看详情
const handleDetail = (row) => {
  ElMessage.info('详情功能待实现')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.transfer-execute-container {
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

.transfer-info {
  margin: 20px 0;
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
</style>
