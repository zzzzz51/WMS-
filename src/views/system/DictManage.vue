<template>
  <div class="dict-manage">
    <h2>字典管理</h2>
    
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>字典类型</span>
              <el-button type="primary" size="small" @click="handleAddType">新增</el-button>
            </div>
          </template>
          <el-table :data="dictTypes" highlight-current-row @current-change="handleTypeChange" size="small">
            <el-table-column prop="code" label="字典编码" />
            <el-table-column prop="name" label="字典名称" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click.stop="handleDeleteType(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>字典数据 - {{ currentType?.name || '请选择字典类型' }}</span>
              <el-button type="primary" size="small" @click="handleAddData" :disabled="!currentType">新增</el-button>
            </div>
          </template>
          <el-table :data="dictData" size="small" border>
            <el-table-column prop="label" label="字典标签" />
            <el-table-column prop="value" label="字典值" />
            <el-table-column prop="sort" label="排序" width="80" align="center" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditData(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteData(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const currentType = ref(null)

const dictTypes = ref([
  { id: 1, code: 'material_type', name: '物料类型' },
  { id: 2, code: 'warehouse_type', name: '仓库类型' },
  { id: 3, code: 'unit', name: '计量单位' },
  { id: 4, code: 'abc_class', name: 'ABC分类' },
  { id: 5, code: 'urgency', name: '紧急程度' }
])

const dictData = ref([])

const dictDataMap = {
  material_type: [
    { id: 1, label: '原材料', value: 'raw', sort: 1, status: 1 },
    { id: 2, label: '半成品', value: 'semi', sort: 2, status: 1 },
    { id: 3, label: '成品', value: 'product', sort: 3, status: 1 },
    { id: 4, label: 'MRO', value: 'mro', sort: 4, status: 1 }
  ],
  warehouse_type: [
    { id: 1, label: '原料仓', value: 'raw', sort: 1, status: 1 },
    { id: 2, label: '成品仓', value: 'product', sort: 2, status: 1 },
    { id: 3, label: 'MRO仓', value: 'mro', sort: 3, status: 1 }
  ],
  unit: [
    { id: 1, label: '个', value: 'pcs', sort: 1, status: 1 },
    { id: 2, label: '件', value: 'set', sort: 2, status: 1 },
    { id: 3, label: '箱', value: 'box', sort: 3, status: 1 },
    { id: 4, label: '千克', value: 'kg', sort: 4, status: 1 }
  ],
  abc_class: [
    { id: 1, label: 'A类', value: 'A', sort: 1, status: 1 },
    { id: 2, label: 'B类', value: 'B', sort: 2, status: 1 },
    { id: 3, label: 'C类', value: 'C', sort: 3, status: 1 }
  ],
  urgency: [
    { id: 1, label: '普通', value: 'normal', sort: 1, status: 1 },
    { id: 2, label: '紧急', value: 'urgent', sort: 2, status: 1 },
    { id: 3, label: '特急', value: 'critical', sort: 3, status: 1 }
  ]
}

const handleTypeChange = (row) => {
  currentType.value = row
  dictData.value = row ? (dictDataMap[row.code] || []) : []
}

const handleAddType = () => { ElMessage.info('新增字典类型') }
const handleDeleteType = (row) => { ElMessageBox.confirm('确定删除？').then(() => ElMessage.success('删除成功')).catch(() => {}) }
const handleAddData = () => { ElMessage.info('新增字典数据') }
const handleEditData = (row) => { ElMessage.info('编辑: ' + row.label) }
const handleDeleteData = (row) => { ElMessageBox.confirm('确定删除？').then(() => ElMessage.success('删除成功')).catch(() => {}) }
</script>

<style scoped>
.dict-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
