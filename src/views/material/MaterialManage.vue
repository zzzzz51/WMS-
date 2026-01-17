<template>
  <div class="material-manage">
    <h2>物料管理</h2>
    
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card blue">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">物料总数</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card green">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">启用中</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card orange">
          <div class="stat-value">{{ stats.lowStock }}</div>
          <div class="stat-label">低库存预警</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="never" class="stat-card purple">
          <div class="stat-value">{{ stats.newThisMonth }}</div>
          <div class="stat-label">本月新增</div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <!-- 快速搜索 -->
      <div class="quick-search">
        <el-input v-model="globalKeyword" placeholder="输入编码/名称/规格/供应商快速搜索..." clearable
          style="width: 400px" @keyup.enter="handleSearch" @clear="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
          <template #append>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        <el-button link type="primary" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起' : '高级搜索' }}
          <el-icon><ArrowDown v-if="!showAdvanced" /><ArrowUp v-else /></el-icon>
        </el-button>
      </div>
      
      <!-- 高级搜索 -->
      <el-form v-show="showAdvanced" :model="searchForm" inline class="advanced-search">
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="模糊匹配" clearable style="width: 130px" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="模糊匹配" clearable style="width: 130px" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="searchForm.spec" placeholder="模糊匹配" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="物料类型">
          <el-select v-model="searchForm.materialType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in materialTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="ABC分类">
          <el-select v-model="searchForm.abcClass" placeholder="全部" clearable style="width: 90px">
            <el-option label="A类" value="A" />
            <el-option label="B类" value="B" />
            <el-option label="C类" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchForm.supplier" placeholder="模糊匹配" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 90px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="left-btns">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        <el-dropdown trigger="click" @command="handleImportCmd">
          <el-button type="warning">
            <el-icon><Upload /></el-icon> 导入 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="template">下载导入模板</el-dropdown-item>
              <el-dropdown-item command="import" divided>导入Excel</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button @click="handlePrintList">
          <el-icon><Printer /></el-icon> 打印列表
        </el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon> 删除 ({{ selectedRows.length }})
        </el-button>
      </div>
      <div class="right-info">
        共 <strong>{{ pagination.total }}</strong> 条，已选 <strong>{{ selectedRows.length }}</strong> 条
      </div>
      <input ref="importFileRef" type="file" accept=".xls,.xlsx" style="display:none" @change="handleFileChange" />
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe row-key="id"
        @selection-change="handleSelectionChange" @sort-change="handleSortChange"
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="130" sortable="custom">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">
              <span v-html="highlight(row.materialCode)"></span>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="materialName" label="物料名称" min-width="180" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-html="highlight(row.materialName)"></span>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="规格型号" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-html="highlight(row.spec)"></span>
          </template>
        </el-table-column>
        <el-table-column prop="materialType" label="类型" width="85" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.materialType)" size="small">{{ row.materialType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" align="center" />
        <el-table-column prop="price" label="单价" width="90" align="right" sortable="custom">
          <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="90" align="right" sortable="custom">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.currentStock < row.safetyStock }">{{ row.currentStock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="safetyStock" label="安全库存" width="90" align="right" />
        <el-table-column prop="abcClass" label="ABC" width="60" align="center">
          <template #default="{ row }">
            <el-tag :type="getAbcType(row.abcClass)" effect="dark" size="small">{{ row.abcClass }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="110" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-html="highlight(row.supplier)"></span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handlePrintBarcode(row)">条码</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleMoreCmd(cmd, row)">
              <el-button type="info" link size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="attach">附件</el-dropdown-item>
                  <el-dropdown-item command="history">变更记录</el-dropdown-item>
                  <el-dropdown-item command="delete" divided style="color:#f56c6c">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSearch" @current-change="handleSearch" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="850px" :close-on-click-modal="false" top="5vh">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="物料编码" prop="materialCode">
                  <el-input v-model="formData.materialCode" placeholder="请输入物料编码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="物料名称" prop="materialName">
                  <el-input v-model="formData.materialName" placeholder="请输入物料名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规格型号" prop="spec">
                  <el-input v-model="formData.spec" placeholder="请输入规格型号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="物料类型" prop="materialType">
                  <el-select v-model="formData.materialType" placeholder="请选择" style="width:100%">
                    <el-option v-for="t in materialTypes" :key="t" :label="t" :value="t" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="计量单位" prop="unit">
                  <el-select v-model="formData.unit" placeholder="请选择" style="width:100%">
                    <el-option v-for="u in units" :key="u" :label="u" :value="u" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="单价(元)" prop="price">
                  <el-input-number v-model="formData.price" :min="0" :precision="2" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="ABC分类">
                  <el-select v-model="formData.abcClass" style="width:100%">
                    <el-option label="A类-重要" value="A" />
                    <el-option label="B类-一般" value="B" />
                    <el-option label="C类-次要" value="C" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="库存设置" name="stock">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="安全库存">
                  <el-input-number v-model="formData.safetyStock" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="最大库存">
                  <el-input-number v-model="formData.maxStock" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="补货点">
                  <el-input-number v-model="formData.reorderPoint" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="采购周期(天)">
                  <el-input-number v-model="formData.leadTime" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="保质期(天)">
                  <el-input-number v-model="formData.shelfLife" :min="0" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="最小起订量">
                  <el-input-number v-model="formData.minOrderQty" :min="1" style="width:100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="供应商" name="supplier">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="主供应商">
                  <el-input v-model="formData.supplier" placeholder="供应商名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商编码">
                  <el-input v-model="formData.supplierCode" placeholder="供应商编码" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="备注">
                  <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="备注信息" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="附件" name="attach">
            <el-upload ref="uploadRef" action="#" :auto-upload="false" :file-list="formData.attachments"
              :on-change="handleAttachChange" :on-remove="handleAttachRemove" multiple :limit="10"
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx" drag>
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持jpg/png/pdf/doc/xls格式，单文件不超过10MB</div>
              </template>
            </el-upload>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入预览对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入预览" width="950px">
      <el-alert v-if="importResult" :type="importResult.valid ? 'success' : 'warning'" :closable="false" style="margin-bottom:16px">
        读取 {{ importResult.total }} 条，有效 {{ importResult.validCount }} 条
        <span v-if="importResult.errorCount" style="color:#f56c6c">，错误 {{ importResult.errorCount }} 条</span>
      </el-alert>
      <el-collapse v-if="importResult?.errors?.length">
        <el-collapse-item title="错误详情">
          <el-table :data="importResult.errors" size="small" max-height="150">
            <el-table-column prop="row" label="行" width="60" />
            <el-table-column prop="field" label="字段" width="100" />
            <el-table-column prop="message" label="错误" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <el-table :data="importPreviewData" size="small" max-height="350" border style="margin-top:12px">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="spec" label="规格型号" width="100" />
        <el-table-column prop="materialType" label="类型" width="80" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="price" label="单价" width="80" />
        <el-table-column prop="supplier" label="供应商" width="100" />
      </el-table>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing" :disabled="!importResult?.validCount">
          确认导入 ({{ importResult?.validCount || 0 }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 打印预览对话框 -->
    <el-dialog v-model="printDialogVisible" title="打印预览" width="800px">
      <div ref="printContentRef" class="print-preview">
        <h2 style="text-align:center;margin-bottom:16px">物料清单</h2>
        <p style="font-size:12px;color:#666;margin-bottom:12px">
          打印时间：{{ new Date().toLocaleString() }} | 共 {{ printData.length }} 条
        </p>
        <table class="print-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>物料编码</th>
              <th>物料名称</th>
              <th>规格型号</th>
              <th>类型</th>
              <th>单位</th>
              <th>单价</th>
              <th>供应商</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in printData" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ row.materialCode }}</td>
              <td>{{ row.materialName }}</td>
              <td>{{ row.spec }}</td>
              <td>{{ row.materialType }}</td>
              <td>{{ row.unit }}</td>
              <td>¥{{ row.price?.toFixed(2) }}</td>
              <td>{{ row.supplier }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <el-button @click="printDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="doPrint">
          <el-icon><Printer /></el-icon> 打印
        </el-button>
      </template>
    </el-dialog>

    <!-- 条码打印对话框 -->
    <el-dialog v-model="barcodeDialogVisible" title="打印条码" width="500px">
      <div class="barcode-preview">
        <div class="barcode-label">
          <div class="barcode-img" ref="barcodeRef">
            <!-- 条码图 -->
            <svg id="barcode-svg"></svg>
          </div>
          <div class="barcode-info">
            <div class="barcode-name">{{ barcodeData.materialName }}</div>
            <div class="barcode-spec">规格：{{ barcodeData.spec }}</div>
            <div class="barcode-code">{{ barcodeData.materialCode }}</div>
          </div>
        </div>
      </div>
      <el-form label-width="80px" style="margin-top:20px">
        <el-form-item label="打印数量">
          <el-input-number v-model="barcodePrintCount" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="条码类型">
          <el-radio-group v-model="barcodeType">
            <el-radio label="CODE128">一维码</el-radio>
            <el-radio label="QR">二维码</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="barcodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doPrintBarcode">
          <el-icon><Printer /></el-icon> 打印
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Download, Upload, Printer, Delete, ArrowDown, ArrowUp, UploadFilled 
} from '@element-plus/icons-vue'

// ========== 常量 ==========
const materialTypes = ['原材料', '半成品', '成品', 'MRO', '备品备件', '工具']
const units = ['个', '件', '套', '箱', 'kg', '米', '卷', '桶', '瓶']

// ========== 状态 ==========
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增物料')
const activeTab = ref('basic')
const showAdvanced = ref(false)
const importDialogVisible = ref(false)
const printDialogVisible = ref(false)
const barcodeDialogVisible = ref(false)
const formRef = ref(null)
const importFileRef = ref(null)
const printContentRef = ref(null)

const allData = ref([])
const tableData = ref([])
const selectedRows = ref([])
const printData = ref([])
const importResult = ref(null)
const importPreviewData = ref([])

const globalKeyword = ref('')
const searchForm = reactive({
  materialCode: '', materialName: '', spec: '', materialType: '', abcClass: '', supplier: '', status: ''
})
const pagination = reactive({ page: 1, size: 20, total: 0 })
const sortInfo = reactive({ field: '', order: '' })

const formData = reactive({
  id: null, materialCode: '', materialName: '', spec: '', materialType: '',
  unit: '', price: 0, abcClass: 'B', safetyStock: 100, maxStock: 1000,
  reorderPoint: 50, leadTime: 7, shelfLife: 365, minOrderQty: 1,
  supplier: '', supplierCode: '', remark: '', attachments: [], currentStock: 0, status: 1
})

const formRules = {
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  materialType: [{ required: true, message: '请选择物料类型', trigger: 'change' }],
  unit: [{ required: true, message: '请选择单位', trigger: 'change' }]
}

// 条码相关
const barcodeData = reactive({ materialCode: '', materialName: '', spec: '' })
const barcodePrintCount = ref(1)
const barcodeType = ref('CODE128')

// 统计数据
const stats = computed(() => {
  const data = allData.value
  return {
    total: data.length,
    active: data.filter(d => d.status === 1).length,
    lowStock: data.filter(d => d.currentStock < d.safetyStock).length,
    newThisMonth: Math.floor(data.length * 0.1)
  }
})

// ========== 辅助函数 ==========
const getTypeTag = (type) => {
  const map = { '原材料': 'primary', '半成品': 'warning', '成品': 'success', 'MRO': 'danger', '备品备件': 'info', '工具': '' }
  return map[type] || 'info'
}
const getAbcType = (abc) => ({ A: 'danger', B: 'warning', C: 'info' }[abc] || 'info')

// 高亮关键词
const highlight = (text) => {
  if (!globalKeyword.value || !text) return text
  const regex = new RegExp(`(${globalKeyword.value})`, 'gi')
  return String(text).replace(regex, '<span style="color:#409eff;font-weight:600">$1</span>')
}

// 模糊匹配
const fuzzyMatch = (text, keyword) => {
  if (!keyword) return true
  if (!text) return false
  return String(text).toLowerCase().includes(String(keyword).toLowerCase())
}

// ========== 搜索逻辑 ==========
const handleSearch = () => {
  loading.value = true
  
  let result = allData.value.filter(item => {
    // 全局搜索
    if (globalKeyword.value) {
      const kw = globalKeyword.value
      const match = fuzzyMatch(item.materialCode, kw) || 
                    fuzzyMatch(item.materialName, kw) || 
                    fuzzyMatch(item.spec, kw) || 
                    fuzzyMatch(item.supplier, kw)
      if (!match) return false
    }
    
    // 高级搜索 - 模糊字段
    if (searchForm.materialCode && !fuzzyMatch(item.materialCode, searchForm.materialCode)) return false
    if (searchForm.materialName && !fuzzyMatch(item.materialName, searchForm.materialName)) return false
    if (searchForm.spec && !fuzzyMatch(item.spec, searchForm.spec)) return false
    if (searchForm.supplier && !fuzzyMatch(item.supplier, searchForm.supplier)) return false
    
    // 高级搜索 - 精确字段
    if (searchForm.materialType && item.materialType !== searchForm.materialType) return false
    if (searchForm.abcClass && item.abcClass !== searchForm.abcClass) return false
    if (searchForm.status !== '' && searchForm.status !== null && item.status !== searchForm.status) return false
    
    return true
  })
  
  // 排序
  if (sortInfo.field && sortInfo.order) {
    result.sort((a, b) => {
      const va = a[sortInfo.field], vb = b[sortInfo.field]
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortInfo.order === 'ascending' ? cmp : -cmp
    })
  }
  
  pagination.total = result.length
  const start = (pagination.page - 1) * pagination.size
  tableData.value = result.slice(start, start + pagination.size)
  
  loading.value = false
}

const handleReset = () => {
  globalKeyword.value = ''
  Object.keys(searchForm).forEach(k => searchForm[k] = '')
  pagination.page = 1
  sortInfo.field = ''
  sortInfo.order = ''
  handleSearch()
}

const handleSortChange = ({ prop, order }) => {
  sortInfo.field = prop
  sortInfo.order = order
  handleSearch()
}

const handleSelectionChange = (rows) => { selectedRows.value = rows }

// ========== CRUD ==========
const resetForm = () => {
  Object.assign(formData, {
    id: null, materialCode: '', materialName: '', spec: '', materialType: '',
    unit: '', price: 0, abcClass: 'B', safetyStock: 100, maxStock: 1000,
    reorderPoint: 50, leadTime: 7, shelfLife: 365, minOrderQty: 1,
    supplier: '', supplierCode: '', remark: '', attachments: [], currentStock: 0, status: 1
  })
}

const handleAdd = () => {
  resetForm()
  activeTab.value = 'basic'
  dialogTitle.value = '新增物料'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, { ...row })
  activeTab.value = 'basic'
  dialogTitle.value = '编辑物料'
  dialogVisible.value = true
}

const handleView = (row) => { handleEdit(row) }

const handleMoreCmd = (cmd, row) => {
  switch(cmd) {
    case 'copy':
      Object.assign(formData, { ...row, id: null, materialCode: row.materialCode + '_COPY' })
      dialogTitle.value = '复制物料'
      dialogVisible.value = true
      break
    case 'attach':
      Object.assign(formData, { ...row })
      activeTab.value = 'attach'
      dialogTitle.value = '管理附件'
      dialogVisible.value = true
      break
    case 'history':
      ElMessage.info('查看变更记录: ' + row.materialCode)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    submitting.value = true
    setTimeout(() => {
      if (formData.id) {
        const idx = allData.value.findIndex(d => d.id === formData.id)
        if (idx > -1) allData.value[idx] = { ...formData }
      } else {
        allData.value.unshift({ ...formData, id: Date.now(), currentStock: Math.floor(Math.random() * 200) })
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      submitting.value = false
      handleSearch()
    }, 400)
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除物料 "${row.materialName}"？`, '确认', { type: 'warning' })
    .then(() => {
      allData.value = allData.value.filter(d => d.id !== row.id)
      ElMessage.success('删除成功')
      handleSearch()
    }).catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条？`, '确认', { type: 'warning' })
    .then(() => {
      const ids = new Set(selectedRows.value.map(r => r.id))
      allData.value = allData.value.filter(d => !ids.has(d.id))
      selectedRows.value = []
      ElMessage.success('删除成功')
      handleSearch()
    }).catch(() => {})
}

const handleStatusChange = (row) => {
  ElMessage.success(`已${row.status ? '启用' : '禁用'}`)
}

// ========== 导入导出 ==========
const handleExport = () => {
  const data = selectedRows.value.length ? selectedRows.value : tableData.value
  if (!data.length) return ElMessage.warning('无数据可导出')
  
  // 简易CSV导出
  const headers = ['物料编码', '物料名称', '规格型号', '类型', '单位', '单价', '当前库存', '安全库存', 'ABC', '供应商']
  const keys = ['materialCode', 'materialName', 'spec', 'materialType', 'unit', 'price', 'currentStock', 'safetyStock', 'abcClass', 'supplier']
  
  const csv = [
    headers.join(','),
    ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `物料数据_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  
  ElMessage.success(`导出 ${data.length} 条成功`)
}

const handleImportCmd = (cmd) => {
  if (cmd === 'template') {
    const headers = ['物料编码*', '物料名称*', '规格型号', '物料类型*', '单位*', '单价', '安全库存', '供应商']
    const example = ['MAT000001', '示例物料', '50×100mm', 'MRO', '个', '25.5', '100', '供应商A']
    const csv = [headers.join(','), example.join(',')].join('\n')
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '物料导入模板.csv'
    link.click()
    ElMessage.success('模板下载成功')
  } else {
    importFileRef.value?.click()
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  e.target.value = ''
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').replace('*', '').trim())
    
    const fieldMap = {
      '物料编码': 'materialCode', '物料名称': 'materialName', '规格型号': 'spec',
      '物料类型': 'materialType', '单位': 'unit', '单价': 'price',
      '安全库存': 'safetyStock', '供应商': 'supplier'
    }
    
    const data = []
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      const row = {}
      headers.forEach((h, idx) => {
        if (fieldMap[h]) row[fieldMap[h]] = values[idx] || ''
      })
      
      // 验证必填
      if (!row.materialCode) errors.push({ row: i + 1, field: '物料编码', message: '不能为空' })
      if (!row.materialName) errors.push({ row: i + 1, field: '物料名称', message: '不能为空' })
      if (!row.materialType) errors.push({ row: i + 1, field: '物料类型', message: '不能为空' })
      if (!row.unit) errors.push({ row: i + 1, field: '单位', message: '不能为空' })
      
      if (row.materialCode && row.materialName && row.materialType && row.unit) {
        row.price = parseFloat(row.price) || 0
        row.safetyStock = parseInt(row.safetyStock) || 100
        data.push(row)
      }
    }
    
    importResult.value = {
      total: lines.length - 1,
      validCount: data.length,
      errorCount: lines.length - 1 - data.length,
      valid: errors.length === 0,
      errors,
      data
    }
    importPreviewData.value = data.slice(0, 50)
    importDialogVisible.value = true
  }
  reader.readAsText(file)
}

const confirmImport = () => {
  importing.value = true
  setTimeout(() => {
    importResult.value.data.forEach((item, idx) => {
      allData.value.unshift({
        ...item,
        id: Date.now() + idx,
        abcClass: 'B',
        maxStock: 1000,
        reorderPoint: 50,
        currentStock: Math.floor(Math.random() * 200),
        status: 1
      })
    })
    ElMessage.success(`导入 ${importResult.value.validCount} 条成功`)
    importDialogVisible.value = false
    importing.value = false
    handleSearch()
  }, 500)
}

// ========== 打印 ==========
const handlePrintList = () => {
  printData.value = selectedRows.value.length ? selectedRows.value : tableData.value
  if (!printData.value.length) return ElMessage.warning('无数据可打印')
  printDialogVisible.value = true
}

const doPrint = () => {
  const content = printContentRef.value.innerHTML
  const win = window.open('', '_blank')
  win.document.write(`
    <html><head><title>打印</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
      .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .print-table th, .print-table td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
      .print-table th { background: #f0f0f0; }
    </style>
    </head><body>${content}</body></html>
  `)
  win.document.close()
  win.print()
}

const handlePrintBarcode = (row) => {
  Object.assign(barcodeData, row)
  barcodePrintCount.value = 1
  barcodeDialogVisible.value = true
  
  nextTick(() => {
    // 简单的条码显示
    const svg = document.getElementById('barcode-svg')
    if (svg) {
      svg.innerHTML = `<text x="10" y="40" font-size="24" font-family="monospace">||||  ${row.materialCode}  ||||</text>`
    }
  })
}

const doPrintBarcode = () => {
  const labels = Array(barcodePrintCount.value).fill(null).map(() => `
    <div style="border:1px dashed #ccc;padding:15px;margin:10px;text-align:center;page-break-after:always;">
      <div style="font-size:28px;font-family:monospace;letter-spacing:4px;margin-bottom:10px;">
        |||| ${barcodeData.materialCode} ||||
      </div>
      <div style="font-weight:bold;font-size:14px">${barcodeData.materialName}</div>
      <div style="font-size:12px;color:#666">规格：${barcodeData.spec || '-'}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:8px">${barcodeData.materialCode}</div>
    </div>
  `).join('')
  
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>条码打印</title></head><body>${labels}</body></html>`)
  win.document.close()
  win.print()
}

// ========== 附件处理 ==========
const handleAttachChange = (file, fileList) => { formData.attachments = fileList }
const handleAttachRemove = (file, fileList) => { formData.attachments = fileList }

// ========== 数据生成 ==========
const generateMockData = (count = 150) => {
  const suppliers = ['华东供应', '北方工业', '南方科技', '西部材料', '中原物资']
  const data = []
  for (let i = 1; i <= count; i++) {
    const safetyStock = Math.floor(Math.random() * 100) + 50
    data.push({
      id: i,
      materialCode: `MAT${String(i).padStart(6, '0')}`,
      materialName: `${materialTypes[i % materialTypes.length]}物料${i}`,
      spec: `${Math.floor(Math.random() * 100) + 10}×${Math.floor(Math.random() * 50) + 5}mm`,
      materialType: materialTypes[i % materialTypes.length],
      unit: units[i % units.length],
      price: Math.floor(Math.random() * 500) + 10,
      abcClass: ['A', 'B', 'C'][i % 3],
      safetyStock,
      maxStock: safetyStock * 5,
      reorderPoint: Math.floor(safetyStock * 0.8),
      currentStock: Math.floor(Math.random() * 300) + 20,
      supplier: suppliers[i % suppliers.length],
      status: Math.random() > 0.1 ? 1 : 0,
      attachments: []
    })
  }
  return data
}

// ========== 初始化 ==========
onMounted(() => {
  allData.value = generateMockData(150)
  handleSearch()
})
</script>

<style scoped>
.material-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; color: white; }
.stat-card.blue { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-card.green { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stat-card.orange { background: linear-gradient(135deg, #e6a23c, #ebb563); }
.stat-card.purple { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.stat-value { font-size: 28px; font-weight: bold; }
.stat-label { font-size: 13px; opacity: 0.9; margin-top: 4px; }

.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px; }
.quick-search { display: flex; align-items: center; gap: 16px; }
.advanced-search { margin-top: 16px; padding-top: 16px; border-top: 1px solid #ebeef5; }

.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.left-btns { display: flex; gap: 10px; flex-wrap: wrap; }
.right-info { margin-left: auto; color: #606266; font-size: 14px; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }

.print-preview { max-height: 500px; overflow: auto; }
.print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.print-table th { background: #f5f7fa; font-weight: 600; }

.barcode-preview { text-align: center; padding: 20px; background: #f5f7fa; border-radius: 8px; }
.barcode-label { display: inline-block; padding: 16px; background: white; border: 1px solid #ddd; border-radius: 4px; }
.barcode-img { margin-bottom: 12px; }
.barcode-name { font-weight: bold; font-size: 16px; }
.barcode-spec { font-size: 12px; color: #666; margin: 4px 0; }
.barcode-code { font-size: 14px; font-weight: bold; margin-top: 8px; }
</style>
