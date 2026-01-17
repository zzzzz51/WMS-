<template>
  <div class="return-execute-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">退料接收执行</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="退料单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="退料部门">
          <el-select v-model="searchForm.department" placeholder="全部" clearable>
            <el-option label="生产部" value="PRODUCTION" />
            <el-option label="维修部" value="MAINTENANCE" />
            <el-option label="研发部" value="RD" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待接收" value="APPROVED" />
            <el-option label="接收中" value="RECEIVING" />
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
        <el-table-column prop="orderNo" label="退料单号" min-width="160" />
        <el-table-column prop="department" label="退料部门" width="120" />
        <el-table-column prop="returnReason" label="退料原因" width="120">
          <template #default="{ row }">
            <el-tag :type="getReasonColor(row.returnReason)">
              {{ getReasonLabel(row.returnReason) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="退回仓库" width="120" />
        <el-table-column prop="totalQty" label="退料数量" width="100" align="right" />
        <el-table-column prop="receivedQty" label="已接收" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'APPROVED'" 
              type="primary" 
              size="small"
              icon="Check"
              @click="handleReceive(row)"
            >
              开始接收
            </el-button>
            <el-button 
              v-if="row.status === 'RECEIVING'" 
              type="success" 
              size="small"
              @click="handleContinue(row)"
            >
              继续接收
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

    <!-- 接收对话框 -->
    <el-dialog 
      v-model="receiveDialog.visible" 
      :title="`退料接收 - ${receiveDialog.orderNo}`" 
      width="75%"
      :close-on-click-modal="false"
    >
      <div class="receive-info">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="退料部门">{{ receiveForm.department }}</el-descriptions-item>
          <el-descriptions-item label="退回仓库">{{ receiveForm.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="退料原因">{{ getReasonLabel(receiveForm.returnReason) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 物料列表 -->
      <el-divider content-position="left">物料明细</el-divider>
      <el-table :data="receiveForm.items" border max-height="450">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="160" />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="70" align="center" />
        <el-table-column prop="returnQty" label="退料数量" width="100" align="right" />
        <el-table-column prop="receivedQty" label="已接收" width="100" align="right" />
        <el-table-column label="本次接收" width="120">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.currentQty" 
              :min="0" 
              :max="row.returnQty - row.receivedQty"
              :precision="2"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="质量状态" width="120">
          <template #default="{ row }">
            <el-select v-model="row.qualityStatus" size="small" placeholder="选择">
              <el-option label="合格" value="QUALIFIED" />
              <el-option label="待检" value="PENDING" />
              <el-option label="不合格" value="DEFECTIVE" />
            </el-select>
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
                v-for="loc in getLocationsByQuality(row.qualityStatus)"
                :key="loc.code"
                :label="`${loc.code} - ${loc.name}`"
                :value="loc.code"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="可选" size="small" />
          </template>
        </el-table-column>
      </el-table>

      <el-form :model="receiveForm" label-width="80px" style="margin-top: 20px">
        <el-form-item label="接收备注">
          <el-input v-model="receiveForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="receiveDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmReceive" :loading="receiving">确认接收</el-button>
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
  department: '',
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

// 接收对话框
const receiveDialog = reactive({
  visible: false,
  orderNo: ''
})

const receiveForm = reactive({
  id: '',
  department: '',
  warehouse: '',
  returnReason: '',
  items: [],
  remark: ''
})

const qualifiedLocations = ref([])  // 合格品储位
const pendingLocations = ref([])    // 待检品储位
const defectiveLocations = ref([])  // 不合格品储位
const receiving = ref(false)

// 退料原因映射
const reasonMap = {
  'SURPLUS': '领用剩余',
  'WRONG_MATERIAL': '错误物料',
  'QUALITY_ISSUE': '质量问题',
  'PROCESS_CHANGE': '工艺变更',
  'PROJECT_CANCEL': '项目取消',
  'OTHER': '其他'
}

const getReasonLabel = (reason) => reasonMap[reason] || reason
const getReasonColor = (reason) => {
  const colors = {
    'SURPLUS': 'success',
    'WRONG_MATERIAL': 'warning',
    'QUALITY_ISSUE': 'danger',
    'PROCESS_CHANGE': 'info',
    'PROJECT_CANCEL': 'info',
    'OTHER': ''
  }
  return colors[reason] || ''
}

// 状态映射
const statusMap = {
  'APPROVED': '待接收',
  'RECEIVING': '接收中',
  'COMPLETED': '已完成'
}

const getStatusLabel = (status) => statusMap[status] || status
const getStatusColor = (status) => {
  const colors = {
    'APPROVED': 'warning',
    'RECEIVING': 'primary',
    'COMPLETED': 'success'
  }
  return colors[status] || ''
}

// 根据质量状态获取储位
const getLocationsByQuality = (qualityStatus) => {
  if (qualityStatus === 'QUALIFIED') return qualifiedLocations.value
  if (qualityStatus === 'PENDING') return pendingLocations.value
  if (qualityStatus === 'DEFECTIVE') return defectiveLocations.value
  return []
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/outbound/return/receive-list', {
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
    department: '',
    status: 'APPROVED'
  })
  handleSearch()
}

// 开始接收
const handleReceive = async (row) => {
  try {
    // 获取详情
    const res = await request.get(`/outbound/return/${row.id}`)
    const detail = res.data
    
    receiveDialog.orderNo = detail.orderNo
    receiveForm.id = detail.id
    receiveForm.department = detail.department
    receiveForm.warehouse = detail.warehouse
    receiveForm.returnReason = detail.returnReason
    receiveForm.items = detail.items.map(item => ({
      ...item,
      currentQty: item.returnQty - item.receivedQty,
      qualityStatus: 'QUALIFIED',  // 默认合格
      location: '',
      remark: ''
    }))
    receiveForm.remark = ''
    
    // 加载储位（按质量状态分类）
    await loadLocationsByType(detail.warehouse)
    
    receiveDialog.visible = true
  } catch (error) {
    ElMessage.error('获取单据详情失败')
  }
}

// 继续接收
const handleContinue = (row) => {
  handleReceive(row)
}

// 加载储位（按类型）
const loadLocationsByType = async (warehouse) => {
  try {
    const res = await request.get('/master/locations', {
      params: { warehouse, status: 'ACTIVE' }
    })
    const locations = res.data
    
    // 按储位类型分类
    qualifiedLocations.value = locations.filter(loc => loc.type === 'NORMAL' || !loc.type)
    pendingLocations.value = locations.filter(loc => loc.type === 'INSPECTION')
    defectiveLocations.value = locations.filter(loc => loc.type === 'DEFECTIVE')
  } catch (error) {
    ElMessage.error('加载储位失败')
  }
}

// 确认接收
const confirmReceive = async () => {
  // 验证
  const validItems = receiveForm.items.filter(item => item.currentQty > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请至少录入一条物料数量')
    return
  }

  for (const item of validItems) {
    if (!item.qualityStatus) {
      ElMessage.warning(`物料 ${item.materialName} 未选择质量状态`)
      return
    }
    if (!item.location) {
      ElMessage.warning(`物料 ${item.materialName} 未选择储位`)
      return
    }
  }

  try {
    await ElMessageBox.confirm('确认接收退料？', '提示', {
      type: 'warning'
    })

    receiving.value = true
    
    await request.post('/outbound/return/receive', {
      id: receiveForm.id,
      items: validItems.map(item => ({
        materialId: item.materialId,
        qty: item.currentQty,
        qualityStatus: item.qualityStatus,
        location: item.location,
        remark: item.remark
      })),
      remark: receiveForm.remark
    })

    ElMessage.success('退料接收成功')
    receiveDialog.visible = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退料接收失败')
    }
  } finally {
    receiving.value = false
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
.return-execute-container {
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

.receive-info {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
