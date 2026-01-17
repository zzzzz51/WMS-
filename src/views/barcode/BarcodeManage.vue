<template>
  <div class="barcode-manage">
    <h2>条码管理</h2>
    
    <!-- 功能说明卡片 -->
    <el-card shadow="never" class="guide-card" v-if="showGuide">
      <template #header>
        <div class="guide-header">
          <span>📋 条码使用工作说明</span>
          <el-button type="primary" link @click="showGuide = false">收起</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :xs="24" :md="8">
          <div class="guide-section">
            <h4>🏷️ 条码内容说明</h4>
            <ul>
              <li><strong>物料名称</strong>：物资的标准名称</li>
              <li><strong>规格型号</strong>：物资的规格参数</li>
              <li><strong>数量</strong>：本批次入库数量</li>
              <li><strong>仓库代码</strong>：所属仓库编码</li>
              <li><strong>储位</strong>：具体存放位置编码</li>
              <li><strong>批次号</strong>：入库批次唯一标识</li>
              <li><strong>条码+二维码</strong>：双码并存，扫描定位</li>
            </ul>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="guide-section">
            <h4>📝 条码生成流程</h4>
            <ol>
              <li>物资入库时自动生成批次号</li>
              <li>批次号格式：<code>BT+年月日+4位流水</code></li>
              <li>条码编码规则：<code>物料编码-批次号</code></li>
              <li>打印标签粘贴于物资包装上</li>
              <li>上架时扫描确认储位</li>
            </ol>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="guide-section">
            <h4>📱 PDA扫码操作</h4>
            <ol>
              <li><strong>入库扫码</strong>：扫描后核对数量入库</li>
              <li><strong>上架扫码</strong>：扫描确认存放储位</li>
              <li><strong>出库扫码</strong>：扫描拣货确认发货</li>
              <li><strong>盘点扫码</strong>：扫描录入实盘数量</li>
              <li><strong>移库扫码</strong>：扫描更新储位信息</li>
            </ol>
          </div>
        </el-col>
      </el-row>
    </el-card>
    <el-button v-else type="info" plain size="small" @click="showGuide = true" style="margin-bottom:16px">
      显示条码使用说明
    </el-button>

    <!-- 搜索 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.materialCode" placeholder="模糊搜索" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.materialName" placeholder="模糊搜索" clearable style="width:120px" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="searchForm.batchNo" placeholder="批次号" clearable style="width:130px" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouseCode" placeholder="全部" clearable style="width:100px">
            <el-option v-for="w in warehouseOptions" :key="w.code" :label="w.name" :value="w.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="储位">
          <el-input v-model="searchForm.location" placeholder="储位" clearable style="width:100px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleGenerate">
        <el-icon><Plus /></el-icon> 单个生成
      </el-button>
      <el-button type="success" @click="handleBatchGenerate">
        <el-icon><DocumentCopy /></el-icon> 批量生成
      </el-button>
      <el-button type="warning" @click="handleBatchPrint" :disabled="!selectedRows.length">
        <el-icon><Printer /></el-icon> 批量打印 ({{ selectedRows.length }})
      </el-button>
      <el-button @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
      <span class="right-info">共 <strong>{{ pagination.total }}</strong> 条</span>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" border stripe @selection-change="rows => selectedRows = rows">
        <el-table-column type="selection" width="45" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="batchNo" label="批次号" width="160">
          <template #default="{row}">
            <el-link type="primary" @click="handlePreview(row)">{{ row.batchNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120" />
        <el-table-column prop="materialName" label="物料名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格型号" width="100" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="80" align="right">
          <template #default="{row}"><span class="text-primary">{{ row.quantity }}</span> {{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="warehouseCode" label="仓库" width="80" align="center">
          <template #default="{row}">
            <el-tag size="small">{{ row.warehouseCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="储位" width="100" />
        <el-table-column prop="inboundDate" label="入库日期" width="100" />
        <el-table-column prop="supplier" label="供应商" width="100" show-overflow-tooltip />
        <el-table-column prop="printCount" label="打印" width="60" align="center">
          <template #default="{row}">
            <el-tag :type="row.printCount > 0 ? 'success' : 'info'" size="small">{{ row.printCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click="handlePreview(row)">预览</el-button>
            <el-button type="success" link size="small" @click="handlePrint(row)">打印</el-button>
            <el-button type="info" link size="small" @click="handleDownload(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
          :total="pagination.total" layout="total, sizes, prev, pager, next" :page-sizes="[20,50,100]"
          background @current-change="handleSearch" @size-change="handleSearch" />
      </div>
    </el-card>

    <!-- 条码预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" title="条码标签预览" width="480px">
      <div class="barcode-preview-container">
        <div class="barcode-label-v2" ref="barcodeRef">
          <!-- 标签头部 -->
          <div class="label-header-v2">
            <div class="company-logo">2026赖杰WMS</div>
            <div class="label-date-v2">{{ currentRow?.inboundDate }}</div>
          </div>
          
          <!-- 信息区域 -->
          <div class="label-body-v2">
            <div class="info-row">
              <span class="info-label">物料名称</span>
              <span class="info-value">{{ currentRow?.materialName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">规格型号</span>
              <span class="info-value">{{ currentRow?.spec }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">数　　量</span>
              <span class="info-value highlight">{{ currentRow?.quantity }} {{ currentRow?.unit }}</span>
            </div>
            <div class="info-row-inline">
              <div class="info-col">
                <span class="info-label">仓库</span>
                <span class="info-value highlight">{{ currentRow?.warehouseCode }}</span>
              </div>
              <div class="info-col">
                <span class="info-label">储位</span>
                <span class="info-value highlight">{{ currentRow?.location }}</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">批 次 号</span>
              <span class="info-value mono">{{ currentRow?.batchNo }}</span>
            </div>
          </div>
          
          <!-- 条码+二维码区域 -->
          <div class="code-area-v2">
            <div class="barcode-section">
              <svg ref="barcodeSvg"></svg>
              <div class="barcode-number">{{ currentRow?.barcodeValue }}</div>
            </div>
            <div class="qrcode-section">
              <canvas ref="qrcodeCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint(currentRow)">打印</el-button>
        <el-button type="success" @click="handleDownload(currentRow)">下载PNG</el-button>
      </template>
    </el-dialog>

    <!-- 单个生成条码弹窗 -->
    <el-dialog v-model="generateDialogVisible" title="生成入库条码" width="650px">
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料编码" prop="materialCode">
              <el-input v-model="generateForm.materialCode" placeholder="物料编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="materialName">
              <el-input v-model="generateForm.materialName" placeholder="物料名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="spec">
              <el-input v-model="generateForm.spec" placeholder="规格型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-select v-model="generateForm.unit" style="width:100%">
                <el-option v-for="u in ['个','件','台','套','kg','米','箱']" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库数量" prop="quantity">
              <el-input-number v-model="generateForm.quantity" :min="1" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库" prop="warehouseCode">
              <el-select v-model="generateForm.warehouseCode" placeholder="选择仓库" style="width:100%">
                <el-option v-for="w in warehouseOptions" :key="w.code" :label="`${w.code} - ${w.name}`" :value="w.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="储位" prop="location">
              <el-input v-model="generateForm.location" placeholder="如 A1-01-01" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="generateForm.supplier" placeholder="供应商名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库日期">
              <el-date-picker v-model="generateForm.inboundDate" type="date" style="width:100%" 
                value-format="YYYY-MM-DD" :default-value="new Date()" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号">
              <el-input v-model="generateForm.batchNo" disabled>
                <template #append>
                  <el-button @click="refreshBatchNo">刷新</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="form-tip">批次号自动生成，格式：BT + 年月日 + 4位流水号</div>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate">生成条码</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成条码弹窗 -->
    <el-dialog v-model="batchGenerateDialogVisible" title="批量生成条码" width="950px" top="5vh">
      <div class="batch-generate-content">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          <template #title>
            <span>批量生成说明：每行填写一个物料信息，批次号将自动生成。</span>
          </template>
        </el-alert>
        
        <div class="batch-toolbar">
          <el-button type="primary" size="small" @click="addBatchRow">
            <el-icon><Plus /></el-icon> 添加行
          </el-button>
          <el-button size="small" @click="addMultipleRows">
            <el-icon><DocumentAdd /></el-icon> 批量添加 (10行)
          </el-button>
          <el-button type="danger" size="small" @click="clearBatchRows" :disabled="!batchList.length">
            <el-icon><Delete /></el-icon> 清空
          </el-button>
          <el-divider direction="vertical" />
          <el-button size="small" @click="downloadTemplate">
            <el-icon><Download /></el-icon> 下载模板
          </el-button>
        </div>

        <el-table :data="batchList" border size="small" max-height="400" class="batch-table">
          <el-table-column type="index" label="#" width="45" fixed />
          <el-table-column label="物料编码" width="120">
            <template #default="{ row }">
              <el-input v-model="row.materialCode" size="small" placeholder="必填" />
            </template>
          </el-table-column>
          <el-table-column label="物料名称" width="130">
            <template #default="{ row }">
              <el-input v-model="row.materialName" size="small" placeholder="必填" />
            </template>
          </el-table-column>
          <el-table-column label="规格型号" width="100">
            <template #default="{ row }">
              <el-input v-model="row.spec" size="small" placeholder="必填" />
            </template>
          </el-table-column>
          <el-table-column label="数量" width="80">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" size="small" :min="1" controls-position="right" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="70">
            <template #default="{ row }">
              <el-select v-model="row.unit" size="small" style="width: 100%">
                <el-option v-for="u in ['个','件','台','套','kg','米','箱']" :key="u" :label="u" :value="u" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="仓库" width="90">
            <template #default="{ row }">
              <el-select v-model="row.warehouseCode" size="small" placeholder="选择" style="width: 100%">
                <el-option v-for="w in warehouseOptions" :key="w.code" :label="w.code" :value="w.code" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="储位" width="100">
            <template #default="{ row }">
              <el-input v-model="row.location" size="small" placeholder="必填" />
            </template>
          </el-table-column>
          <el-table-column label="供应商" width="100">
            <template #default="{ row }">
              <el-input v-model="row.supplier" size="small" placeholder="选填" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" width="140">
            <template #default="{ row }">
              <el-input v-model="row.batchNo" size="small" disabled />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="50" fixed="right" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeBatchRow($index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="batch-summary">
          <span>共 <strong>{{ batchList.length }}</strong> 条记录</span>
          <span>有效记录: <strong class="text-success">{{ validBatchCount }}</strong> 条</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchGenerateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchGenerate" :disabled="!validBatchCount">
          生成 {{ validBatchCount }} 个条码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, DocumentCopy, Printer, Download, Upload, Delete, DocumentAdd } from '@element-plus/icons-vue'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

const showGuide = ref(true)
const previewDialogVisible = ref(false)
const generateDialogVisible = ref(false)
const batchGenerateDialogVisible = ref(false)
const currentRow = ref(null)
const selectedRows = ref([])
const barcodeSvg = ref(null)
const qrcodeCanvas = ref(null)
const generateFormRef = ref(null)

const warehouseOptions = ref([
  { code: 'WH01', name: '主仓库' },
  { code: 'WH02', name: '原料仓' },
  { code: 'WH03', name: '成品仓' },
  { code: 'WH04', name: '备件仓' }
])

const allData = ref([])
const tableData = ref([])
const searchForm = reactive({ materialCode: '', materialName: '', batchNo: '', warehouseCode: '', location: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const batchList = ref([])
const validBatchCount = computed(() => {
  return batchList.value.filter(item => 
    item.materialCode && item.materialName && item.spec && item.quantity && item.warehouseCode && item.location
  ).length
})

const generateForm = reactive({
  materialCode: '', materialName: '', spec: '', unit: '个',
  quantity: 1, warehouseCode: '', location: '', supplier: '', inboundDate: '', batchNo: ''
})
const generateRules = {
  materialCode: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  spec: [{ required: true, message: '请输入规格型号', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  warehouseCode: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  location: [{ required: true, message: '请输入储位', trigger: 'blur' }]
}

const fuzzyMatch = (text, kw) => !kw || String(text || '').toLowerCase().includes(kw.toLowerCase())

const handleSearch = () => {
  let result = allData.value.filter(item => {
    if (!fuzzyMatch(item.materialCode, searchForm.materialCode)) return false
    if (!fuzzyMatch(item.materialName, searchForm.materialName)) return false
    if (!fuzzyMatch(item.batchNo, searchForm.batchNo)) return false
    if (searchForm.warehouseCode && item.warehouseCode !== searchForm.warehouseCode) return false
    if (!fuzzyMatch(item.location, searchForm.location)) return false
    return true
  })
  pagination.total = result.length
  tableData.value = result.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size)
}

const handleReset = () => { Object.keys(searchForm).forEach(k => searchForm[k] = ''); pagination.page = 1; handleSearch() }

const generateBatchNo = (seq = null) => {
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const seqNum = seq !== null ? String(seq).padStart(4, '0') : String(Math.floor(Math.random() * 9000) + 1000)
  return `BT${dateStr}${seqNum}`
}

const refreshBatchNo = () => { generateForm.batchNo = generateBatchNo() }

const generateQRCode = async (canvas, data) => {
  if (!canvas) return
  try {
    await QRCode.toCanvas(canvas, data, { width: 80, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
  } catch (err) { console.error('QRCode error:', err) }
}

const handleGenerate = () => {
  Object.assign(generateForm, {
    materialCode: '', materialName: '', spec: '', unit: '个',
    quantity: 1, warehouseCode: 'WH01', location: '', supplier: '',
    inboundDate: new Date().toISOString().slice(0, 10),
    batchNo: generateBatchNo()
  })
  generateDialogVisible.value = true
}

const submitGenerate = async () => {
  await generateFormRef.value?.validate(valid => {
    if (!valid) return
    const barcodeValue = `${generateForm.materialCode}-${generateForm.batchNo}`
    allData.value.unshift({ id: Date.now(), ...generateForm, barcodeValue, printCount: 0 })
    ElMessage.success('条码生成成功')
    generateDialogVisible.value = false
    handleSearch()
  })
}

const handleBatchGenerate = () => { batchList.value = []; addMultipleRows(5); batchGenerateDialogVisible.value = true }

const createEmptyRow = (seq) => ({
  materialCode: '', materialName: '', spec: '', quantity: 1, unit: '个',
  warehouseCode: 'WH01', location: '', supplier: '',
  inboundDate: new Date().toISOString().slice(0, 10), batchNo: generateBatchNo(seq)
})

const addBatchRow = () => { batchList.value.push(createEmptyRow(allData.value.length + batchList.value.length + 1)) }
const addMultipleRows = (count = 10) => {
  const startSeq = allData.value.length + batchList.value.length + 1
  for (let i = 0; i < count; i++) batchList.value.push(createEmptyRow(startSeq + i))
}
const removeBatchRow = (index) => { batchList.value.splice(index, 1) }
const clearBatchRows = () => { ElMessageBox.confirm('确定要清空所有数据吗？', '提示', { type: 'warning' }).then(() => { batchList.value = [] }).catch(() => {}) }

const submitBatchGenerate = () => {
  const validItems = batchList.value.filter(item => item.materialCode && item.materialName && item.spec && item.quantity && item.warehouseCode && item.location)
  if (!validItems.length) { ElMessage.warning('请至少填写一条完整的物料信息'); return }
  validItems.forEach(item => {
    const barcodeValue = `${item.materialCode}-${item.batchNo}`
    allData.value.unshift({ id: Date.now() + Math.random(), ...item, barcodeValue, printCount: 0 })
  })
  ElMessage.success(`成功生成 ${validItems.length} 个条码`)
  batchGenerateDialogVisible.value = false
  handleSearch()
}

const downloadTemplate = () => {
  const csv = ['物料编码,物料名称,规格型号,数量,单位,仓库代码,储位,供应商', 'MAT000001,示例物料1,DN50,100,个,WH01,A1-01-01,供应商A'].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '条码批量生成模板.csv'
  link.click()
  ElMessage.success('模板下载成功')
}

const handlePreview = (row) => {
  currentRow.value = row
  previewDialogVisible.value = true
  nextTick(() => {
    if (barcodeSvg.value) JsBarcode(barcodeSvg.value, row.barcodeValue, { format: 'CODE128', width: 1.5, height: 40, displayValue: false, margin: 0 })
    if (qrcodeCanvas.value) generateQRCode(qrcodeCanvas.value, row.barcodeValue)
  })
}

watch(previewDialogVisible, (val) => {
  if (val && currentRow.value) {
    nextTick(() => {
      if (barcodeSvg.value) JsBarcode(barcodeSvg.value, currentRow.value.barcodeValue, { format: 'CODE128', width: 1.5, height: 40, displayValue: false, margin: 0 })
      if (qrcodeCanvas.value) generateQRCode(qrcodeCanvas.value, currentRow.value.barcodeValue)
    })
  }
})

const handlePrint = (row) => {
  row.printCount++
  const printContent = `
    <html>
    <head>
      <title>条码标签</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 8px; }
        .label { width: 75mm; border: 2px solid #333; border-radius: 4px; overflow: hidden; background: #fff; }
        .label-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; }
        .company-logo { font-weight: bold; font-size: 13px; letter-spacing: 1px; }
        .label-date { font-size: 11px; opacity: 0.9; }
        .label-body { padding: 8px 10px; }
        .info-row { display: flex; align-items: baseline; padding: 4px 0; border-bottom: 1px dashed #e0e0e0; }
        .info-row:last-child { border-bottom: none; }
        .info-row-inline { display: flex; padding: 4px 0; border-bottom: 1px dashed #e0e0e0; }
        .info-col { flex: 1; display: flex; align-items: baseline; }
        .info-label { font-size: 11px; color: #666; min-width: 55px; }
        .info-value { font-size: 12px; font-weight: 600; color: #333; flex: 1; }
        .info-value.highlight { color: #e6a23c; font-size: 14px; }
        .info-value.mono { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.5px; }
        .code-area { display: flex; padding: 8px 10px 10px; background: #fafafa; border-top: 1px solid #e0e0e0; gap: 10px; }
        .barcode-section { flex: 1; text-align: center; }
        .barcode-section svg { display: block; margin: 0 auto; max-width: 100%; }
        .barcode-number { font-family: 'Courier New', monospace; font-size: 9px; color: #333; margin-top: 2px; letter-spacing: 0.5px; }
        .qrcode-section { display: flex; align-items: center; justify-content: center; }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="label-header">
          <span class="company-logo">2026赖杰WMS</span>
          <span class="label-date">${row.inboundDate}</span>
        </div>
        <div class="label-body">
          <div class="info-row"><span class="info-label">物料名称</span><span class="info-value">${row.materialName}</span></div>
          <div class="info-row"><span class="info-label">规格型号</span><span class="info-value">${row.spec}</span></div>
          <div class="info-row"><span class="info-label">数　　量</span><span class="info-value highlight">${row.quantity} ${row.unit}</span></div>
          <div class="info-row-inline">
            <div class="info-col"><span class="info-label">仓库</span><span class="info-value highlight">${row.warehouseCode}</span></div>
            <div class="info-col"><span class="info-label">储位</span><span class="info-value highlight">${row.location}</span></div>
          </div>
          <div class="info-row"><span class="info-label">批 次 号</span><span class="info-value mono">${row.batchNo}</span></div>
        </div>
        <div class="code-area">
          <div class="barcode-section"><svg id="barcode"></svg><div class="barcode-number">${row.barcodeValue}</div></div>
          <div class="qrcode-section"><canvas id="qrcode"></canvas></div>
        </div>
      </div>
      <script>
        JsBarcode("#barcode", "${row.barcodeValue}", { format: "CODE128", width: 1.5, height: 40, displayValue: false, margin: 0 });
        QRCode.toCanvas(document.getElementById('qrcode'), "${row.barcodeValue}", { width: 70, margin: 1 });
        window.onload = function() { setTimeout(function() { window.print(); }, 300); };
      <\/script>
    </body>
    </html>
  `
  const win = window.open('', '_blank')
  win.document.write(printContent)
  win.document.close()
  ElMessage.success('打印任务已发送')
}

const handleBatchPrint = () => { selectedRows.value.forEach(row => { row.printCount++ }); ElMessage.success(`已发送 ${selectedRows.value.length} 个打印任务`) }
const handleDownload = (row) => { ElMessage.success('条码图片下载中...') }

const handleExport = () => {
  const csv = [['批次号', '物料编码', '物料名称', '规格型号', '数量', '单位', '仓库代码', '储位', '入库日期', '供应商', '条码'].join(','),
    ...tableData.value.map(r => [r.batchNo, r.materialCode, r.materialName, r.spec, r.quantity, r.unit, r.warehouseCode, r.location, r.inboundDate, r.supplier, r.barcodeValue].join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `条码清单_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  ElMessage.success('导出成功')
}

onMounted(() => {
  const specs = ['DN50', 'M10×30', '6205-2RS', 'Φ20×100', '5W-30']
  const units = ['个', '件', '台', 'kg', '米']
  const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D']
  const warehouses = ['WH01', 'WH02', 'WH03', 'WH04']
  
  allData.value = Array(60).fill(null).map((_, i) => {
    const materialCode = `MAT${String(i + 1).padStart(6, '0')}`
    const batchNo = `BT2025010${String((i % 9) + 1)}${String(1000 + i).slice(-4)}`
    return {
      id: i + 1, batchNo, materialCode,
      materialName: `物料名称${i + 1}`, spec: specs[i % 5],
      quantity: Math.floor(Math.random() * 100) + 10, unit: units[i % 5],
      warehouseCode: warehouses[i % 4],
      location: `${String.fromCharCode(65 + (i % 5))}${Math.floor(i / 5) + 1}-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 20) + 1).padStart(2, '0')}`,
      inboundDate: `2025-01-${String((i % 9) + 1).padStart(2, '0')}`,
      supplier: suppliers[i % 4],
      barcodeValue: `${materialCode}-${batchNo}`,
      printCount: i % 3
    }
  })
  handleSearch()
})
</script>

<style scoped>
.barcode-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.guide-card { margin-bottom: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); }
.guide-header { display: flex; justify-content: space-between; align-items: center; }
.guide-section { padding: 12px; }
.guide-section h4 { margin: 0 0 12px; color: #303133; font-size: 15px; }
.guide-section ul, .guide-section ol { margin: 0; padding-left: 20px; }
.guide-section li { margin: 8px 0; color: #606266; font-size: 13px; line-height: 1.6; }
.guide-section code { background: #e8f4ff; padding: 2px 6px; border-radius: 3px; font-size: 12px; color: #409eff; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding: 16px 16px 0; }
.action-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.right-info { margin-left: auto; color: #606266; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-primary { color: #409eff; font-weight: 600; }
.text-success { color: #67c23a; }

.barcode-preview-container { display: flex; justify-content: center; padding: 20px; background: #f0f0f0; border-radius: 8px; }
.barcode-label-v2 { width: 320px; background: #fff; border: 2px solid #333; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.label-header-v2 { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; }
.company-logo { font-weight: bold; font-size: 14px; letter-spacing: 1px; }
.label-date-v2 { font-size: 12px; opacity: 0.9; }
.label-body-v2 { padding: 10px 12px; }
.info-row { display: flex; align-items: baseline; padding: 6px 0; border-bottom: 1px dashed #e8e8e8; }
.info-row:last-child { border-bottom: none; }
.info-row-inline { display: flex; padding: 6px 0; border-bottom: 1px dashed #e8e8e8; }
.info-col { flex: 1; display: flex; align-items: baseline; }
.info-label { font-size: 12px; color: #909399; min-width: 60px; }
.info-value { font-size: 13px; font-weight: 600; color: #303133; flex: 1; }
.info-value.highlight { color: #e6a23c; font-size: 15px; }
.info-value.mono { font-family: 'Courier New', Consolas, monospace; font-size: 13px; letter-spacing: 0.5px; }
.code-area-v2 { display: flex; padding: 10px 12px 12px; background: #fafafa; border-top: 1px solid #e8e8e8; gap: 12px; }
.barcode-section { flex: 1; text-align: center; }
.barcode-section svg { display: block; margin: 0 auto; }
.barcode-number { font-family: 'Courier New', Consolas, monospace; font-size: 10px; color: #333; margin-top: 4px; letter-spacing: 0.5px; }
.qrcode-section { display: flex; align-items: center; justify-content: center; }
.qrcode-section canvas { display: block; }
.batch-generate-content { max-height: 70vh; overflow-y: auto; }
.batch-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.batch-table { margin-bottom: 16px; }
.batch-table :deep(.el-input__inner) { padding: 0 8px; }
.batch-summary { display: flex; gap: 20px; padding: 12px; background: #f5f7fa; border-radius: 4px; font-size: 14px; color: #606266; }
.form-tip { font-size: 12px; color: #909399; margin-top: 8px; text-align: center; }
</style>
