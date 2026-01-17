<template>
  <div class="app-container">
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="接收单号">
          <el-input v-model="queryParams.receiveNo" placeholder="WMS生成的接收号" clearable />
        </el-form-item>
        <el-form-item label="原送货单号">
          <el-input v-model="queryParams.deliveryNo" placeholder="ERP单号" clearable />
        </el-form-item>
        <el-form-item label="接收状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="收货中" value="receiving" />
            <el-option label="已收货" value="received" />
            <el-option label="已验收" value="inspected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="content-container" shadow="never" style="margin-top: 10px;">
      <el-table :data="tableData" border v-loading="loading" style="width: 100%">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="receiveNo" label="接收单号" width="160" show-overflow-tooltip />
        <el-table-column prop="deliveryNo" label="关联送货单" width="160" show-overflow-tooltip />
        <el-table-column prop="supplierName" label="供应商" min-width="180" />
        <el-table-column prop="receiverName" label="收货员" width="100" align="center" />
        <el-table-column prop="dock" label="卸货月台" width="100" align="center" />
        <el-table-column prop="receiveTime" label="接收时间" width="160" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'received'" type="success">已完成</el-tag>
            <el-tag v-else-if="scope.row.status === 'receiving'" type="primary">作业中</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; text-align: right;"
        @current-change="getList"
      />
    </el-card>

    <el-drawer v-model="drawerVisible" title="接收单明细" size="50%">
      <div class="drawer-content">
        <el-descriptions title="基础信息" :column="2" border>
          <el-descriptions-item label="接收单号">{{ currentDetail.receiveNo }}</el-descriptions-item>
          <el-descriptions-item label="送货单号">{{ currentDetail.deliveryNo }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentDetail.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="接收人">{{ currentDetail.receiverName }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">物料明细</el-divider>

        <el-table :data="currentDetail.items" border stripe size="small">
          <el-table-column prop="itemCode" label="物料编码" width="120" />
          <el-table-column prop="itemName" label="物料名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="unit" label="单位" width="60" align="center" />
          <el-table-column prop="planQty" label="送货数" width="90" align="center" />
          <el-table-column prop="receivedQty" label="实收数" width="90" align="center">
            <template #default="scope">
              <span :class="scope.row.receivedQty < scope.row.planQty ? 'text-warning' : 'text-success'">
                {{ scope.row.receivedQty }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="batchNo" label="生产批次" width="120" show-overflow-tooltip />
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const loading = ref(false);
const total = ref(0);
const drawerVisible = ref(false);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  receiveNo: '',
  deliveryNo: '',
  status: ''
});

const currentDetail = reactive({
  receiveNo: '',
  deliveryNo: '',
  supplierName: '',
  receiverName: '',
  items: []
});

// 模拟记录数据
const tableData = ref([
  { 
    id: 1, 
    receiveNo: 'REC20231026008', 
    deliveryNo: 'DN20231026001', 
    supplierName: '深圳电子元器件厂', 
    receiverName: '张三', 
    dock: 'Dock-A',
    receiveTime: '2023-10-26 14:30:00', 
    status: 'received' 
  },
  { 
    id: 2, 
    receiveNo: 'REC20231026009', 
    deliveryNo: 'DN20231026002', 
    supplierName: '广州包装材料', 
    receiverName: '李四', 
    dock: 'Dock-B',
    receiveTime: '2023-10-26 15:10:00', 
    status: 'receiving' 
  }
]);

const getList = () => {
  loading.value = true;
  // TODO: API Call
  setTimeout(() => loading.value = false, 300);
};

const handleSearch = () => {
  getList();
};

const handleExport = () => {
  console.log('导出记录...');
};

const handleViewDetail = (row) => {
  // 模拟填充详情数据
  currentDetail.receiveNo = row.receiveNo;
  currentDetail.deliveryNo = row.deliveryNo;
  currentDetail.supplierName = row.supplierName;
  currentDetail.receiverName = row.receiverName;
  
  // 模拟明细行
  currentDetail.items = [
    { itemCode: 'M001', itemName: '电阻 10k', unit: 'PCS', planQty: 1000, receivedQty: 1000, batchNo: 'B20231010' },
    { itemCode: 'M002', itemName: '电容 100uf', unit: 'PCS', planQty: 500, receivedQty: 490, batchNo: 'B20231012' },
  ];
  
  drawerVisible.value = true;
};

// Init
getList();
</script>

<style scoped>
.text-warning {
  color: #e6a23c;
  font-weight: bold;
}
.text-success {
  color: #67c23a;
}
</style>