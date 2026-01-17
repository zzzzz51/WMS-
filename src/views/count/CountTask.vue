<template>
  <div class="count-task-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">盘点任务管理</span>
          <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点计划">
          <el-input v-model="searchForm.planNo" placeholder="计划单号" clearable />
        </el-form-item>
        <el-form-item label="任务单号">
          <el-input v-model="searchForm.taskNo" placeholder="任务单号" clearable />
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
            <el-option label="待分配" value="PENDING" />
            <el-option label="已分配" value="ASSIGNED" />
            <el-option label="盘点中" value="COUNTING" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表 -->
      <el-table 
        :data="tableData" 
        border 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="taskNo" label="任务单号" min-width="160" />
        <el-table-column prop="planNo" label="盘点计划" min-width="160" />
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="countArea" label="盘点区域" width="120" />
        <el-table-column prop="totalItems" label="待盘物料数" width="110" align="right" />
        <el-table-column prop="completedItems" label="已盘物料数" width="110" align="right" />
        <el-table-column label="完成进度" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="getProgress(row)" 
              :color="getProgressColor(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="盘点人" width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignTime" label="分配时间" width="160" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'PENDING'" 
              type="primary" 
              size="small"
              @click="handleAssign(row)"
            >
              分配
            </el-button>
            <el-button 
              v-if="row.status === 'ASSIGNED' || row.status === 'COUNTING'" 
              type="success" 
              size="small"
              @click="handleViewProgress(row)"
            >
              查看进度
            </el-button>
            <el-button 
              v-if="row.status === 'COMPLETED'" 
              type="info" 
              size="small"
              @click="handleViewResult(row)"
            >
              查看结果
            </el-button>
            <el-button type="info" size="small" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedRows.length > 0">
        <span class="tip">已选择 {{ selectedRows.length }} 项</span>
        <el-button type="primary" @click="handleBatchAssign">批量分配</el-button>
      </div>

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

    <!-- 分配对话框 -->
    <el-dialog 
      v-model="assignDialog.visible" 
      title="分配盘点任务" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="任务单号">
          <el-tag>{{ assignForm.taskNo }}</el-tag>
        </el-form-item>
        <el-form-item label="仓库">
          <span>{{ assignForm.warehouse }}</span>
        </el-form-item>
        <el-form-item label="盘点区域">
          <span>{{ assignForm.countArea }}</span>
        </el-form-item>
        <el-form-item label="待盘物料数">
          <span>{{ assignForm.totalItems }}</span>
        </el-form-item>
        <el-form-item label="盘点人" required>
          <el-select 
            v-model="assignForm.assignee" 
            placeholder="请选择盘点人" 
            filterable
            style="width: 100%"
          >
            <el-option 
              v-for="user in countUsers" 
              :key="user.id" 
              :label="`${user.name} (${user.username})`" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始时间" required>
          <el-date-picker
            v-model="assignForm.planStartTime"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="计划结束时间" required>
          <el-date-picker
            v-model="assignForm.planEndTime"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign" :loading="assigning">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 进度查看对话框 -->
    <el-dialog 
      v-model="progressDialog.visible" 
      :title="`盘点进度 - ${progressDialog.taskNo}`" 
      width="80%"
    >
      <div class="progress-summary">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总物料数" :value="progressData.totalItems" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已盘数量" :value="progressData.completedItems">
              <template #suffix>/{{ progressData.totalItems }}</template>
            </el-statistic>
          </el-col>
          <el-col :span="6">
            <el-statistic title="差异数量" :value="progressData.diffItems" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="完成进度">
              <template #title>
                <span style="display: flex; align-items: center;">
                  完成进度
                  <el-progress 
                    :percentage="getProgress(progressData)" 
                    style="margin-left: 10px; flex: 1;"
                  />
                </span>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <el-table :data="progressData.items" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="materialCode" label="物料编码" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="location" label="储位" width="120" />
        <el-table-column prop="bookQty" label="账面数量" width="100" align="right" />
        <el-table-column prop="actualQty" label="实盘数量" width="100" align="right" />
        <el-table-column label="差异" width="100" align="right">
          <template #default="{ row }">
            <span :class="getDiffClass(row)">
              {{ row.actualQty - row.bookQty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="countTime" label="盘点时间" width="160" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'COUNTED' ? 'success' : 'info'">
              {{ row.status === 'COUNTED' ? '已盘' : '未盘' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 搜索表单
const searchForm = reactive({
  planNo: '',
  taskNo: '',
  warehouse: '',
  status: ''
})

// 列表数据
const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const selectedRows = ref([])

// 基础数据
const warehouses = ref([])
const countUsers = ref([])

// 分配对话框
const assignDialog = reactive({
  visible: false
})

const assignForm = reactive({
  taskNo: '',
  warehouse: '',
  countArea: '',
  totalItems: 0,
  assignee: '',
  planStartTime: '',
  planEndTime: '',
  remark: ''
})

const assigning = ref(false)

// 进度对话框
const progressDialog = reactive({
  visible: false,
  taskNo: ''
})

const progressData = reactive({
  totalItems: 0,
  completedItems: 0,
  diffItems: 0,
  items: []
})

// 状态映射
const statusMap = {
  'PENDING': '待分配',
  'ASSIGNED': '已分配',
  'COUNTING': '盘点中',
  'COMPLETED': '已完成'
}

const getStatusLabel = (status) => statusMap[status] || status
const getStatusColor = (status) => {
  const colors = {
    'PENDING': 'info',
    'ASSIGNED': 'warning',
    'COUNTING': 'primary',
    'COMPLETED': 'success'
  }
  return colors[status] || ''
}

// 计算进度
const getProgress = (row) => {
  if (row.totalItems === 0) return 0
  return Math.round((row.completedItems / row.totalItems) * 100)
}

const getProgressColor = (row) => {
  const progress = getProgress(row)
  if (progress >= 100) return '#67C23A'
  if (progress >= 50) return '#E6A23C'
  return '#409EFF'
}

// 差异样式
const getDiffClass = (row) => {
  const diff = row.actualQty - row.bookQty
  if (diff > 0) return 'diff-positive'
  if (diff < 0) return 'diff-negative'
  return ''
}

// 加载基础数据
const loadMasterData = async () => {
  try {
    const [whRes, userRes] = await Promise.all([
      request.get('/master/warehouses'),
      request.get('/system/users', { params: { role: 'COUNTER' } })
    ])
    warehouses.value = whRes.data
    countUsers.value = userRes.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/count/tasks', {
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
    planNo: '',
    taskNo: '',
    warehouse: '',
    status: ''
  })
  handleSearch()
}

// 选择改变
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 分配任务
const handleAssign = (row) => {
  assignForm.taskNo = row.taskNo
  assignForm.warehouse = row.warehouse
  assignForm.countArea = row.countArea
  assignForm.totalItems = row.totalItems
  assignForm.assignee = ''
  assignForm.planStartTime = ''
  assignForm.planEndTime = ''
  assignForm.remark = ''
  
  assignDialog.visible = true
}

// 批量分配
const handleBatchAssign = () => {
  ElMessage.info('批量分配功能待实现')
}

// 确认分配
const confirmAssign = async () => {
  if (!assignForm.assignee) {
    ElMessage.warning('请选择盘点人')
    return
  }
  if (!assignForm.planStartTime || !assignForm.planEndTime) {
    ElMessage.warning('请选择计划时间')
    return
  }

  try {
    assigning.value = true
    
    await request.post('/count/tasks/assign', {
      taskNo: assignForm.taskNo,
      assignee: assignForm.assignee,
      planStartTime: assignForm.planStartTime,
      planEndTime: assignForm.planEndTime,
      remark: assignForm.remark
    })

    ElMessage.success('分配成功')
    assignDialog.visible = false
    loadData()
  } catch (error) {
    ElMessage.error('分配失败')
  } finally {
    assigning.value = false
  }
}

// 查看进度
const handleViewProgress = async (row) => {
  try {
    const res = await request.get(`/count/tasks/${row.id}/progress`)
    
    progressDialog.taskNo = row.taskNo
    Object.assign(progressData, res.data)
    progressDialog.visible = true
  } catch (error) {
    ElMessage.error('获取进度失败')
  }
}

// 查看结果
const handleViewResult = (row) => {
  handleViewProgress(row)
}

// 查看详情
const handleDetail = (row) => {
  ElMessage.info('详情功能待实现')
}

onMounted(() => {
  loadMasterData()
  loadData()
})
</script>

<style scoped lang="scss">
.count-task-container {
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

.batch-actions {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 15px;

  .tip {
    color: #409EFF;
    font-weight: 500;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.progress-summary {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.diff-positive {
  color: #67C23A;
  font-weight: bold;
}

.diff-negative {
  color: #F56C6C;
  font-weight: bold;
}
</style>
