<template>
  <div class="pda-query">
    <div class="pda-header">
      <el-icon @click="goBack"><ArrowLeft /></el-icon>
      <h2>库存查询</h2>
      <el-icon><More /></el-icon>
    </div>

    <div class="search-area">
      <el-input v-model="searchKeyword" placeholder="物料编码/名称/条码" size="large" @keyup.enter="handleSearch" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
        <template #append>
          <el-button @click="handleSearch">查询</el-button>
        </template>
      </el-input>
      
      <div class="filter-row">
        <el-select v-model="filterWarehouse" placeholder="仓库" size="small" clearable style="width: 100px">
          <el-option label="全部" value="" />
          <el-option label="WH01" value="WH01" />
          <el-option label="WH02" value="WH02" />
          <el-option label="WH03" value="WH03" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="分类" size="small" clearable style="width: 100px">
          <el-option label="全部" value="" />
          <el-option label="原材料" value="raw" />
          <el-option label="备品备件" value="spare" />
          <el-option label="工具" value="tool" />
        </el-select>
        <el-checkbox v-model="onlyStock" size="small">仅有库存</el-checkbox>
      </div>
    </div>

    <!-- 查询结果 -->
    <div class="result-list">
      <div class="result-header">
        <span>查询结果 ({{ resultList.length }})</span>
      </div>

      <div class="result-item" v-for="item in resultList" :key="item.id" @click="viewDetail(item)">
        <div class="item-main">
          <div class="item-name">{{ item.materialName }}</div>
          <div class="item-code">{{ item.materialCode }}</div>
          <div class="item-spec">{{ item.spec }}</div>
        </div>
        <div class="item-stock">
          <div class="stock-value" :class="{ zero: item.totalStock === 0 }">{{ item.totalStock }}</div>
          <div class="stock-unit">{{ item.unit }}</div>
        </div>
        <el-icon><ArrowRight /></el-icon>
      </div>

      <el-empty v-if="resultList.length === 0 && searched" description="未找到物料" />
    </div>

    <!-- 库存明细弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="currentItem?.materialName" width="95%" fullscreen>
      <div class="detail-content" v-if="currentItem">
        <div class="detail-header-card">
          <div class="material-name">{{ currentItem.materialName }}</div>
          <div class="material-code">{{ currentItem.materialCode }}</div>
          <div class="material-spec">规格: {{ currentItem.spec }}</div>
          <div class="total-stock">
            <span class="stock-label">总库存:</span>
            <span class="stock-value">{{ currentItem.totalStock }} {{ currentItem.unit }}</span>
          </div>
        </div>

        <div class="stock-detail">
          <div class="detail-title">库存分布</div>
          <div class="location-item" v-for="loc in currentItem.locations" :key="loc.id">
            <div class="loc-info">
              <div class="loc-warehouse">{{ loc.warehouse }}</div>
              <div class="loc-position">{{ loc.location }}</div>
              <div class="loc-batch">批次: {{ loc.batchNo }}</div>
            </div>
            <div class="loc-qty">
              <div class="qty-value">{{ loc.quantity }}</div>
              <div class="qty-unit">{{ currentItem.unit }}</div>
            </div>
          </div>
        </div>

        <div class="stock-info">
          <div class="info-row">
            <span class="info-label">安全库存</span>
            <span class="info-value">{{ currentItem.safetyStock }} {{ currentItem.unit }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">库存状态</span>
            <el-tag :type="currentItem.totalStock > currentItem.safetyStock ? 'success' : 'danger'" size="small">
              {{ currentItem.totalStock > currentItem.safetyStock ? '正常' : '低于安全库存' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">最后入库</span>
            <span class="info-value">{{ currentItem.lastInbound }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">最后出库</span>
            <span class="info-value">{{ currentItem.lastOutbound }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, More, Search } from '@element-plus/icons-vue'

const router = useRouter()
const searchKeyword = ref('')
const filterWarehouse = ref('')
const filterCategory = ref('')
const onlyStock = ref(true)
const searched = ref(false)
const detailDialogVisible = ref(false)
const currentItem = ref(null)

const resultList = ref([
  { id: 1, materialCode: 'MAT000001', materialName: '螺栓M10×30', spec: 'M10×30', unit: '个', totalStock: 650, safetyStock: 100, lastInbound: '2025-01-10', lastOutbound: '2025-01-11', locations: [
    { id: 1, warehouse: 'WH01', location: 'A1-01-01', batchNo: 'BT20250108001', quantity: 500 },
    { id: 2, warehouse: 'WH01', location: 'A1-01-02', batchNo: 'BT20250110001', quantity: 150 }
  ]},
  { id: 2, materialCode: 'MAT000002', materialName: '螺母M10', spec: 'M10', unit: '个', totalStock: 450, safetyStock: 100, lastInbound: '2025-01-09', lastOutbound: '2025-01-11', locations: [
    { id: 1, warehouse: 'WH01', location: 'A1-02-01', batchNo: 'BT20250109001', quantity: 450 }
  ]},
  { id: 3, materialCode: 'MAT000025', materialName: '轴承6205', spec: '6205-2RS', unit: '个', totalStock: 80, safetyStock: 50, lastInbound: '2025-01-08', lastOutbound: '2025-01-10', locations: [
    { id: 1, warehouse: 'WH01', location: 'B2-03-01', batchNo: 'BT20250108003', quantity: 50 },
    { id: 2, warehouse: 'WH02', location: 'C1-01-05', batchNo: 'BT20250105001', quantity: 30 }
  ]},
  { id: 4, materialCode: 'MAT000108', materialName: '密封圈DN50', spec: 'DN50', unit: '个', totalStock: 200, safetyStock: 100, lastInbound: '2025-01-07', lastOutbound: '2025-01-09', locations: [
    { id: 1, warehouse: 'WH02', location: 'C2-02-03', batchNo: 'BT20250107001', quantity: 200 }
  ]},
  { id: 5, materialCode: 'MAT000203', materialName: '电机YE2', spec: 'YE2-90L-4', unit: '台', totalStock: 5, safetyStock: 3, lastInbound: '2025-01-05', lastOutbound: '2025-01-08', locations: [
    { id: 1, warehouse: 'WH01', location: 'D1-01-01', batchNo: 'BT20250105002', quantity: 5 }
  ]}
])

const goBack = () => {
  router.back()
}

const handleSearch = () => {
  searched.value = true
  if (searchKeyword.value) {
    ElMessage.success(`搜索: ${searchKeyword.value}`)
  }
}

const viewDetail = (item) => {
  currentItem.value = item
  detailDialogVisible.value = true
}
</script>

<style scoped>
.pda-query {
  min-height: 100vh;
  background: #f5f7fa;
  max-width: 500px;
  margin: 0 auto;
}

.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #00bcd4;
  color: #fff;
}

.pda-header h2 { margin: 0; font-size: 18px; }

.search-area {
  padding: 16px;
  background: #fff;
}

.filter-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  align-items: center;
}

.result-header {
  padding: 12px 16px;
  font-size: 14px;
  color: #606266;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.item-main { flex: 1; }
.item-name { font-size: 14px; font-weight: 500; color: #303133; }
.item-code { font-size: 12px; color: #909399; margin-top: 2px; }
.item-spec { font-size: 12px; color: #c0c4cc; margin-top: 2px; }

.item-stock { text-align: right; }
.stock-value { font-size: 20px; font-weight: 700; color: #67c23a; }
.stock-value.zero { color: #f56c6c; }
.stock-unit { font-size: 12px; color: #909399; }

/* 详情弹窗 */
.detail-content { padding: 0; }

.detail-header-card {
  background: linear-gradient(135deg, #00bcd4, #26c6da);
  color: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.detail-header-card .material-name {
  font-size: 18px;
  font-weight: 600;
}

.detail-header-card .material-code {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.detail-header-card .material-spec {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
}

.detail-header-card .total-stock {
  margin-top: 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.detail-header-card .stock-label {
  font-size: 14px;
}

.detail-header-card .stock-value {
  font-size: 28px;
  font-weight: 700;
}

.stock-detail {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.location-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.location-item:last-child { margin-bottom: 0; }

.loc-warehouse { font-size: 14px; font-weight: 500; color: #303133; }
.loc-position { font-size: 16px; color: #00bcd4; font-weight: 600; margin-top: 2px; }
.loc-batch { font-size: 12px; color: #909399; margin-top: 2px; }

.loc-qty { text-align: right; }
.loc-qty .qty-value { font-size: 20px; font-weight: 700; color: #303133; }
.loc-qty .qty-unit { font-size: 12px; color: #909399; }

.stock-info {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.stock-info .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #ebeef5;
}

.stock-info .info-row:last-child { border-bottom: none; }
.stock-info .info-label { font-size: 13px; color: #909399; }
.stock-info .info-value { font-size: 13px; color: #303133; }
</style>
