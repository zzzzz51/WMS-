<template>
  <div class="count-diff-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">盘点差异处理</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.countNo" placeholder="请输入" clearable />
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
        <el-form-item label="处理状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已提交" value="SUBMITTED" />
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
        <el-table-column prop="countNo" label="盘点单号" min-width="160" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="countDate" label="盘点日期" width="120" align="center" />
        <el-table-column prop="totalDiffItems" label="差异物料数" width="110" align="right" />
        <el-table-column prop="profitItems" label="盘盈" width="90" align="right">
          <template #default="{ row }">
            <span style="color: #67C23A; font-weight: bold;">{{ row.profitItems }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lossItems" label="盘亏" width="90" align="right">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: bold;">{{ row.lossItems }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalDiffAmount" label="差异金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.totalDiffAmount >= 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
              ¥{{ row.totalDiffAmount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="primary" 
              size="small"
              @click="handleProcess(row)"
            >
              处理差异
            </el-button>
            <el-button 
              v-if="row.status === 'PROCESSING'" 
              type="success" 
              size="small"
              @click="handleSubmit(row)"
            >
              提交审批
            </el-button>
            <el-button type="info" size="small" @click="handleDetail(row)">查看详情</el-button>
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

    <!-- 处理对话框 -->
    <el-dialog 
      v-model="processDialog.visible" 
      :title="`差异处理 - ${processDialog.countNo}`" 
      width="90%"
      :close-on-click-modal="false"
    >
      <div class="diff-summary">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="差异物料数" :value="processForm.totalDiffItems" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="盘盈数量" :value="processForm.profitItems">
              <template #suffix>
                <span style="color: #67C23A">项</span>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="8">
            <el-statistic title="盘亏数量" :value="processForm.lossItems">
              <template #suffix>
                <span style="color: #F56C6C">项</span>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </div>

      <el-divider content-position="left">差异明细</el-divider>
      <el-table :data="processForm.items" border max-height="500">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="location" label="储位" width="120" />
        <el-table-column prop="bookQty" label="账面数量" width="100" align="right" />
        <el-table-column prop="actualQty" label="实盘数量" width="100" align="right" />
        <el-table-column label="差异数量" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: getDiffColor(row), fontWeight: 'bold' }">
              {{ row.actualQty - row.bookQty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column label="差异金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: getDiffColor(row), fontWeight: 'bold' }">
              ¥{{ ((row.actualQty - row.bookQty) * row.price).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="差异原因" width="200">
          <template #default="{ row }">
            <el-select 
              v-model="row.diffReason" 
              placeholder="选择原因" 
              size="small"
            >
              <el-option label="系统记账错误" value="SYSTEM_ERROR" />
              <el-option label="实物损耗" value="PHYSICAL_LOSS" />
              <el-option label="计量误差" value="MEASUREMENT_ERROR" />
              <el-option label="未及时记账" value="DELAYED_RECORD" />
              <el-option label="盘点错误" value="COUNT_ERROR" />
              <el-option label="其他" value="OTHER" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="处理方式" width="150">
          <template #default="{ row }">
            <el-select 
              v-model="row.handleMethod" 
              placeholder="选择方式" 
              size="small"
            >
              <el-option label="调账" value="ADJUST" />
              <el-option label="报废" value="SCRAP" />
              <el-option label="追溯" value="TRACE" />
              <el-option label="重新盘点" value="RECOUNT" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="200">
          <template #default="{ row }">
            <el-input 
              v-model="row.remark" 
              placeholder="补充说明" 
              size="small"
              type="textarea"
              :rows="1"
            />
          </template>
        </el-table-column>
      </el-table>

      <el-form :model="processForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="处理说明">
          <el-input 
            v-model="processForm.handleDesc" 
            type="textarea" 
            :rows="3"
            placeholder="请输入整体处理说明..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="processDialog.visible = false">取消</el-button>
        <el-button type="warning" @click="saveProcess">保存</el-button>
        <el-button type="primary" @click="confirmProcess" :loading="processing">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      :title="`差异详情 - ${detailDialog.countNo}`" 
      width="85%"
    >
      <el-descriptions :column="3" border>
        <el-descriptions-item label="盘点单号">{{ detailData.countNo }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailData.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="盘点日期">{{ detailData.countDate }}</el-descriptions-item>
        <el-descriptions-item label="差异物料数">{{ detailData.totalDiffItems }}</el-descriptions-item>
        <el-descriptions-item label="盘盈">
          <span style="color: #67C23A;">{{ detailData.profitItems }}项</span>
        </el-descriptions-item>
        <el-descriptions-item label="盘亏">
          <span style="color: #F56C6C;">{{ detailData.lossItems }}项</span>
        </el-descriptions-item>
        <el-descriptions-item label="差异金额">
          <span :style="{ color: detailData.totalDiffAmount >= 0 ? '#67C23A' : '#F56C6C' }">
            ¥{{ detailData.totalDiffAmount }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="getStatusColor(detailData.status)">{{ getStatusLabel(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailData.operator }}</el-descriptions-item>
        <el-descriptions-item label="处理说明" :span="3">{{ detailData.handleDesc || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">差异明细</el-divider>
      <el-table :data="detailData.items" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="location" label="储位" width="120" />
        <el-table-column prop="bookQty" label="账面" width="90" align="right" />
        <el-table-column prop="actualQty" label="实盘" width="90" align="right" />
        <el-table-column label="差异" width="90" align="right">
          <template #default="{ row }">
            <span :style="{ color: getDiffColor(row), fontWeight: 'bold' }">
              {{ row.actualQty - row.bookQty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="diffReason" label="差异原因" width="130" />
        <el-table-column prop="handleMethod" label="处理方式" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const searchForm = reactive({
  countNo: '',
  warehouse: '',
  status: 'PENDING'
})

const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const warehouses = ref([])

const processDialog = reactive({
  visible: false,
  countNo: ''
})

const processForm = reactive({
  id: '',
  totalDiffItems: 0,
  profitItems: 0,
  lossItems: 0,
  items: [],
  handleDesc: ''
})

const processing = ref(false)

const detailDialog = reactive({
  visible: false,
  countNo: ''
})

const detailData = reactive({
  countNo: '',
  warehouse: '',
  countDate: '',
  totalDiffItems: 0,
  profitItems: 0,
  lossItems: 0,
  totalDiffAmount: 0,
  status: '',
  operator: '',
  handleDesc: '',
  items: []
})

const statusMap = {
  'PENDING': '待处理',
  'PROCESSING': '处理中',
  'SUBMITTED': '已提交',
  'COMPLETED': '已完成'
}

const getStatusLabel = (status) => statusMap[status] || status
const getStatusColor = (status) => {
  const colors = {
    'PENDING': 'warning',
    'PROCESSING': 'primary',
    'SUBMITTED': 'info',
    'COMPLETED': 'success'
  }
  return colors[status] || ''
}

const getDiffColor = (row) => {
  const diff = row.actualQty - row.bookQty
  return diff > 0 ? '#67C23A' : diff < 0 ? '#F56C6C' : '#909399'
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
    const res = await request.get('/count/diff/list', {
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
    countNo: '',
    warehouse: '',
    status: 'PENDING'
  })
  handleSearch()
}

const handleProcess = async (row) => {
  try {
    const res = await request.get(`/count/diff/${row.id}`)
    const data = res.data
    
    processDialog.countNo = data.countNo
    processForm.id = data.id
    processForm.totalDiffItems = data.totalDiffItems
    processForm.profitItems = data.profitItems
    processForm.lossItems = data.lossItems
    processForm.items = data.items.map(item => ({
      ...item,
      diffReason: item.diffReason || '',
      handleMethod: item.handleMethod || '',
      remark: item.remark || ''
    }))
    processForm.handleDesc = data.handleDesc || ''
    
    processDialog.visible = true
  } catch (error) {
    ElMessage.error('获取差异详情失败')
  }
}

const saveProcess = async () => {
  try {
    await request.post('/count/diff/save', {
      id: processForm.id,
      items: processForm.items,
      handleDesc: processForm.handleDesc
    })
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const confirmProcess = async () => {
  const unhandledItems = processForm.items.filter(item => !item.diffReason || !item.handleMethod)
  if (unhandledItems.length > 0) {
    ElMessage.warning('请完成所有差异项的原因和处理方式选择')
    return
  }

  try {
    await ElMessageBox.confirm('确认处理完成并提交ERP审批？', '提示', {
      type: 'warning'
    })

    processing.value = true
    
    await request.post('/count/diff/process', {
      id: processForm.id,
      items: processForm.items,
      handleDesc: processForm.handleDesc
    })

    ElMessage.success('处理成功，已提交ERP审批')
    processDialog.visible = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('处理失败')
    }
  } finally {
    processing.value = false
  }
}

const handleSubmit = async (row) => {
  try {
    await ElMessageBox.confirm('确认提交到ERP审批？', '提示', {
      type: 'warning'
    })

    await request.post(`/count/diff/${row.id}/submit`)
    ElMessage.success('提交成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

const handleDetail = async (row) => {
  try {
    const res = await request.get(`/count/diff/${row.id}`)
    detailDialog.countNo = row.countNo
    Object.assign(detailData, res.data)
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

onMounted(() => {
  loadMasterData()
  loadData()
})
</script>

<style scoped lang="scss">
.count-diff-container {
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

.diff-summary {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
