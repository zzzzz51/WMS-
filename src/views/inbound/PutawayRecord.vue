<template>
  <div class="app-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="物料编码">
          <el-input v-model="query.itemCode" placeholder="物料编码" />
        </el-form-item>
        <el-form-item label="上架时间">
          <el-date-picker v-model="query.date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="margin-top: 10px;">
        <el-table-column prop="taskNo" label="上架任务号" width="140" />
        <el-table-column prop="itemCode" label="物料编码" width="120" />
        <el-table-column prop="itemName" label="物料名称" />
        <el-table-column prop="qty" label="上架数量" width="100" />
        <el-table-column prop="sourceBin" label="原库位" width="120">
          <template #default>收货暂存区</template>
        </el-table-column>
        <el-table-column prop="targetBin" label="目标库位" width="120" class-name="text-bold" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="operateTime" label="上架时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const query = reactive({ itemCode: '', date: '' });

const tableData = ref([
  { taskNo: 'PA2023102701', itemCode: 'M001', itemName: '控制主板 PCB', qty: 100, targetBin: 'B-02-01-01', operator: '张三', operateTime: '2023-10-27 10:30:00' },
  { taskNo: 'PA2023102702', itemCode: 'M002', itemName: '连接线束', qty: 500, targetBin: 'A-01-02-01', operator: '李四', operateTime: '2023-10-27 11:00:00' }
]);
</script>

<style scoped>
.text-bold { font-weight: bold; color: #409EFF; }
</style>