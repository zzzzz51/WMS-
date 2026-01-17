<template>
  <div class="app-container">
    <el-page-header @back="goBack" content="收货作业执行" style="margin-bottom: 20px;" />

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span>当前任务: {{ form.dispatchNo }}</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="供应商">上海精密电子</el-descriptions-item>
            <el-descriptions-item label="预计到货">2023-10-27</el-descriptions-item>
            <el-descriptions-item label="备注">请注意易碎品轻放</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover">
          <el-table :data="materialList" border height="400">
            <el-table-column prop="itemCode" label="物料编码" width="120" />
            <el-table-column prop="itemName" label="物料名称" />
            <el-table-column prop="planQty" label="应收数" width="90" />
            <el-table-column label="实收数" width="140">
              <template #default="{ row }">
                <el-input-number v-model="row.receivedQty" :min="0" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="批次号" width="160">
              <template #default="{ row }">
                <el-input v-model="row.batchNo" placeholder="生产批次" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="success" link @click="confirmReceive(row)" :disabled="row.status === 'Done'">
                  {{ row.status === 'Done' ? '已收' : '确认' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div style="margin-top: 20px; text-align: right;">
             <el-button type="primary" @click="finishTask">完成本次收货任务</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const form = reactive({
  dispatchNo: route.query.dispatchNo || 'DSP2023102701'
});

const materialList = ref([
  { id: 1, itemCode: 'M001', itemName: '控制主板 PCB', planQty: 100, receivedQty: 100, batchNo: '', status: 'Pending' },
  { id: 2, itemCode: 'M002', itemName: '连接线束', planQty: 500, receivedQty: 0, batchNo: '', status: 'Pending' }
]);

const confirmReceive = (row) => {
  if (!row.batchNo) {
    ElMessage.warning('请输入批次号');
    return;
  }
  row.status = 'Done';
  ElMessage.success(`物料 ${row.itemCode} 收货成功，已生成库存条码`);
  // 这里通常会触发打印机打印条码
};

const finishTask = () => {
  ElMessage.success('整单收货完成，已生成上架任务');
  router.push({ name: 'ReceiveTask' });
};

const goBack = () => router.back();
</script>