<template>
  <div class="count-record-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">盘点记录</span>
          <div class="actions">
            <el-button type="primary" icon="Refresh" @click="loadData">刷新</el-button>
            <el-button type="success" icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.countNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="盘点类型">
          <el-select v-model="searchForm.countType" placeholder="全部" clearable>
            <el-option label="全盘" value="FULL" />
            <el-option label="循环盘点" value="CYCLE" />
            <el-option label="抽盘" value="SPOT" />
            <el-option label="动态盘点" value="DYNAMIC" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse" placeholder="全部" clearable>
            <el-option 
              v-for="wh in warehouses" 
              :key="wh.code" 
              :label="wh.name" 
              :value="wh.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff20;">
              <el-icon :size="28" color="#409EFF"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">盘点次数</div>
              <div class="stat-value">{{ stats.totalCounts }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a20;">
              <el-icon :size="28" color="#67C23A"><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">盘点物料数</div>
              <div class="stat-value">{{ stats.totalItems }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c20;">
              <el-icon :size="28" color="#E6A23C"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">差异物料数</div>
              <div class="stat-value">{{ stats.totalDiffs }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card highlight">
            <div class="stat-icon" style="background: #f56c6c20;">
              <el-icon :size="28" color="#F56C6C"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">准确率</div>
              <div class="stat-value rate">{{ stats.accuracy }}%</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 列表 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="countNo" label="盘点单号" min-width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="handleDetail(row)">{{ row.countNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="countType" label="盘点类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.countType)">{{ getTypeLabel(row.countType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="120" />
        <el-table-column prop="countArea" label="盘点区域" width="120" />
        <el-table-column prop="totalItems" label="盘点物料数" width="110" align="right" />
        <el-table-column prop="diffItems" label="差异物料数" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.diffItems > 0 ? '#F56C6C' : '#67C23A', fontWeight: 'bold' }">
              {{ row.diffItems }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="数量准确率" width="110" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.qtyAccuracy" 
              :color="getAccuracyColor(row.qtyAccuracy)"
            />
          </template>
        </el-table-column>
        <el-table-column label="金额准确率" width="110" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.amountAccuracy" 
              :color="getAccuracyColor(row.amountAccuracy)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="盘点人" width="100" />
        <el-table-column prop="countDate" label="盘点日期" width="120" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDetail(row)">查看详情</el-button>
            <el-button type="info" link @click="handlePrint(row)">打印</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      :title="`盘点详情 - ${detailDialog.countNo}`" 
      width="90%"
    >
      <el-descriptions :column="3" border>
        <el-descriptions-item label="盘点单号">{{ detailData.countNo }}</el-descriptions-item>
        <el-descriptions-item label="盘点类型">
          <el-tag :type="getTypeColor(detailData.countType)">{{ getTypeLabel(detailData.countType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detailData.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="盘点区域">{{ detailData.countArea }}</el-descriptions-item>
        <el-descriptions-item label="盘点日期">{{ detailData.countDate }}</el-descriptions-item>
        <el-descriptions-item label="盘点人">{{ detailData.operator }}</el-descriptions-item>
        <el-descriptions-item label="盘点物料数">{{ detailData.totalItems }}</el-descriptions-item>
        <el-descriptions-item label="差异物料数">
          <span :style="{ color: detailData.diffItems > 0 ? '#F56C6C' : '#67C23A' }">
            {{ detailData.diffItems }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.timeUsed }}分钟</el-descriptions-item>
        <el-descriptions-item label="数量准确率">
          <el-progress 
            :percentage="detailData.qtyAccuracy" 
            :color="getAccuracyColor(detailData.qtyAccuracy)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="金额准确率">
          <el-progress 
            :percentage="detailData.amountAccuracy" 
            :color="getAccuracyColor(detailData.amountAccuracy)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="储位准确率">
          <el-progress 
            :percentage="detailData.locationAccuracy" 
            :color="getAccuracyColor(detailData.locationAccuracy)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">盘点明细</el-divider>
      
      <!-- Tab切换 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="全部物料" name="all">
          <el-table :data="detailData.items" border max-height="400">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="materialCode" label="物料编码" width="140" />
            <el-table-column prop="materialName" label="物料名称" min-width="150" />
            <el-table-column prop="location" label="储位" width="120" />
            <el-table-column prop="bookQty" label="账面数量" width="100" align="right" />
            <el-table-column prop="actualQty" label="实盘数量" width="100" align="right" />
            <el-table-column label="差异" width="100" align="right">
              <template #default="{ row }">
                <span :class="getDiffClass(row)">
                  {{ row.actualQty - row.bookQty }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.actualQty === row.bookQty ? 'success' : 'danger'">
                  {{ row.actualQty === row.bookQty ? '相符' : '差异' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="countTime" label="盘点时间" width="160" />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="差异物料" name="diff">
          <el-table :data="diffItems" border max-height="400">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="materialCode" label="物料编码" width="140" />
            <el-table-column prop="materialName" label="物料名称" min-width="150" />
            <el-table-column prop="location" label="储位" width="120" />
            <el-table-column prop="bookQty" label="账面数量" width="100" align="right" />
            <el-table-column prop="actualQty" label="实盘数量" width="100" align="right" />
            <el-table-column label="差异" width="100" align="right">
              <template #default="{ row }">
                <span :class="getDiffClass(row)">
                  {{ row.actualQty - row.bookQty }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column label="差异金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="getDiffClass(row)">
                  ¥{{ ((row.actualQty - row.bookQty) * row.price).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="diffReason" label="差异原因" width="130" />
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint(detailData)">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Box, Warning, TrendCharts } from '@element-plus/icons-vue'
import request from '@/utils/request'

const searchForm = reactive({
  countNo: '',
  countType: '',
  warehouse: '',
  dateRange: []
})

const stats = reactive({
  totalCounts: 0,
  totalItems: 0,
  totalDiffs: 0,
  accuracy: 0
})

const tableData = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const warehouses = ref([])

const detailDialog = reactive({
  visible: false,
  countNo: ''
})

const detailData = reactive({
  countNo: '',
  countType: '',
  warehouse: '',
  countArea: '',
  countDate: '',
  operator: '',
  totalItems: 0,
  diffItems: 0,
  timeUsed: 0,
  qtyAccuracy: 0,
  amountAccuracy: 0,
  locationAccuracy: 0,
  remark: '',
  items: []
})

const activeTab = ref('all')

const diffItems = computed(() => {
  return detailData.items.filter(item => item.actualQty !== item.bookQty)
})

const typeMap = {
  'FULL': '全盘',
  'CYCLE': '循环盘点',
  'SPOT': '抽盘',
  'DYNAMIC': '动态盘点'
}

const getTypeLabel = (type) => typeMap[type] || type
const getTypeColor = (type) => {
  const colors = {
    'FULL': 'danger',
    'CYCLE': 'primary',
    'SPOT': 'warning',
    'DYNAMIC': 'info'
  }
  return colors[type] || ''
}

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 99) return '#67C23A'
  if (accuracy >= 95) return '#E6A23C'
  return '#F56C6C'
}

const getDiffClass = (row) => {
  const diff = row.actualQty - row.bookQty
  if (diff > 0) return 'diff-positive'
  if (diff < 0) return 'diff-negative'
  return ''
}

const loadMasterData = async () => {
  try {
    const res = await request.get('/master/warehouses')
    warehouses.value = res.data
  } catch (error) {
    console.error('加载基础数据失败', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/count/records', {
      params: {
        countNo: searchForm.countNo,
        countType: searchForm.countType,
        warehouse: searchForm.warehouse,
        startDate: searchForm.dateRange?.[0],
        endDate: searchForm.dateRange?.[1],
        page: pagination.page,
        size: pagination.size
      }
    })
    
    tableData.value = res.data.records
    pagination.total = res.data.total
    Object.assign(stats, res.data.stats)
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    countNo: '',
    countType: '',
    warehouse: '',
    dateRange: []
  })
  handleSearch()
}

const handleDetail = async (row) => {
  try {
    const res = await request.get(`/count/records/${row.id}`)
    detailDialog.countNo = row.countNo
    Object.assign(detailData, res.data)
    activeTab.value = 'all'
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

const handlePrint = () => {
  ElMessage.info('打印功能待实现')
}

const handleExport = () => {
  ElMessage.success('导出功能待实现')
}

onMounted(() => {
  loadMasterData()
  
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  searchForm.dateRange = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
  
  loadData()
})
</script>

<style scoped lang="scss">
.count-record-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .actions {
    display: flex;
    gap: 10px;
  }
}

.search-form {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;

  &.highlight {
    border: 2px solid #F56C6C;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-content {
    flex: 1;

    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 5px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #303133;

      &.rate {
        color: #F56C6C;
      }
    }
  }
}

.diff-positive {
  color: #67C23A;
  font-weight: bold;
}

.diff-negative {
  color: #F56C6C;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
