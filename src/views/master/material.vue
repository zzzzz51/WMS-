<template>
  <div class="material-list">
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="物料编码">
          <el-input v-model="queryParams.materialCode" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="queryParams.materialName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="物料类型">
          <el-select v-model="queryParams.materialType" placeholder="请选择" clearable>
            <el-option label="原材料" value="RAW" />
            <el-option label="半成品" value="SEMI" />
            <el-option label="成品" value="FINISHED" />
            <el-option label="备件" value="SPARE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="Plus" @click="handleAdd">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格型号" width="120" />
        <el-table-column prop="materialTypeName" label="物料类型" width="100" />
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="abcClass" label="ABC分类" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getAbcType(row.abcClass)">{{ row.abcClass }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="safetyStock" label="安全库存" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status === 'ACTIVE' ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" layout="total, sizes, prev, pager, next" @change="handleQuery" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const queryParams = reactive({ materialCode: '', materialName: '', materialType: '', pageNum: 1, pageSize: 10 })
const loading = ref(false)
const total = ref(0)
const tableData = ref([])

const getAbcType = (abc) => ({ 'A': 'danger', 'B': 'warning', 'C': 'info' })[abc] || 'info'

const mockData = () => {
  tableData.value = [
    { id: 1, materialCode: 'M001', materialName: '轴承SKF6205', specification: '25*52*15', materialType: 'SPARE', materialTypeName: '备件', unit: '个', abcClass: 'A', safetyStock: 100, status: 'ACTIVE' },
    { id: 2, materialCode: 'M002', materialName: '电机Y2-132M', specification: '7.5KW', materialType: 'SPARE', materialTypeName: '备件', unit: '台', abcClass: 'A', safetyStock: 10, status: 'ACTIVE' },
    { id: 3, materialCode: 'M003', materialName: '液压油Shell', specification: '46#', materialType: 'RAW', materialTypeName: '原材料', unit: 'L', abcClass: 'B', safetyStock: 500, status: 'ACTIVE' }
  ]
  total.value = 3
}

const handleQuery = () => { loading.value = true; setTimeout(() => { mockData(); loading.value = false }, 300) }
const handleReset = () => { Object.assign(queryParams, { materialCode: '', materialName: '', materialType: '', pageNum: 1 }); handleQuery() }
const handleAdd = () => { ElMessage.info('新增物料') }
const handleEdit = (row) => { ElMessage.info('编辑物料: ' + row.materialCode) }
const handleDelete = (row) => { ElMessageBox.confirm('确认删除?', '警告', { type: 'warning' }).then(() => { ElMessage.success('删除成功'); handleQuery() }) }

onMounted(() => handleQuery())
</script>

<style lang="scss" scoped>
.search-card { margin-bottom: 16px; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
