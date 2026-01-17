import request from '@/utils/request'

// ==================== 领用单 ====================

// 查询领用单列表
export function getPickingList(params) {
  return request({
    url: '/outbound/picking/list',
    method: 'get',
    params
  })
}

// 查询领用单详情
export function getPickingDetail(id) {
  return request({
    url: `/outbound/picking/${id}`,
    method: 'get'
  })
}

// 创建领用单
export function createPicking(data) {
  return request({
    url: '/outbound/picking',
    method: 'post',
    data
  })
}

// 提交领用单
export function submitPicking(id) {
  return request({
    url: `/outbound/picking/${id}/submit`,
    method: 'post'
  })
}

// 库存分配
export function allocatePicking(id) {
  return request({
    url: `/outbound/picking/${id}/allocate`,
    method: 'post'
  })
}

// 取消分配
export function cancelAllocate(id) {
  return request({
    url: `/outbound/picking/${id}/cancel-allocate`,
    method: 'post'
  })
}

// 确认发料
export function issuePicking(data) {
  return request({
    url: '/outbound/picking/issue',
    method: 'post',
    data
  })
}

// ==================== 波次管理 ====================

// 查询波次列表
export function getWaveList(params) {
  return request({
    url: '/outbound/wave/list',
    method: 'get',
    params
  })
}

// 创建波次
export function createWave(data) {
  return request({
    url: '/outbound/wave',
    method: 'post',
    data
  })
}

// 释放波次
export function releaseWave(id) {
  return request({
    url: `/outbound/wave/${id}/release`,
    method: 'post'
  })
}

// 取消波次
export function cancelWave(id) {
  return request({
    url: `/outbound/wave/${id}/cancel`,
    method: 'post'
  })
}
