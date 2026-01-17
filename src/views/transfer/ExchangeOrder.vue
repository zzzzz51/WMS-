<template>
  <div class="exchange-order">
    <h2>以物换物单</h2>
    <el-alert type="success" :closable="false" style="margin-bottom: 16px">
      <template #title>
        以物换物单由WMS创建，提交ERP审批通过后可执行换物作业
      </template>
    </el-alert>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="换物单号">
          <el-input v-model="searchForm.orderNo" placeholder="换物单号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon> 新建换物单
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="orderNo" label="换物单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="换出物料" min-width="180">
          <template #default="{ row }">
            <div class="material-cell">
              <span class="material-name">{{ row.outMaterialName }}</span>
              <span class="material-code">{{ row.outMaterialCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="outQty" label="换出数量" width="100" align="right">
          <template #default="{ row }">
            <span class="out-qty">-{{ row.outQty }}</span>
          </template>
        </el-table-column>
        <el-table-column label="换入物料" min-width="180">
          <template #default="{ row }">
            <div class="material-cell">
              <span class="material-name">{{ row.inMaterialName }}</span>
              <span class="material-code">{{ row.inMaterialCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="inQty" label="换入数量" width="100" align="right">
          <template #default="{ row }">
            <span class="in-qty">+{{ row.inQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="换物原因" width="120" show-overflow-tooltip />
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'draft'" type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleSubmit(row)">提交审批</el-button>
            <el-button v-if="row.status === 'approved'" type="primary" link size="small" @click="handleExecute(row)">去执行</el-button>
            <el-button v-if="row.status === 'draft'" type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20, 50, 100]" background />
      </div>
    </el-card>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-divider content-position="left">换出物料（从库存扣减）</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="物料编码" prop="outMaterialCode">
              <el-input v-model="form.outMaterialCode" @blur="fetchOutMaterial">
                <template #append>
                  <el-button @click="selectOutMaterial">选择</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="物料名称">
              <el-input v-model="form.outMaterialName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="换出数量" prop="outQty">
              <el-input-number v-model="form.outQty" :min="1" :max="form.outStock" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可用库存">
              <span class="stock-info">{{ form.outStock || 0 }} {{ form.outUnit }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仓库">
              <el-input v-model="form.outWarehouse" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="储位">
              <el-input v-model="form.outLocation" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">换入物料（入库增加）</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="物料编码" prop="inMaterialCode">
              <el-input v-model="form.inMaterialCode" @blur="fetchInMaterial">
                <template #append>
                  <el-button @click="selectInMaterial">选择</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="物料名称">
              <el-input v-model="form.inMaterialName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="换入数量" prop="inQty">
              <el-input-number v-model="form.inQty" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标仓库" prop="inWarehouse">
              <el-select v-model="form.inWarehouse" style="width: 100%">
                <el-option label="WH01-主仓库" value="WH01" />
                <el-option label="WH02-原料仓" value="WH02" />
                <el-option label="WH03-成品仓" value="WH03" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标储位">
              <el-input v-model="form.inLocation" placeholder="入库储位" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">其他信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="换物原因" prop="reason">
              <el-select v-model="form.reason" style="width: 100%">
                <el-option label="规格替换" value="spec" />
                <el-option label="质量问题" value="quality" />
                <el-option label="供应商调换" value="supplier" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联单号">
              <el-input v-model="form.relatedOrder" placeholder="关联的采购单/领用单等" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave(false)">保存草稿</el-button>
        <el-button type="success" @click="handleSave(true)">保存并提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新建以物换物单')
const formRef = ref(null)

const searchForm = reactive({ orderNo: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  outMaterialCode: '',
  outMaterialName: '',
  outQty: 1,
  outStock: 0,
  outUnit: '个',
  outWarehouse: '',
  outLocation: '',
  inMaterialCode: '',
  inMaterialName: '',
  inQty: 1,
  inWarehouse: 'WH01',
  inLocation: '',
  reason: 'spec',
  relatedOrder: '',
  remark: ''
})

const rules = {
  outMaterialCode: [{ required: true, message: '请输入换出物料', trigger: 'blur' }],
  outQty: [{ required: true, message: '请输入换出数量', trigger: 'change' }],
  inMaterialCode: [{ required: true, message: '请输入换入物料', trigger: 'blur' }],
  inQty: [{ required: true, message: '请输入换入数量', trigger: 'change' }],
  inWarehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }],
  reason: [{ required: true, message: '请选择换物原因', trigger: 'change' }]
}

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending: { label: '待审批', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  completed: { label: '已完成', type: 'success' }
}

const tableData = ref([])

const generateOrderNo = () => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  return `HW${dateStr}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

const generateData = () => {
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed']
  
  tableData.value = Array(15).fill(null).map((_, i) => ({
    id: i + 1,
    orderNo: `HW2025011${String(i + 1).padStart(4, '0')}`,
    outMaterialCode: `MAT00000${i + 1}`,
    outMaterialName: `原物料${i + 1}`,
    outQty: Math.floor(Math.random() * 50) + 10,
    inMaterialCode: `MAT00010${i + 1}`,
    inMaterialName: `新物料${i + 1}`,
    inQty: Math.floor(Math.random() * 50) + 10,
    reason: ['规格替换', '质量问题', '供应商调换'][i % 3],
    creator: ['张三', '李四'][i % 2],
    createTime: `2025-01-${String((i % 10) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:30:00`,
    status: statuses[i % 5]
  }))
  pagination.total = tableData.value.length
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => loading.value = false, 300)
}

const handleReset = () => {
  Object.keys(searchForm).forEach(k => searchForm[k] = '')
  handleSearch()
}

const handleCreate = () => {
  dialogTitle.value = '新建以物换物单'
  Object.assign(form, {
    outMaterialCode: '', outMaterialName: '', outQty: 1, outStock: 0, outUnit: '个', outWarehouse: '', outLocation: '',
    inMaterialCode: '', inMaterialName: '', inQty: 1, inWarehouse: 'WH01', inLocation: '',
    reason: 'spec', relatedOrder: '', remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑以物换物单'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info(`查看换物单：${row.orderNo}`)
}

const fetchOutMaterial = () => {
  if (form.outMaterialCode) {
    form.outMaterialName = `物料-${form.outMaterialCode}`
    form.outStock = Math.floor(Math.random() * 200) + 50
    form.outUnit = '个'
    form.outWarehouse = 'WH01'
    form.outLocation = 'A1-01-01'
  }
}

const fetchInMaterial = () => {
  if (form.inMaterialCode) {
    form.inMaterialName = `物料-${form.inMaterialCode}`
  }
}

const selectOutMaterial = () => {
  ElMessage.info('打开物料选择弹窗')
}

const selectInMaterial = () => {
  ElMessage.info('打开物料选择弹窗')
}

const handleSave = async (submitApproval) => {
  try {
    await formRef.value?.validate()
    
    const newOrder = {
      id: Date.now(),
      orderNo: generateOrderNo(),
      ...form,
      creator: '当前用户',
      createTime: new Date().toLocaleString(),
      status: submitApproval ? 'pending' : 'draft'
    }
    
    tableData.value.unshift(newOrder)
    dialogVisible.value = false
    
    ElMessage.success(submitApproval ? '已保存并提交ERP审批' : '草稿保存成功')
  } catch (e) {}
}

const handleSubmit = (row) => {
  ElMessageBox.confirm('确定提交此换物单到ERP审批吗？', '提交审批', { type: 'warning' })
    .then(() => {
      row.status = 'pending'
      ElMessage.success('已提交ERP审批')
    }).catch(() => {})
}

const handleExecute = (row) => {
  router.push({ path: '/transfer/exchange-execute', query: { orderNo: row.orderNo } })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此换物单吗？', '提示', { type: 'warning' })
    .then(() => {
      const idx = tableData.value.findIndex(item => item.id === row.id)
      if (idx > -1) tableData.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.exchange-order { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.material-cell { line-height: 1.4; }
.material-name { display: block; font-size: 13px; color: #303133; }
.material-code { display: block; font-size: 12px; color: #909399; }

.out-qty { color: #f56c6c; font-weight: 600; }
.in-qty { color: #67c23a; font-weight: 600; }

.stock-info { color: #409eff; font-weight: 600; }
</style>
