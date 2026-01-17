<template>
  <div class="warehouse-list">
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="仓库编码"><el-input v-model="queryParams.warehouseCode" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="仓库名称"><el-input v-model="queryParams.warehouseName" placeholder="请输入" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="warehouseCode" label="仓库编码" width="120" />
        <el-table-column prop="warehouseName" label="仓库名称" min-width="150" />
        <el-table-column prop="warehouseType" label="仓库类型" width="100" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="manager" label="管理员" width="100" />
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
const queryParams = reactive({ warehouseCode: '', warehouseName: '', pageNum: 1, pageSize: 10 })
const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const mockData = () => {
  tableData.value = [
    { id: 1, warehouseCode: 'WH001', warehouseName: '主仓库', warehouseType: '原材料仓', address: '厂区A栋1楼', manager: '张三', status: 1 },
    { id: 2, warehouseCode: 'WH002', warehouseName: '备品仓库', warehouseType: '备件仓', address: '厂区B栋2楼', manager: '李四', status: 1 },
    { id: 3, warehouseCode: 'WH003', warehouseName: '危化品仓库', warehouseType: '特殊仓', address: '厂区C栋', manager: '王五', status: 1 }
  ]
  total.value = 3
}
const handleQuery = () => { loading.value = true; setTimeout(() => { mockData(); loading.value = false }, 300) }
const handleReset = () => { Object.assign(queryParams, { warehouseCode: '', warehouseName: '', pageNum: 1 }); handleQuery() }
const handleAdd = () => { ElMessage.info('新增仓库') }
const handleEdit = (row) => { ElMessage.info('编辑仓库: ' + row.warehouseCode) }
const handleDelete = (row) => { ElMessageBox.confirm('确认删除?', '警告', { type: 'warning' }).then(() => { ElMessage.success('删除成功'); handleQuery() }) }
onMounted(() => handleQuery())
</script>
<style lang="scss" scoped>
.search-card { margin-bottom: 16px; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
