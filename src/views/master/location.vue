<template>
  <div class="location-list">
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="库位编码"><el-input v-model="queryParams.locationCode" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="仓库"><el-select v-model="queryParams.warehouseId" placeholder="请选择" clearable><el-option v-for="item in warehouseOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="locationCode" label="库位编码" width="120" />
        <el-table-column prop="warehouseName" label="仓库" width="100" />
        <el-table-column prop="zoneName" label="库区" width="100" />
        <el-table-column prop="rackCode" label="货架" width="100" />
        <el-table-column prop="row" label="排" width="60" align="center" />
        <el-table-column prop="column" label="列" width="60" align="center" />
        <el-table-column prop="layer" label="层" width="60" align="center" />
        <el-table-column prop="capacity" label="容量" width="80" align="right" />
        <el-table-column prop="usedCapacity" label="已用" width="80" align="right" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '可用' : '禁用' }}</el-tag></template>
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
const queryParams = reactive({ locationCode: '', warehouseId: '', pageNum: 1, pageSize: 10 })
const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const warehouseOptions = ref([{ value: 1, label: '主仓库' }, { value: 2, label: '备品仓库' }])
const mockData = () => {
  tableData.value = [
    { id: 1, locationCode: 'A-01-01-01', warehouseName: '主仓库', zoneName: 'A区', rackCode: 'A-01', row: 1, column: 1, layer: 1, capacity: 100, usedCapacity: 80, status: 1 },
    { id: 2, locationCode: 'A-01-01-02', warehouseName: '主仓库', zoneName: 'A区', rackCode: 'A-01', row: 1, column: 1, layer: 2, capacity: 100, usedCapacity: 50, status: 1 },
    { id: 3, locationCode: 'B-02-01-01', warehouseName: '主仓库', zoneName: 'B区', rackCode: 'B-02', row: 2, column: 1, layer: 1, capacity: 50, usedCapacity: 0, status: 1 }
  ]
  total.value = 3
}
const handleQuery = () => { loading.value = true; setTimeout(() => { mockData(); loading.value = false }, 300) }
const handleReset = () => { Object.assign(queryParams, { locationCode: '', warehouseId: '', pageNum: 1 }); handleQuery() }
const handleAdd = () => { ElMessage.info('新增库位') }
const handleEdit = (row) => { ElMessage.info('编辑库位: ' + row.locationCode) }
const handleDelete = (row) => { ElMessageBox.confirm('确认删除?', '警告', { type: 'warning' }).then(() => { ElMessage.success('删除成功'); handleQuery() }) }
onMounted(() => handleQuery())
</script>
<style lang="scss" scoped>
.search-card { margin-bottom: 16px; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
