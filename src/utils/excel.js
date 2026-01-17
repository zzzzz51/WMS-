/**
 * Excel导入导出工具类
 * 依赖：xlsx 库
 * 安装：npm install xlsx
 */

import * as XLSX from 'xlsx'

/**
 * 导出数据到Excel
 * @param {Object} options 配置项
 * @param {Array} options.data - 数据数组
 * @param {Array} options.columns - 列配置 [{label: '显示名', prop: '字段名', width: 20}]
 * @param {string} options.fileName - 文件名（不含扩展名）
 * @param {string} options.sheetName - 工作表名
 */
export function exportExcel({ data, columns, fileName = '导出数据', sheetName = 'Sheet1' }) {
  if (!data || data.length === 0) {
    console.warn('没有数据可导出')
    return
  }

  // 转换数据格式
  const headers = columns.map(col => col.label)
  const keys = columns.map(col => col.prop)
  
  const rows = data.map(item => {
    return keys.map(key => {
      let value = item[key]
      // 处理嵌套属性 如 'user.name'
      if (key.includes('.')) {
        value = key.split('.').reduce((obj, k) => obj?.[k], item)
      }
      return value ?? ''
    })
  })

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  
  // 设置列宽
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }))

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // 导出文件
  const timestamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `${fileName}_${timestamp}.xlsx`)
}

/**
 * 导出多个Sheet到Excel
 * @param {Object} options 配置项
 * @param {Array} options.sheets - [{name: 'Sheet1', data: [], columns: []}]
 * @param {string} options.fileName - 文件名
 */
export function exportMultiSheetExcel({ sheets, fileName = '导出数据' }) {
  const wb = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    const headers = sheet.columns.map(col => col.label)
    const keys = sheet.columns.map(col => col.prop)
    
    const rows = sheet.data.map(item => keys.map(key => item[key] ?? ''))
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!cols'] = sheet.columns.map(col => ({ wch: col.width || 15 }))
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  const timestamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `${fileName}_${timestamp}.xlsx`)
}

/**
 * 读取Excel文件
 * @param {File} file - 文件对象
 * @param {Object} options - 配置项
 * @param {number} options.headerRow - 表头行号（从0开始）
 * @param {number} options.sheetIndex - 工作表索引
 * @returns {Promise<Array>} 数据数组
 */
export function readExcel(file, options = {}) {
  const { headerRow = 0, sheetIndex = 0 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // 获取工作表
        const sheetName = workbook.SheetNames[sheetIndex]
        const worksheet = workbook.Sheets[sheetName]
        
        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,  // 使用数组格式
          defval: ''  // 默认空值
        })
        
        // 获取表头
        const headers = jsonData[headerRow]
        
        // 转换为对象数组
        const result = jsonData.slice(headerRow + 1).map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index]
          })
          return obj
        }).filter(row => Object.values(row).some(v => v !== '')) // 过滤空行
        
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 读取Excel并映射字段
 * @param {File} file - 文件对象
 * @param {Object} fieldMap - 字段映射 {'Excel列名': '系统字段名'}
 * @returns {Promise<Array>} 映射后的数据数组
 */
export async function readExcelWithMapping(file, fieldMap) {
  const rawData = await readExcel(file)
  
  return rawData.map(row => {
    const mapped = {}
    Object.entries(fieldMap).forEach(([excelField, systemField]) => {
      mapped[systemField] = row[excelField]
    })
    return mapped
  })
}

/**
 * 下载Excel导入模板
 * @param {Array} columns - 列配置 [{label: '列名', prop: '字段', required: true, example: '示例'}]
 * @param {string} fileName - 文件名
 */
export function downloadTemplate(columns, fileName = '导入模板') {
  const headers = columns.map(col => col.required ? `${col.label}*` : col.label)
  const examples = columns.map(col => col.example || '')
  
  const ws = XLSX.utils.aoa_to_sheet([headers, examples])
  ws['!cols'] = columns.map(col => ({ wch: col.width || 20 }))
  
  // 添加说明行
  const noteRow = columns.map(() => '')
  noteRow[0] = '说明：带*的列为必填项'
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '导入模板')
  
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

/**
 * 验证导入数据
 * @param {Array} data - 数据数组
 * @param {Array} rules - 验证规则 [{field: '字段', required: true, type: 'string', validator: fn}]
 * @returns {Object} {valid: boolean, errors: [{row, field, message}], data: 有效数据}
 */
export function validateImportData(data, rules) {
  const errors = []
  const validData = []
  
  data.forEach((row, rowIndex) => {
    let rowValid = true
    
    rules.forEach(rule => {
      const value = row[rule.field]
      
      // 必填检查
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: '不能为空' })
        rowValid = false
        return
      }
      
      // 类型检查
      if (value && rule.type) {
        if (rule.type === 'number' && isNaN(Number(value))) {
          errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: '必须是数字' })
          rowValid = false
        }
        if (rule.type === 'date' && isNaN(Date.parse(value))) {
          errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: '日期格式不正确' })
          rowValid = false
        }
      }
      
      // 自定义验证
      if (value && rule.validator) {
        const result = rule.validator(value, row)
        if (result !== true) {
          errors.push({ row: rowIndex + 2, field: rule.label || rule.field, message: result })
          rowValid = false
        }
      }
    })
    
    if (rowValid) {
      validData.push(row)
    }
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

export default {
  exportExcel,
  exportMultiSheetExcel,
  readExcel,
  readExcelWithMapping,
  downloadTemplate,
  validateImportData
}
