<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="table-header">
        <span>待上架库存 (收货暂存区)</span>
        <el-button type="primary" icon="MagicStick" @click="autoAssignStrategy">系统自动分配库位</el-button>
      </div>

      <el-table :data="tableData" border style="margin-top: 10px;" v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="palletNo" label="托盘/箱码" width="140" />
        <el-table-column prop="itemCode" label="物料编码" width="120" />
        <el-table-column prop="itemName" label="物料名称" />
        <el-table-column prop="qty" label="数量" width="90" align="center" />
        <el-table-column prop="batchNo" label="批次" width="120" />
        <el-table-column prop="recommendBin" label="推荐库位" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.recommendBin" type="success">{{ row.recommendBin }}</el-tag>
            <span v-else class="text-gray">待分配</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handlePutaway(row)">执行上架</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);

const tableData = ref([
  { id: 1, palletNo: 'P20231027001', itemCode: 'M001', itemName: '控制主板 PCB', qty: 100, batchNo: 'B231027', recommendBin: '' },
  { id: 2, palletNo: 'P20231027002', itemCode: 'M002', itemName: '连接线束', qty: 500, batchNo: 'B231027', recommendBin: 'A-01-02-01' }
]);

const autoAssignStrategy = () => {
  loading.value = true;
  setTimeout(() => {
    tableData.value[0].recommendBin = 'B-02-01-01'; // 模拟计算
    loading.value = false;
    ElMessage.success('策略计算完成，库位已推荐');
  }, 800);
};

const handlePutaway = (row) => {
  if (!row.recommendBin) {
    ElMessage.warning('请先分配目标库位');
    return;
  }
  router.push({ name: 'PutawayWork', query: { palletNo: row.palletNo } });
};
</script>

<style scoped>
.table-header { display: flex; justify-content: space-between; align-items: center; }
.text-gray { color: #999; font-style: italic; }
</style>