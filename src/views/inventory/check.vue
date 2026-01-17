<template>
  <div class="inventory-check">
    <h2>库存盘点</h2>
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待盘点</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.checking }}</div>
          <div class="stat-label">盘点中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">准确率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.checkNo" placeholder="模糊搜索" clearable style="width:140px" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部" clearable style="width:120px">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="待盘点" value="pending" />
            <el-option label="盘点中" value="checking" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">新建盘点单</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="expand">
          <template #default="{row}">
            <div style="padding:16px">
              <el-table :data="row.items" size="small" border>
                <el-table-column prop="materialCode" label="物料编码" width="130" />
                <el-table-column prop="materialName" label="物料名称" min-width="150" />
                <el-table-column prop="location" label="库位" width="90" />
                <el-table-column prop="systemQty" label="系统数量" width="90" align="right" />
                <el-table-column prop="actualQty" label="实盘数量" width="90" align="right">
                  <template #default="{row: item}">
                    <span :class="item.actualQty !== item.systemQty ? 'text-danger' : ''">{{ item.actualQty ?? '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="差异" width="80" align="right">
                  <template #default="{row: item}">
                    <span v-if="item.actualQty != null" :class="getDiffClass(item)">{{ item.actualQty - item.systemQty }}</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="checkNo" label="盘点单号" width="150">
          <template #default="{row}"><el-link type="primary">{{ row.checkNo }}</el-link></template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="checkType" label="盘点类型" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.checkType === 'full' ? 'primary' : 'info'" size="small">
              {{ row.checkType === 'full' ? '全盘' : '抽盘' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemCount" label="物料数" width="80" align="right" />
        <el-table-column prop="diffCount" label="差异数" width="80" align="right">
          <template #default="{row}">
            <span :class="row.diffCount > 0 ? 'text-danger' : ''">{{ row.diffCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="accuracy" label="准确率" width="90" align="center">
          <template #default="{row}">
            <span v-if="row.status === 'completed'" :class="row.accuracy >= 99 ? 'text-success' : row.accuracy >= 95 ? 'text-warning' : 'text-danger'">
              {{ row.accuracy }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column prop="createDate" label="创建日期" width="100" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleStart(row)">开始盘点</el-button>
            <el-button v-if="row.status === 'checking'" type="success" link size="small" @click="handleSubmit(row)">提交</el-button>
            <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 'completed'" type="warning" link size="small" @click="handlePrint(row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" :total="pagination.total"
          layout="total, prev, pager, next" background @current-change="handleSearch" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建盘点单" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="盘点仓库">
          <el-select v-model="formData.warehouse" placeholder="选择仓库" style="width:100%">
            <el-option v-for="w in warehouses" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点类型">
          <el-radio-group v-model="formData.checkType">
            <el-radio label="full">全盘</el-radio>
            <el-radio label="sample">抽盘</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="盘点范围" v-if="formData.checkType === 'sample'">
          <el-input v-model="formData.scope" placeholder="如: A区、A1-01~A1-10" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const warehouses = ['MRO主仓', '原料仓', '成品仓', '备件仓']
const dialogVisible = ref(false)
const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ checkNo: '', warehouse: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const formData = reactive({ warehouse: '', checkType: 'full', scope: '', remark: '' })

const stats = computed(() => ({
  pending: allData.value.filter(d => d.status === 'pending').length,
  checking: allData.value.filter(d => d.status === 'checking').length,
  completed: allData.value.filter(d => d.status === 'completed').length,
  accuracy: 97.5
}))

const getStatusType = s => ({ pending: 'info', checking: 'warning', completed: 'success' }[s] || 'info')
const getStatusText = s => ({ pending: '待盘点', checking: '盘点中', completed: '已完成' }[s] || s)
const getDiffClass = item => item.actualQty > item.systemQty ? 'text-success' : item.actualQty < item.systemQty ? 'text-danger' : ''

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (searchForm.checkNo && !item.checkNo.includes(searchForm.checkNo)) return false
    if (searchForm.warehouse && item.warehouse !== searchForm.warehouse) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); handleSearch() }
const handleCreate = () => { Object.assign(formData, { warehouse: '', checkType: 'full', scope: '', remark: '' }); dialogVisible.value = true }
const submitForm = () => {
  allData.value.unshift({
    id: Date.now(), checkNo: `CHK${Date.now()}`, warehouse: formData.warehouse,
    checkType: formData.checkType, itemCount: Math.floor(Math.random() * 50) + 10,
    diffCount: 0, accuracy: null, status: 'pending', creator: '张三',
    createDate: new Date().toISOString().slice(0, 10),
    items: Array(5).fill(null).map((_, i) => ({
      materialCode: `MAT00${i + 1}`, materialName: `物料${i + 1}`, location: `A1-${i + 1}`,
      systemQty: Math.floor(Math.random() * 100) + 20, actualQty: null
    }))
  })
  ElMessage.success('创建成功')
  dialogVisible.value = false
  handleSearch()
}

const handleStart = row => { row.status = 'checking'; ElMessage.success('开始盘点'); handleSearch() }
const handleSubmit = row => {
  row.items.forEach(item => { item.actualQty = item.systemQty + Math.floor(Math.random() * 10) - 5 })
  row.diffCount = row.items.filter(i => i.actualQty !== i.systemQty).length
  row.accuracy = ((row.items.length - row.diffCount) / row.items.length * 100).toFixed(1)
  row.status = 'completed'
  ElMessage.success('提交成功')
  handleSearch()
}
const handleView = row => ElMessage.info('查看详情')
const handlePrint = row => ElMessage.info('打印盘点单')
const handleExport = () => ElMessage.success('导出成功')

onMounted(() => {
  const statuses = ['pending', 'checking', 'completed', 'completed']
  allData.value = Array(30).fill(null).map((_, i) => ({
    id: i + 1, checkNo: `CHK2024${String(i).padStart(6, '0')}`,
    warehouse: warehouses[i % 4], checkType: i % 3 === 0 ? 'sample' : 'full',
    itemCount: Math.floor(Math.random() * 50) + 10,
    diffCount: i % 4 === 3 ? Math.floor(Math.random() * 5) : 0,
    accuracy: i % 4 >= 2 ? (95 + Math.random() * 5).toFixed(1) : null,
    status: statuses[i % 4], creator: ['张三', '李四', '王五'][i % 3],
    createDate: `2024-12-${String((i % 28) + 1).padStart(2, '0')}`,
    items: Array(5).fill(null).map((_, j) => ({
      materialCode: `MAT00${j + 1}`, materialName: `物料${j + 1}`, location: `A${i % 3 + 1}-${j + 1}`,
      systemQty: Math.floor(Math.random() * 100) + 20,
      actualQty: i % 4 >= 2 ? Math.floor(Math.random() * 100) + 18 : null
    }))
  }))
  handleSearch()
})
</script>

<style scoped>
.inventory-check { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
</style>
