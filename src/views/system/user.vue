<template>
  <div class="user-manage">
    <h2>用户管理</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名"><el-input v-model="searchForm.username" placeholder="模糊搜索" clearable style="width:120px" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="searchForm.realName" placeholder="模糊搜索" clearable style="width:100px" /></el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.dept" placeholder="全部" clearable style="width:120px">
            <el-option v-for="d in depts" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:90px">
            <el-option label="启用" value="1" /><el-option label="停用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
      <el-button type="success" @click="handleExport">导出</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="80" />
        <el-table-column prop="dept" label="部门" width="100" />
        <el-table-column prop="role" label="角色" width="100"><template #default="{row}"><el-tag size="small">{{ row.role }}</el-tag></template></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="lastLogin" label="最后登录" width="150" />
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{row}"><el-switch v-model="row.status" active-value="1" inactive-value="0" @change="handleStatusChange(row)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handleResetPwd(row)">重置密码</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="用户名" prop="username"><el-input v-model="formData.username" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="姓名" prop="realName"><el-input v-model="formData.realName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="部门"><el-select v-model="formData.dept" style="width:100%"><el-option v-for="d in depts" :key="d" :label="d" :value="d" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="角色"><el-select v-model="formData.role" style="width:100%"><el-option v-for="r in roles" :key="r" :label="r" :value="r" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号"><el-input v-model="formData.phone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="formData.email" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态"><el-radio-group v-model="formData.status"><el-radio label="1">启用</el-radio><el-radio label="0">停用</el-radio></el-radio-group></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="submitForm">确定</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const depts = ['仓储部', '采购部', '生产部', '质量部', '设备部', '财务部']
const roles = ['管理员', '仓库主管', '仓库员', '采购员', '质检员']
const dialogVisible = ref(false), dialogTitle = ref('新增用户'), formRef = ref(null), tableData = ref([])
const searchForm = reactive({ username: '', realName: '', dept: '', status: '' })
const formData = reactive({ id: null, username: '', realName: '', dept: '仓储部', role: '仓库员', phone: '', email: '', status: '1' })
const rules = { username: [{ required: true, message: '请输入用户名' }], realName: [{ required: true, message: '请输入姓名' }] }
const handleSearch = () => {}, handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = '') }
const handleAdd = () => { dialogTitle.value = '新增用户'; Object.assign(formData, { id: null, username: '', realName: '', dept: '仓储部', role: '仓库员', phone: '', email: '', status: '1' }); dialogVisible.value = true }
const handleEdit = row => { dialogTitle.value = '编辑用户'; Object.assign(formData, row); dialogVisible.value = true }
const handleDelete = row => { ElMessageBox.confirm(`确定删除用户 ${row.username}？`).then(() => { tableData.value = tableData.value.filter(d => d.id !== row.id); ElMessage.success('删除成功') }).catch(() => {}) }
const handleResetPwd = row => { ElMessage.success(`已重置 ${row.username} 的密码为 123456`) }
const handleStatusChange = row => { ElMessage.success(`${row.username} 已${row.status === '1' ? '启用' : '停用'}`) }
const handleExport = () => ElMessage.success('导出成功')
const submitForm = async () => { await formRef.value?.validate(v => { if (!v) return; if (formData.id) { const i = tableData.value.findIndex(d => d.id === formData.id); if (i > -1) tableData.value[i] = { ...formData } } else { tableData.value.unshift({ ...formData, id: Date.now(), lastLogin: '-' }) }; ElMessage.success('保存成功'); dialogVisible.value = false }) }
onMounted(() => {
  tableData.value = [
    { id: 1, username: 'admin', realName: '管理员', dept: '仓储部', role: '管理员', phone: '13800138000', email: 'admin@wms.com', lastLogin: '2025-01-09 10:30', status: '1' },
    { id: 2, username: 'zhangsan', realName: '张三', dept: '仓储部', role: '仓库主管', phone: '13800138001', email: 'zhangsan@wms.com', lastLogin: '2025-01-09 09:15', status: '1' },
    { id: 3, username: 'lisi', realName: '李四', dept: '仓储部', role: '仓库员', phone: '13800138002', email: 'lisi@wms.com', lastLogin: '2025-01-08 16:45', status: '1' },
    { id: 4, username: 'wangwu', realName: '王五', dept: '采购部', role: '采购员', phone: '13800138003', email: 'wangwu@wms.com', lastLogin: '2025-01-08 14:20', status: '1' }
  ]
})
</script>
<style scoped>
.user-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
