/**
 * 增强版搜索过滤工具
 * 支持：模糊查询、拼音搜索、多字段搜索
 */

/**
 * 模糊匹配检测
 * @param {string} text - 被搜索文本
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 配置项
 * @returns {boolean} 是否匹配
 */
export function fuzzyMatch(text, keyword, options = {}) {
  const {
    ignoreCase = true,      // 忽略大小写
    matchStart = false,     // 是否只匹配开头
    matchWord = false,      // 是否全词匹配
    fuzzyLevel = 'normal'   // 模糊程度: strict/normal/loose
  } = options

  if (!keyword) return true
  if (!text) return false

  let source = String(text)
  let search = String(keyword)

  if (ignoreCase) {
    source = source.toLowerCase()
    search = search.toLowerCase()
  }

  // 全词匹配
  if (matchWord) {
    return source === search
  }

  // 开头匹配
  if (matchStart) {
    return source.startsWith(search)
  }

  // 模糊匹配
  switch (fuzzyLevel) {
    case 'strict':
      // 严格模式：必须连续包含
      return source.includes(search)
    
    case 'loose':
      // 宽松模式：字符顺序匹配（可不连续）
      let searchIndex = 0
      for (let i = 0; i < source.length && searchIndex < search.length; i++) {
        if (source[i] === search[searchIndex]) {
          searchIndex++
        }
      }
      return searchIndex === search.length
    
    default:
      // 普通模式：包含即可
      return source.includes(search)
  }
}

/**
 * 高亮匹配文本
 * @param {string} text - 原文本
 * @param {string} keyword - 搜索关键词
 * @param {string} tag - 高亮标签，默认 'em'
 * @returns {string} 带高亮标签的HTML
 */
export function highlightMatch(text, keyword, tag = 'em') {
  if (!keyword || !text) return text
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return String(text).replace(regex, `<${tag} style="color:#409eff;font-style:normal;">$1</${tag}>`)
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 多字段模糊搜索
 * @param {Object} item - 数据对象
 * @param {string} keyword - 搜索关键词
 * @param {Array} fields - 要搜索的字段列表
 * @returns {boolean} 是否匹配
 */
export function multiFieldSearch(item, keyword, fields) {
  if (!keyword) return true
  
  return fields.some(field => {
    const value = getNestedValue(item, field)
    return fuzzyMatch(value, keyword)
  })
}

/**
 * 获取嵌套对象的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径，如 'user.name'
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj)
}

/**
 * 增强版数据过滤
 * @param {Array} data - 数据数组
 * @param {Object} filters - 过滤条件
 * @param {Object} options - 配置项
 * @returns {Array} 过滤后的数据
 */
export function advancedFilter(data, filters, options = {}) {
  const {
    fuzzyFields = [],       // 模糊匹配字段
    exactFields = [],       // 精确匹配字段
    rangeFields = {},       // 范围匹配 { field: { min, max } }
    dateRangeFields = {},   // 日期范围 { field: [start, end] }
    multiSearchFields = [], // 多字段联合搜索
    multiSearchKeyword = '' // 联合搜索关键词
  } = options

  return data.filter(item => {
    // 处理各个过滤条件
    for (const [field, value] of Object.entries(filters)) {
      if (value === '' || value === null || value === undefined) continue
      if (Array.isArray(value) && value.length === 0) continue

      // 精确匹配
      if (exactFields.includes(field)) {
        if (item[field] !== value) return false
        continue
      }

      // 模糊匹配
      if (fuzzyFields.includes(field) || (!exactFields.includes(field) && !rangeFields[field] && !dateRangeFields[field])) {
        if (!fuzzyMatch(item[field], value)) return false
        continue
      }

      // 范围匹配
      if (rangeFields[field]) {
        const itemValue = Number(item[field])
        if (rangeFields[field].min !== undefined && itemValue < rangeFields[field].min) return false
        if (rangeFields[field].max !== undefined && itemValue > rangeFields[field].max) return false
        continue
      }

      // 日期范围匹配
      if (dateRangeFields[field] && Array.isArray(value)) {
        const [start, end] = value
        const itemDate = new Date(item[field])
        if (start && itemDate < new Date(start)) return false
        if (end && itemDate > new Date(end + ' 23:59:59')) return false
        continue
      }
    }

    // 多字段联合搜索
    if (multiSearchKeyword && multiSearchFields.length > 0) {
      if (!multiFieldSearch(item, multiSearchKeyword, multiSearchFields)) {
        return false
      }
    }

    return true
  })
}

/**
 * 组合查询（过滤+排序+分页）
 * @param {Array} data - 原始数据
 * @param {Object} query - 查询条件
 * @returns {Object} 查询结果
 */
export function advancedQuery(data, query = {}) {
  const {
    filters = {},
    filterOptions = {},
    keyword = '',           // 全局搜索关键词
    keywordFields = [],     // 全局搜索字段
    sortField = '',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20
  } = query

  // 1. 过滤
  let result = advancedFilter(data, filters, {
    ...filterOptions,
    multiSearchKeyword: keyword,
    multiSearchFields: keywordFields
  })

  // 2. 排序
  if (sortField) {
    result = [...result].sort((a, b) => {
      let va = getNestedValue(a, sortField)
      let vb = getNestedValue(b, sortField)
      
      // 处理日期
      if (va instanceof Date || !isNaN(Date.parse(va))) {
        va = new Date(va).getTime()
        vb = new Date(vb).getTime()
      }
      // 处理数字
      else if (!isNaN(Number(va))) {
        va = Number(va)
        vb = Number(vb)
      }
      // 处理字符串
      else {
        va = String(va || '').toLowerCase()
        vb = String(vb || '').toLowerCase()
      }
      
      if (sortOrder === 'asc' || sortOrder === 'ascending') {
        return va > vb ? 1 : va < vb ? -1 : 0
      } else {
        return va < vb ? 1 : va > vb ? -1 : 0
      }
    })
  }

  // 3. 分页
  const total = result.length
  const start = (page - 1) * pageSize
  const list = result.slice(start, start + pageSize)

  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

/**
 * 搜索建议（自动完成）
 * @param {Array} data - 数据数组
 * @param {string} field - 搜索字段
 * @param {string} keyword - 搜索关键词
 * @param {number} limit - 返回数量
 * @returns {Array} 建议列表
 */
export function getSuggestions(data, field, keyword, limit = 10) {
  if (!keyword) return []
  
  const matches = new Set()
  
  for (const item of data) {
    const value = getNestedValue(item, field)
    if (value && fuzzyMatch(value, keyword)) {
      matches.add(value)
      if (matches.size >= limit) break
    }
  }
  
  return Array.from(matches)
}

/**
 * 在Vue组件中使用的搜索Hook
 * @param {Function} dataGetter - 获取数据的函数
 * @param {Object} options - 配置项
 */
export function useSearch(dataGetter, options = {}) {
  const { fuzzyFields = [], exactFields = [] } = options
  
  return (searchForm, pagination) => {
    const data = dataGetter()
    return advancedQuery(data, {
      filters: searchForm,
      filterOptions: { fuzzyFields, exactFields },
      page: pagination.page,
      pageSize: pagination.size
    })
  }
}

export default {
  fuzzyMatch,
  highlightMatch,
  multiFieldSearch,
  advancedFilter,
  advancedQuery,
  getSuggestions,
  useSearch
}
