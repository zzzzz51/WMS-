<template>
  <div class="warehouse-manage">
    <h2>仓库管理</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="仓库编码">
          <el-input v-model="searchForm.code" placeholder="模糊搜索" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="仓库名称">
          <el-input v-model="searchForm.name" placeholder="模糊搜索" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:100px">
            <el-option label="启用" value="1" />
            <el-option label="停用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新增仓库</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="code" label="仓库编码" width="120" />
        <el-table-column prop="name" label="仓库名称" width="150" />
        <el-table-column prop="type" label="仓库类型" width="100">
          <template #default="{row}">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积(㎡)" width="90" align="right" />
        <el-table-column prop="locationCount" label="库位数" width="80" align="right" />
        <el-table-column prop="manager" label="负责人" width="80" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{row}">
            <el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small">
              {{ row.status === '1' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handleLocation(row)">库位</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仓库编码" prop="code">
              <el-input v-model="formData.code" placeholder="如 WH001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="formData.name" placeholder="仓库名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库类型">
              <el-select v-model="formData.type" style="width:100%">
                <el-option label="MRO仓" value="MRO仓" />
                <el-option label="原料仓" value="原料仓" />
                <el-option label="成品仓" value="成品仓" />
                <el-option label="备件仓" value="备件仓" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积(㎡)">
              <el-input-number v-model="formData.area" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="formData.manager" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="formData.address" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio label="1">启用</el-radio>
                <el-radio label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)
const dialogTitle = ref('新增仓库')
const formRef = ref(null)
const tableData = ref([])
const searchForm = reactive({ code: '', name: '', status: '' })
const formData = reactive({ id: null, code: '', name: '', type: 'MRO仓', area: 0, manager: '', phone: '', address: '', status: '1' })
const rules = { code: [{ required: true, message: '请输入仓库编码', trigger: 'blur' }], name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }] }

const handleSearch = () => {
  // 实际项目中调用API
}
const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = '') }
const handleAdd = () => {
  dialogTitle.value = '新增仓库'
  Object.assign(formData, { id: null, code: '', name: '', type: 'MRO仓', area: 0, manager: '', phone: '', address: '', status: '1' })
  dialogVisible.value = true
}
const handleEdit = row => {
  dialogTitle.value = '编辑仓库'
  Object.assign(formData, row)
  dialogVisible.value = true
}
const handleDelete = row => {
  ElMessageBox.confirm(`确定删除仓库 ${row.name}？`, '确认').then(() => {
    tableData.value = tableData.value.filter(d => d.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}
const handleLocation = row => ElMessage.info(`查看 ${row.name} 的库位`)
const handleExport = () => ElMessage.success('导出成功')
const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (!valid) return
    if (formData.id) {
      const idx = tableData.value.findIndex(d => d.id === formData.id)
      if (idx > -1) tableData.value[idx] = { ...formData }
    } else {
      tableData.value.unshift({ ...formData, id: Date.now(), locationCount: 0 })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
  })
}

onMounted(() => {
  tableData.value = [
    { id: 1, code: 'WH001', name: 'MRO主仓库', type: 'MRO仓', area: 2000, locationCount: 500, manager: '张三', phone: '13800138001', address: '厂区A栋1楼', status: '1' },
    { id: 2, code: 'WH002', name: '原料仓库', type: '原料仓', area: 1500, locationCount: 300, manager: '李四', phone: '13800138002', address: '厂区B栋1楼', status: '1' },
    { id: 3, code: 'WH003', name: '成品仓库', type: '成品仓', area: 1800, locationCount: 400, manager: '王五', phone: '13800138003', address: '厂区C栋1楼', status: '1' },
    { id: 4, code: 'WH004', name: '备件仓库', type: '备件仓', area: 800, locationCount: 200, manager: '赵六', phone: '13800138004', address: '厂区D栋1楼', status: '1' }
  ]
})
</script>

<style scoped>
.warehouse-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
