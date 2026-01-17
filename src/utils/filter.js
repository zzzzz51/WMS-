/**
 * 前端搜索过滤工具
 * 用于在模拟数据模式下实现搜索功能
 */

/**
 * 通用过滤函数
 * @param {Array} data - 数据数组
 * @param {Object} filters - 过滤条件 { field: value }
 * @param {Object} options - 配置项
 * @returns {Array} 过滤后的数据
 */
export function filterData(data, filters, options = {}) {
  const { 
    fuzzyFields = [],  // 模糊匹配字段
    exactFields = [],  // 精确匹配字段
    rangeFields = {},  // 范围匹配字段 { field: { min, max } }
    dateFields = {}    // 日期范围字段 { field: [start, end] }
  } = options

  return data.filter(item => {
    for (const [field, value] of Object.entries(filters)) {
      // 空值跳过
      if (value === '' || value === null || value === undefined) continue
      if (Array.isArray(value) && value.length === 0) continue

      // 模糊匹配
      if (fuzzyFields.includes(field)) {
        const itemValue = String(item[field] || '').toLowerCase()
        const searchValue = String(value).toLowerCase()
        if (!itemValue.includes(searchValue)) return false
        continue
      }

      // 精确匹配
      if (exactFields.includes(field)) {
        if (item[field] !== value) return false
        continue
      }

      // 范围匹配
      if (rangeFields[field]) {
        const { min, max } = rangeFields[field]
        const itemValue = Number(item[field])
        if (min !== undefined && itemValue < min) return false
        if (max !== undefined && itemValue > max) return false
        continue
      }

      // 日期范围匹配
      if (dateFields[field]) {
        const [start, end] = value
        const itemDate = new Date(item[field])
        if (start && itemDate < new Date(start)) return false
        if (end && itemDate > new Date(end)) return false
        continue
      }

      // 默认：模糊匹配
      const itemValue = String(item[field] || '').toLowerCase()
      const searchValue = String(value).toLowerCase()
      if (!itemValue.includes(searchValue)) return false
    }
    return true
  })
}

/**
 * 分页函数
 * @param {Array} data - 数据数组
 * @param {number} page - 当前页码（从1开始）
 * @param {number} pageSize - 每页数量
 * @returns {Object} { list, total, page, pageSize }
 */
export function paginate(data, page = 1, pageSize = 20) {
  const total = data.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = data.slice(start, end)
  
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 排序函数
 * @param {Array} data - 数据数组
 * @param {string} field - 排序字段
 * @param {string} order - 排序方向 'asc' | 'desc'
 * @returns {Array} 排序后的数据
 */
export function sortData(data, field, order = 'asc') {
  return [...data].sort((a, b) => {
    let valueA = a[field]
    let valueB = b[field]
    
    // 处理日期
    if (valueA instanceof Date || !isNaN(Date.parse(valueA))) {
      valueA = new Date(valueA).getTime()
      valueB = new Date(valueB).getTime()
    }
    // 处理数字
    else if (!isNaN(Number(valueA))) {
      valueA = Number(valueA)
      valueB = Number(valueB)
    }
    // 处理字符串
    else {
      valueA = String(valueA || '').toLowerCase()
      valueB = String(valueB || '').toLowerCase()
    }
    
    if (order === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
    }
  })
}

/**
 * 组合查询（过滤+排序+分页）
 * @param {Array} data - 原始数据
 * @param {Object} query - 查询条件
 * @returns {Object} 查询结果
 */
export function queryData(data, query = {}) {
  const {
    filters = {},
    filterOptions = {},
    sortField,
    sortOrder = 'asc',
    page = 1,
    pageSize = 20
  } = query

  // 1. 过滤
  let result = filterData(data, filters, filterOptions)
  
  // 2. 排序
  if (sortField) {
    result = sortData(result, sortField, sortOrder)
  }
  
  // 3. 分页
  const paginated = paginate(result, page, pageSize)
  
  return paginated
}

/**
 * 搜索建议（用于自动完成）
 * @param {Array} data - 数据数组
 * @param {string} field - 搜索字段
 * @param {string} keyword - 搜索关键词
 * @param {number} limit - 返回数量限制
 * @returns {Array} 匹配的值数组
 */
export function getSuggestions(data, field, keyword, limit = 10) {
  if (!keyword) return []
  
  const lowerKeyword = keyword.toLowerCase()
  const matches = new Set()
  
  for (const item of data) {
    const value = item[field]
    if (value && String(value).toLowerCase().includes(lowerKeyword)) {
      matches.add(value)
      if (matches.size >= limit) break
    }
  }
  
  return Array.from(matches)
}

export default {
  filterData,
  paginate,
  sortData,
  queryData,
  getSuggestions
}
