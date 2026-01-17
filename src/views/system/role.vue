<template>
  <div class="role-manage">
    <h2>角色管理</h2>
    <div class="action-bar"><el-button type="primary" @click="handleAdd">新增角色</el-button></div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="code" label="角色编码" width="120" />
        <el-table-column prop="name" label="角色名称" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="userCount" label="用户数" width="80" align="right" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{row}"><el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small">{{ row.status === '1' ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="150" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link size="small" @click="handlePermission(row)">权限</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="角色编码" prop="code"><el-input v-model="formData.code" /></el-form-item>
        <el-form-item label="角色名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="formData.status"><el-radio label="1">启用</el-radio><el-radio label="0">停用</el-radio></el-radio-group></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="submitForm">确定</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const dialogVisible = ref(false), dialogTitle = ref('新增角色'), formRef = ref(null), tableData = ref([])
const formData = reactive({ id: null, code: '', name: '', description: '', status: '1' })
const rules = { code: [{ required: true, message: '请输入角色编码' }], name: [{ required: true, message: '请输入角色名称' }] }
const handleAdd = () => { dialogTitle.value = '新增角色'; Object.assign(formData, { id: null, code: '', name: '', description: '', status: '1' }); dialogVisible.value = true }
const handleEdit = row => { dialogTitle.value = '编辑角色'; Object.assign(formData, row); dialogVisible.value = true }
const handleDelete = row => { ElMessageBox.confirm(`确定删除角色 ${row.name}？`).then(() => { tableData.value = tableData.value.filter(d => d.id !== row.id); ElMessage.success('删除成功') }).catch(() => {}) }
const handlePermission = row => ElMessage.info(`配置 ${row.name} 的权限`)
const submitForm = async () => { await formRef.value?.validate(v => { if (!v) return; if (formData.id) { const i = tableData.value.findIndex(d => d.id === formData.id); if (i > -1) tableData.value[i] = { ...formData } } else { tableData.value.unshift({ ...formData, id: Date.now(), userCount: 0, createTime: new Date().toLocaleString() }) }; ElMessage.success('保存成功'); dialogVisible.value = false }) }
onMounted(() => {
  tableData.value = [
    { id: 1, code: 'admin', name: '管理员', description: '系统管理员，拥有所有权限', userCount: 1, status: '1', createTime: '2024-01-01 00:00' },
    { id: 2, code: 'warehouse_manager', name: '仓库主管', description: '管理仓库日常运营', userCount: 2, status: '1', createTime: '2024-01-01 00:00' },
    { id: 3, code: 'warehouse_staff', name: '仓库员', description: '执行收发货、盘点等操作', userCount: 5, status: '1', createTime: '2024-01-01 00:00' },
    { id: 4, code: 'purchaser', name: '采购员', description: '负责采购相关操作', userCount: 2, status: '1', createTime: '2024-01-01 00:00' }
  ]
})
</script>
<style scoped>
.role-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
