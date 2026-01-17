<template>
  <div class="supplier-manage">
    <h2>供应商管理</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="供应商编码">
          <el-input v-model="searchForm.code" placeholder="模糊搜索" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.name" placeholder="模糊搜索" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="searchForm.level" placeholder="全部" clearable style="width:90px">
            <el-option label="A级" value="A" />
            <el-option label="B级" value="B" />
            <el-option label="C级" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:90px">
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
      <el-button type="primary" @click="handleAdd">新增供应商</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="code" label="供应商编码" width="120" />
        <el-table-column prop="name" label="供应商名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="shortName" label="简称" width="100" />
        <el-table-column prop="level" label="等级" width="70" align="center">
          <template #default="{row}">
            <el-tag :type="row.level === 'A' ? 'success' : row.level === 'B' ? 'primary' : 'info'" size="small" effect="dark">{{ row.level }}级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="80" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="email" label="邮箱" width="160" show-overflow-tooltip />
        <el-table-column prop="leadTime" label="交期(天)" width="80" align="right" />
        <el-table-column prop="paymentTerms" label="付款条件" width="100" />
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{row}">
            <el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small">{{ row.status === '1' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="code">
              <el-input v-model="formData.code" placeholder="如 SUP001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="formData.name" placeholder="供应商全称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称">
              <el-input v-model="formData.shortName" placeholder="简称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商等级">
              <el-select v-model="formData.level" style="width:100%">
                <el-option label="A级 (战略合作)" value="A" />
                <el-option label="B级 (优选供应)" value="B" />
                <el-option label="C级 (一般供应)" value="C" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="formData.contact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="formData.phone" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货周期">
              <el-input-number v-model="formData.leadTime" :min="1" style="width:100%" /> 天
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款条件">
              <el-select v-model="formData.paymentTerms" style="width:100%">
                <el-option label="月结30天" value="月结30天" />
                <el-option label="月结60天" value="月结60天" />
                <el-option label="货到付款" value="货到付款" />
                <el-option label="预付50%" value="预付50%" />
              </el-select>
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
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="formData.address" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" />
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
const dialogTitle = ref('新增供应商')
const formRef = ref(null)
const tableData = ref([])
const searchForm = reactive({ code: '', name: '', level: '', status: '' })
const formData = reactive({
  id: null, code: '', name: '', shortName: '', level: 'B',
  contact: '', phone: '', email: '', leadTime: 7,
  paymentTerms: '月结30天', address: '', remark: '', status: '1'
})
const rules = {
  code: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }]
}

const handleSearch = () => {}
const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = '') }
const handleAdd = () => {
  dialogTitle.value = '新增供应商'
  Object.assign(formData, { id: null, code: '', name: '', shortName: '', level: 'B', contact: '', phone: '', email: '', leadTime: 7, paymentTerms: '月结30天', address: '', remark: '', status: '1' })
  dialogVisible.value = true
}
const handleEdit = row => { dialogTitle.value = '编辑供应商'; Object.assign(formData, row); dialogVisible.value = true }
const handleDelete = row => { ElMessageBox.confirm(`确定删除供应商 ${row.name}？`, '确认').then(() => { tableData.value = tableData.value.filter(d => d.id !== row.id); ElMessage.success('删除成功') }).catch(() => {}) }
const handleDetail = row => ElMessage.info(`查看供应商 ${row.name} 详情`)
const handleExport = () => ElMessage.success('导出成功')
const submitForm = async () => {
  await formRef.value?.validate(valid => {
    if (!valid) return
    if (formData.id) {
      const idx = tableData.value.findIndex(d => d.id === formData.id)
      if (idx > -1) tableData.value[idx] = { ...formData }
    } else {
      tableData.value.unshift({ ...formData, id: Date.now() })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
  })
}

onMounted(() => {
  tableData.value = [
    { id: 1, code: 'SUP001', name: '上海精密轴承有限公司', shortName: '精密轴承', level: 'A', contact: '张经理', phone: '13800138001', email: 'zhang@bearing.com', leadTime: 5, paymentTerms: '月结30天', status: '1' },
    { id: 2, code: 'SUP002', name: '深圳华强电子科技有限公司', shortName: '华强电子', level: 'A', contact: '李总', phone: '13800138002', email: 'li@huaqiang.com', leadTime: 3, paymentTerms: '月结30天', status: '1' },
    { id: 3, code: 'SUP003', name: '江苏润滑油脂集团', shortName: '润滑油脂', level: 'B', contact: '王主任', phone: '13800138003', email: 'wang@lube.com', leadTime: 7, paymentTerms: '月结60天', status: '1' },
    { id: 4, code: 'SUP004', name: '浙江密封件制造有限公司', shortName: '密封件厂', level: 'B', contact: '赵工', phone: '13800138004', email: 'zhao@seal.com', leadTime: 10, paymentTerms: '货到付款', status: '1' },
    { id: 5, code: 'SUP005', name: '广东五金工具批发中心', shortName: '五金批发', level: 'C', contact: '钱老板', phone: '13800138005', email: 'qian@tools.com', leadTime: 2, paymentTerms: '货到付款', status: '1' }
  ]
})
</script>

<style scoped>
.supplier-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
