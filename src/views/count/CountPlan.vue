<template>
  <div class="count-plan">
    <h2>盘点计划</h2>

    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planNo" placeholder="计划编号" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="盘点类型">
          <el-select v-model="searchForm.countType" placeholder="全部" clearable style="width: 120px">
            <el-option label="全盘" value="full" />
            <el-option label="抽盘" value="random" />
            <el-option label="动态盘点" value="dynamic" />
            <el-option label="循环盘点" value="cycle" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
        <el-icon><Plus /></el-icon> 新建盘点计划
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="planNo" label="计划编号" width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.planNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="planName" label="计划名称" min-width="160" />
        <el-table-column prop="countType" label="盘点类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeMap[row.countType]?.type" size="small">{{ typeMap[row.countType]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="盘点仓库" width="100" />
        <el-table-column prop="scope" label="盘点范围" width="120" />
        <el-table-column prop="planDate" label="计划日期" width="100" />
        <el-table-column prop="materialCount" label="物料数" width="80" align="center" />
        <el-table-column prop="progress" label="进度" width="140">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">{{ statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="80" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'draft'" type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleStart(row)">开始盘点</el-button>
            <el-button v-if="row.status === 'running'" type="primary" link size="small" @click="handleGenTask(row)">生成任务</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划名称" prop="planName">
              <el-input v-model="form.planName" placeholder="如：2025年1月全盘" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="盘点类型" prop="countType">
              <el-select v-model="form.countType" style="width: 100%">
                <el-option label="全盘" value="full" />
                <el-option label="抽盘" value="random" />
                <el-option label="动态盘点" value="dynamic" />
                <el-option label="循环盘点" value="cycle" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="盘点仓库" prop="warehouse">
              <el-select v-model="form.warehouse" style="width: 100%" multiple>
                <el-option label="WH01-主仓库" value="WH01" />
                <el-option label="WH02-原料仓" value="WH02" />
                <el-option label="WH03-成品仓" value="WH03" />
                <el-option label="WH04-备件仓" value="WH04" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划日期" prop="planDate">
              <el-date-picker v-model="form.planDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="盘点范围">
              <el-radio-group v-model="form.scopeType">
                <el-radio label="all">全部物料</el-radio>
                <el-radio label="category">按物料分类</el-radio>
                <el-radio label="location">按储位</el-radio>
                <el-radio label="value">按价值</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.scopeType === 'category'">
            <el-form-item label="物料分类">
              <el-select v-model="form.categories" multiple style="width: 100%">
                <el-option label="原材料" value="raw" />
                <el-option label="备品备件" value="spare" />
                <el-option label="工具" value="tool" />
                <el-option label="办公用品" value="office" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.scopeType === 'location'">
            <el-form-item label="储位范围">
              <el-input v-model="form.locationRange" placeholder="如：A1-01-01 到 A1-05-10" />
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.scopeType === 'value'">
            <el-form-item label="价值范围">
              <el-row :gutter="10">
                <el-col :span="11">
                  <el-input-number v-model="form.minValue" :min="0" placeholder="最小值" style="width: 100%" />
                </el-col>
                <el-col :span="2" style="text-align: center; line-height: 32px">至</el-col>
                <el-col :span="11">
                  <el-input-number v-model="form.maxValue" :min="0" placeholder="最大值" style="width: 100%" />
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.countType === 'random'">
            <el-form-item label="抽盘比例">
              <el-slider v-model="form.randomPercent" :format-tooltip="val => `${val}%`" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="盘点要求">
              <el-checkbox-group v-model="form.requirements">
                <el-checkbox label="blind">盲盘（不显示账面数量）</el-checkbox>
                <el-checkbox label="recount">差异复盘</el-checkbox>
                <el-checkbox label="photo">拍照留证</el-checkbox>
              </el-checkbox-group>
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
        <el-button type="primary" @click="handleSave">保存</el-button>
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
const dialogTitle = ref('新建盘点计划')
const formRef = ref(null)

const searchForm = reactive({ planNo: '', countType: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  planName: '',
  countType: 'full',
  warehouse: ['WH01'],
  planDate: '',
  scopeType: 'all',
  categories: [],
  locationRange: '',
  minValue: 0,
  maxValue: 0,
  randomPercent: 20,
  requirements: ['recount'],
  remark: ''
})

const rules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  countType: [{ required: true, message: '请选择盘点类型', trigger: 'change' }],
  warehouse: [{ required: true, message: '请选择盘点仓库', trigger: 'change' }],
  planDate: [{ required: true, message: '请选择计划日期', trigger: 'change' }]
}

const typeMap = {
  full: { label: '全盘', type: 'primary' },
  random: { label: '抽盘', type: 'success' },
  dynamic: { label: '动态盘点', type: 'warning' },
  cycle: { label: '循环盘点', type: 'info' }
}

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  running: { label: '进行中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' }
}

const tableData = ref([])

const generateData = () => {
  const types = ['full', 'random', 'dynamic', 'cycle']
  const statuses = ['draft', 'running', 'completed', 'draft', 'running']
  
  tableData.value = Array(12).fill(null).map((_, i) => ({
    id: i + 1,
    planNo: `PD2025011${String(i + 1).padStart(4, '0')}`,
    planName: [`2025年1月全盘`, `Q1抽盘`, `动态盘点-A区`, `循环盘点第${i + 1}批`][i % 4],
    countType: types[i % 4],
    warehouse: ['WH01', 'WH01,WH02', 'WH03', 'WH01,WH02,WH03'][i % 4],
    scope: ['全部物料', '原材料', 'A区储位', '备品备件'][i % 4],
    planDate: `2025-01-${String((i % 20) + 10).padStart(2, '0')}`,
    materialCount: Math.floor(Math.random() * 500) + 100,
    progress: i % 5 === 2 ? 100 : Math.floor(Math.random() * 80),
    status: statuses[i % 5],
    creator: ['张三', '李四'][i % 2]
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
  dialogTitle.value = '新建盘点计划'
  Object.assign(form, {
    planName: '',
    countType: 'full',
    warehouse: ['WH01'],
    planDate: new Date().toISOString().slice(0, 10),
    scopeType: 'all',
    categories: [],
    locationRange: '',
    minValue: 0,
    maxValue: 0,
    randomPercent: 20,
    requirements: ['recount'],
    remark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑盘点计划'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info(`查看计划：${row.planNo}`)
}

const handleStart = (row) => {
  ElMessageBox.confirm('确定开始执行此盘点计划？', '开始盘点', { type: 'warning' })
    .then(() => {
      row.status = 'running'
      ElMessage.success('盘点计划已开始')
    }).catch(() => {})
}

const handleGenTask = (row) => {
  router.push({ path: '/count/task', query: { planNo: row.planNo } })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定删除此盘点计划？', '提示', { type: 'warning' })
    .then(() => {
      const idx = tableData.value.findIndex(item => item.id === row.id)
      if (idx > -1) tableData.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    ElMessage.success('保存成功')
    dialogVisible.value = false
    generateData()
  } catch (e) {}
}

onMounted(() => {
  generateData()
})
</script>

<style scoped>
.count-plan { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
