import request from '@/utils/request'

// ==================== 收货单 ====================

// 查询收货单列表
export function getReceiveList(params) {
  return request({
    url: '/inbound/receive/list',
    method: 'get',
    params
  })
}

// 查询收货单详情
export function getReceiveDetail(id) {
  return request({
    url: `/inbound/receive/${id}`,
    method: 'get'
  })
}

// 创建收货单
export function createReceive(data) {
  return request({
    url: '/inbound/receive',
    method: 'post',
    data
  })
}

// 开始收货
export function startReceive(data) {
  return request({
    url: '/inbound/receive/start',
    method: 'post',
    data
  })
}

// 确认收货
export function confirmReceive(data) {
  return request({
    url: '/inbound/receive/confirm',
    method: 'post',
    data
  })
}

// 完成收货
export function completeReceive(id) {
  return request({
    url: `/inbound/receive/${id}/complete`,
    method: 'post'
  })
}

// ==================== 上架任务 ====================

// 查询上架任务列表
export function getPutawayList(params) {
  return request({
    url: '/inbound/putaway/list',
    method: 'get',
    params
  })
}

// 生成上架任务
export function generatePutaway(receiveId) {
  return request({
    url: `/inbound/putaway/generate/${receiveId}`,
    method: 'post'
  })
}

// 确认上架
export function confirmPutaway(data) {
  return request({
    url: '/inbound/putaway/confirm',
    method: 'post',
    data
  })
}
