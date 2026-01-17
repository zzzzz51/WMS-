<template>
  <div class="supplier-list">
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="供应商编码"><el-input v-model="queryParams.supplierCode" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="供应商名称"><el-input v-model="queryParams.supplierName" placeholder="请输入" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="supplierCode" label="供应商编码" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="creditLevel" label="信用等级" width="100" align="center">
          <template #default="{ row }"><el-rate v-model="row.creditLevel" disabled /></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container"><el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" layout="total, sizes, prev, pager, next" @change="handleQuery" /></div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const queryParams = reactive({ supplierCode: '', supplierName: '', pageNum: 1, pageSize: 10 })
const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const mockData = () => {
  tableData.value = [
    { id: 1, supplierCode: 'SUP001', supplierName: 'SKF轴承', contactPerson: '张经理', contactPhone: '13800138001', creditLevel: 5, status: 1 },
    { id: 2, supplierCode: 'SUP002', supplierName: '西门子电机', contactPerson: '李经理', contactPhone: '13800138002', creditLevel: 4, status: 1 },
    { id: 3, supplierCode: 'SUP003', supplierName: '壳牌润滑油', contactPerson: '王经理', contactPhone: '13800138003', creditLevel: 5, status: 1 }
  ]
  total.value = 3
}
const handleQuery = () => { loading.value = true; setTimeout(() => { mockData(); loading.value = false }, 300) }
const handleReset = () => { Object.assign(queryParams, { supplierCode: '', supplierName: '', pageNum: 1 }); handleQuery() }
const handleAdd = () => { ElMessage.info('新增供应商') }
const handleEdit = (row) => { ElMessage.info('编辑供应商: ' + row.supplierCode) }
const handleDelete = (row) => { ElMessageBox.confirm('确认删除?', '警告', { type: 'warning' }).then(() => { ElMessage.success('删除成功'); handleQuery() }) }
onMounted(() => handleQuery())
</script>
<style lang="scss" scoped>
.search-card { margin-bottom: 16px; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
