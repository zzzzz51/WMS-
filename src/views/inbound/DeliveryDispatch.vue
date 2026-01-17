<template>
  <div class="app-container">
    <el-card class="filter-container" shadow="never">
      <el-form :inline="true" :model="queryParams" size="default">
        <el-form-item label="ERP送货单号">
          <el-input v-model="queryParams.deliveryNo" placeholder="输入单号" clearable />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="queryParams.supplierName" placeholder="输入供应商名称" clearable />
        </el-form-item>
        <el-form-item label="预计到货日期">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="content-container" shadow="never" style="margin-top: 10px;">
      <div class="table-header">
        <span class="title">待分流任务清单</span>
        <el-button type="success" plain icon="Position" :disabled="selectedIds.length === 0" @click="handleBatchDispatch">
          批量分流
        </el-button>
      </div>

      <el-table :data="tableData" border v-loading="loading" @selection-change="handleSelectionChange" style="width: 100%; margin-top: 10px;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="deliveryNo" label="ERP送货单号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="supplierName" label="供应商" min-width="180" show-overflow-tooltip />
        <el-table-column prop="materialCount" label="物料行数" width="100" align="center" />
        <el-table-column prop="totalQty" label="送货总数" width="100" align="center" />
        <el-table-column prop="planDate" label="预计到货日" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag type="warning">待分流</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleDispatch(scope.row)">分流派工</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right;"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>

    <el-dialog title="送货分流 - 任务指派" v-model="dispatchDialogVisible" width="500px">
      <el-form :model="dispatchForm" label-width="100px">
        <el-form-item label="收货月台">
          <el-select v-model="dispatchForm.dock" placeholder="请选择月台" style="width: 100%">
            <el-option label="月台 A (普货)" value="Dock-A" />
            <el-option label="月台 B (冷链)" value="Dock-B" />
            <el-option label="月台 C (大件)" value="Dock-C" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定收货员">
          <el-select v-model="dispatchForm.receiverId" placeholder="请选择收货员" style="width: 100%">
            <el-option label="张三 (PDA-01)" value="101" />
            <el-option label="李四 (PDA-02)" value="102" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="dispatchForm.priority">
            <el-radio label="Normal">普通</el-radio>
            <el-radio label="Urgent" class="text-danger">加急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="dispatchForm.remark" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dispatchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDispatch">确认分流</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// --- 数据定义 ---
const loading = ref(false);
const total = ref(0);
const dispatchDialogVisible = ref(false);
const selectedIds = ref([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  deliveryNo: '',
  supplierName: '',
  dateRange: []
});

const dispatchForm = reactive({
  deliveryIds: [],
  dock: '',
  receiverId: '',
  priority: 'Normal',
  remark: ''
});

// 模拟数据
const tableData = ref([
  { id: 1, deliveryNo: 'DN20231027001', supplierName: '上海精密电子有限公司', materialCount: 5, totalQty: 1000, planDate: '2023-10-27', status: 0 },
  { id: 2, deliveryNo: 'DN20231027002', supplierName: '苏州塑胶科技', materialCount: 2, totalQty: 500, planDate: '2023-10-27', status: 0 },
]);

// --- 方法 ---

const getList = () => {
  loading.value = true;
  // TODO: 调用后端接口 fetchDeliveryWaitList
  setTimeout(() => {
    loading.value = false;
    total.value = 2; // Mock total
  }, 500);
};

const handleSearch = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.deliveryNo = '';
  queryParams.supplierName = '';
  queryParams.dateRange = [];
  handleSearch();
};

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id);
};

// 打开分流弹窗
const handleDispatch = (row) => {
  dispatchForm.deliveryIds = [row.id];
  openDispatchDialog();
};

const handleBatchDispatch = () => {
  if (selectedIds.value.length === 0) return;
  dispatchForm.deliveryIds = [...selectedIds.value];
  openDispatchDialog();
};

const openDispatchDialog = () => {
  dispatchForm.dock = '';
  dispatchForm.receiverId = '';
  dispatchForm.priority = 'Normal';
  dispatchForm.remark = '';
  dispatchDialogVisible.value = true;
};

// 提交分流
const submitDispatch = () => {
  // TODO: 调用后端接口 api.dispatchDelivery(dispatchForm)
  console.log('提交分流数据:', dispatchForm);
  
  ElMessage.success('分流指令已下达，等待收货员接收');
  dispatchDialogVisible.value = false;
  getList(); // 刷新列表
};

// 初始化
getList();
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 16px;
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
}
</style>