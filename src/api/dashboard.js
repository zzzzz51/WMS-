import request from '@/utils/request'

// 获取看板统计数据
export function getDashboardStats() {
  return request({
    url: '/report/dashboard/stats',
    method: 'get'
  })
}

// 获取库存概览
export function getInventoryOverview() {
  return request({
    url: '/report/dashboard/inventory-overview',
    method: 'get'
  })
}

// 获取今日作业统计
export function getTodayOperations() {
  return request({
    url: '/report/dashboard/today-operations',
    method: 'get'
  })
}

// 获取出入库趋势
export function getInOutTrend(params) {
  return request({
    url: '/report/dashboard/inout-trend',
    method: 'get',
    params
  })
}

// 获取库存周转率
export function getTurnoverRate(params) {
  return request({
    url: '/report/dashboard/turnover-rate',
    method: 'get',
    params
  })
}

// 获取库位使用率
export function getLocationUsage() {
  return request({
    url: '/report/dashboard/location-usage',
    method: 'get'
  })
}

// 获取预警信息
export function getAlerts() {
  return request({
    url: '/report/dashboard/alerts',
    method: 'get'
  })
}

// 获取ABC分类统计
export function getAbcStats() {
  return request({
    url: '/report/dashboard/abc-stats',
    method: 'get'
  })
}
