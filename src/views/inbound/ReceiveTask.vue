<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="filter-container">
        <el-input v-model="query.deliveryNo" placeholder="送货单号" style="width: 200px; margin-right: 10px;" />
        <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
      </div>

      <el-table :data="tableData" border style="margin-top: 10px;">
        <el-table-column prop="dispatchNo" label="分流任务号" width="150" />
        <el-table-column prop="deliveryNo" label="关联送货单" width="150" />
        <el-table-column prop="supplierName" label="供应商" />
        <el-table-column prop="dock" label="指定月台" width="100" align="center" />
        <el-table-column prop="skuCount" label="待收品项" width="100" align="center" />
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'High' ? 'danger' : 'info'">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="goToWork(scope.row)">开始收货</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const query = reactive({ deliveryNo: '' });

const tableData = ref([
  { dispatchNo: 'DSP2023102701', deliveryNo: 'DN20231027001', supplierName: '上海精密电子', dock: 'Dock-A', skuCount: 5, priority: 'Normal' },
  { dispatchNo: 'DSP2023102702', deliveryNo: 'DN20231027005', supplierName: '苏州塑胶科技', dock: 'Dock-B', skuCount: 2, priority: 'High' }
]);

const handleSearch = () => { console.log('Searching...'); };

const goToWork = (row) => {
  // 跳转到收货作业页面，并携带参数
  router.push({ name: 'ReceiveWork', query: { dispatchNo: row.dispatchNo } });
};
</script>