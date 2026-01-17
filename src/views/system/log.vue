<template>
  <div class="log-manage">
    <h2>操作日志</h2>
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="操作人"><el-input v-model="searchForm.operator" placeholder="操作人" clearable style="width:100px" /></el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width:100px">
            <el-option label="登录" value="登录" /><el-option label="新增" value="新增" /><el-option label="修改" value="修改" /><el-option label="删除" value="删除" /><el-option label="导出" value="导出" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="searchForm.module" placeholder="全部" clearable style="width:100px">
            <el-option label="物料管理" value="物料管理" /><el-option label="库存管理" value="库存管理" /><el-option label="入库管理" value="入库管理" /><el-option label="出库管理" value="出库管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" style="width:220px" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
    </el-card>
    <div class="action-bar">
      <el-button type="success" @click="handleExport">导出</el-button>
      <el-button type="danger" @click="handleClear">清空日志</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="tableData" border stripe max-height="500">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="type" label="操作类型" width="80">
          <template #default="{row}"><el-tag :type="getTypeTag(row.type)" size="small">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="100" />
        <el-table-column prop="content" label="操作内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="result" label="结果" width="70" align="center">
          <template #default="{row}"><el-tag :type="row.result === '成功' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const tableData = ref([])
const searchForm = reactive({ operator: '', type: '', module: '', dateRange: [] })
const getTypeTag = type => ({ '登录': 'primary', '新增': 'success', '修改': 'warning', '删除': 'danger', '导出': 'info' }[type] || 'info')
const handleSearch = () => {}, handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = k === 'dateRange' ? [] : '') }
const handleExport = () => ElMessage.success('导出成功')
const handleClear = () => { ElMessageBox.confirm('确定清空所有日志？此操作不可恢复！', '警告', { type: 'warning' }).then(() => { tableData.value = []; ElMessage.success('已清空') }).catch(() => {}) }
onMounted(() => {
  const types = ['登录', '新增', '修改', '删除', '导出']
  const modules = ['物料管理', '库存管理', '入库管理', '出库管理', '用户管理']
  const operators = ['admin', 'zhangsan', 'lisi', 'wangwu']
  tableData.value = Array(50).fill(null).map((_, i) => ({
    id: i + 1, operator: operators[i % 4], type: types[i % 5], module: modules[i % 5],
    content: `${types[i % 5]}了${modules[i % 5]}中的数据记录`, ip: `192.168.1.${100 + (i % 50)}`,
    result: i % 10 === 0 ? '失败' : '成功', createTime: `2025-01-${String(9 - (i % 3)).padStart(2, '0')} ${String(8 + (i % 12))}:${String(i % 60).padStart(2, '0')}:00`
  }))
})
</script>
<style scoped>
.log-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
