<template>
  <!-- 导入导出按钮组 -->
  <div class="import-export-btns">
    <!-- 导出按钮 -->
    <el-button type="success" @click="handleExport" :loading="exporting">
      <el-icon><Download /></el-icon> 导出Excel
    </el-button>
    
    <!-- 导入按钮 -->
    <el-dropdown trigger="click" @command="handleImportCommand">
      <el-button type="primary">
        <el-icon><Upload /></el-icon> 导入
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="template">
            <el-icon><Document /></el-icon> 下载导入模板
          </el-dropdown-item>
          <el-dropdown-item command="import" divided>
            <el-icon><Upload /></el-icon> 导入Excel
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    
    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept=".xls,.xlsx,.csv" 
      style="display:none" @change="handleFileSelected" />
  </div>

  <!-- 导入预览对话框 -->
  <el-dialog v-model="importDialogVisible" title="导入预览" width="900px" :close-on-click-modal="false">
    <el-alert v-if="importResult" :type="importResult.valid ? 'success' : 'warning'" :closable="false" style="margin-bottom: 16px;">
      <template #title>
        共读取 {{ importResult.totalCount }} 条数据，
        有效 {{ importResult.validCount }} 条，
        <span v-if="importResult.errorCount > 0" style="color: #f56c6c;">
          错误 {{ importResult.errorCount }} 条
        </span>
      </template>
    </el-alert>
    
    <!-- 错误列表 -->
    <el-collapse v-if="importResult?.errors.length > 0" style="margin-bottom: 16px;">
      <el-collapse-item title="查看错误详情" name="errors">
        <el-table :data="importResult.errors" size="small" max-height="200">
          <el-table-column prop="row" label="行号" width="80" />
          <el-table-column prop="field" label="字段" width="120" />
          <el-table-column prop="message" label="错误信息" />
        </el-table>
      </el-collapse-item>
    </el-collapse>
    
    <!-- 预览表格 -->
    <el-table :data="previewData" size="small" max-height="400" border stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" />
    </el-table>
    
    <template #footer>
      <el-button @click="importDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmImport" :disabled="!importResult?.valid" :loading="importing">
        确认导入 ({{ importResult?.validCount || 0 }} 条)
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload, ArrowDown, Document } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  // 列配置 [{label, prop, width, required, example}]
  columns: { type: Array, required: true },
  // 导出数据
  data: { type: Array, default: () => [] },
  // 文件名
  fileName: { type: String, default: '数据' },
  // 字段映射 {'Excel列名': '系统字段名'} - 可选，不传则使用columns的label作为Excel列名
  fieldMap: { type: Object, default: null },
  // 验证规则
  validateRules: { type: Array, default: () => [] }
})

const emit = defineEmits(['import', 'export'])

const fileInputRef = ref(null)
const importDialogVisible = ref(false)
const exporting = ref(false)
const importing = ref(false)
const importResult = ref(null)
const previewData = ref([])
const rawImportData = ref([])

// ========== 导出功能 ==========
const handleExport = () => {
  if (!props.data || props.data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  exporting.value = true
  
  try {
    const headers = props.columns.map(col => col.label)
    const keys = props.columns.map(col => col.prop)
    
    const rows = props.data.map(item => {
      return keys.map(key => {
        let value = item[key]
        if (key.includes('.')) {
          value = key.split('.').reduce((obj, k) => obj?.[k], item)
        }
        return value ?? ''
      })
    })

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = props.columns.map(col => ({ wch: col.width ? col.width / 8 : 15 }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${props.fileName}_${timestamp}.xlsx`)
    
    ElMessage.success('导出成功')
    emit('export', props.data)
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// ========== 导入功能 ==========
const handleImportCommand = (command) => {
  if (command === 'template') {
    downloadTemplate()
  } else if (command === 'import') {
    fileInputRef.value?.click()
  }
}

// 下载模板
const downloadTemplate = () => {
  const headers = props.columns.map(col => col.required ? `${col.label}*` : col.label)
  const examples = props.columns.map(col => col.example || '')
  
  const ws = XLSX.utils.aoa_to_sheet([headers, examples])
  ws['!cols'] = props.columns.map(col => ({ wch: 20 }))
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  
  XLSX.writeFile(wb, `${props.fileName}_导入模板.xlsx`)
  ElMessage.success('模板下载成功')
}

// 选择文件
const handleFileSelected = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // 重置input以便再次选择同一文件
  e.target.value = ''
  
  try {
    const data = await readExcelFile(file)
    rawImportData.value = data
    
    // 验证数据
    importResult.value = validateData(data)
    previewData.value = importResult.value.data.slice(0, 100) // 最多预览100条
    
    importDialogVisible.value = true
  } catch (err) {
    console.error('读取文件失败:', err)
    ElMessage.error('读取文件失败，请检查文件格式')
  }
}

// 读取Excel文件
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        
        // 获取表头（去除*号）
        const headers = jsonData[0].map(h => String(h).replace('*', '').trim())
        
        // 构建字段映射
        const fieldMapping = props.fieldMap || {}
        if (!props.fieldMap) {
          props.columns.forEach(col => {
            fieldMapping[col.label] = col.prop
          })
        }
        
        // 转换数据
        const result = jsonData.slice(1).map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            const field = fieldMapping[header] || header
            obj[field] = row[index]
          })
          return obj
        }).filter(row => Object.values(row).some(v => v !== ''))
        
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 验证数据
const validateData = (data) => {
  const errors = []
  const validData = []
  
  // 构建验证规则
  const rules = props.validateRules.length > 0 
    ? props.validateRules 
    : props.columns.filter(col => col.required).map(col => ({
        field: col.prop,
        label: col.label,
        required: true
      }))
  
  data.forEach((row, rowIndex) => {
    let rowValid = true
    
    rules.forEach(rule => {
      const value = row[rule.field]
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: '不能为空' })
        rowValid = false
      }
      
      if (value && rule.type === 'number' && isNaN(Number(value))) {
        errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: '必须是数字' })
        rowValid = false
      }
      
      if (value && rule.validator) {
        const result = rule.validator(value, row)
        if (result !== true) {
          errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: result })
          rowValid = false
        }
      }
    })
    
    if (rowValid) validData.push(row)
  })
  
  return {
    valid: errors.length === 0,
    errors,
    data: validData,
    totalCount: data.length,
    validCount: validData.length,
    errorCount: data.length - validData.length
  }
}

// 确认导入
const confirmImport = () => {
  importing.value = true
  
  setTimeout(() => {
    emit('import', importResult.value.data)
    ElMessage.success(`成功导入 ${importResult.value.validCount} 条数据`)
    importDialogVisible.value = false
    importing.value = false
  }, 500)
}
</script>

<style scoped>
.import-export-btns {
  display: inline-flex;
  gap: 12px;
}
</style>
