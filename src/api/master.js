import request from '@/utils/request'

// ==================== 物料 ====================

export function getMaterialList(params) {
  return request({ url: '/master/material/list', method: 'get', params })
}

export function getMaterialDetail(id) {
  return request({ url: `/master/material/${id}`, method: 'get' })
}

export function createMaterial(data) {
  return request({ url: '/master/material', method: 'post', data })
}

export function updateMaterial(data) {
  return request({ url: '/master/material', method: 'put', data })
}

export function deleteMaterial(id) {
  return request({ url: `/master/material/${id}`, method: 'delete' })
}

// ==================== 仓库 ====================

export function getWarehouseList(params) {
  return request({ url: '/master/warehouse/list', method: 'get', params })
}

export function getWarehouseDetail(id) {
  return request({ url: `/master/warehouse/${id}`, method: 'get' })
}

export function createWarehouse(data) {
  return request({ url: '/master/warehouse', method: 'post', data })
}

export function updateWarehouse(data) {
  return request({ url: '/master/warehouse', method: 'put', data })
}

export function deleteWarehouse(id) {
  return request({ url: `/master/warehouse/${id}`, method: 'delete' })
}

// ==================== 库位 ====================

export function getLocationList(params) {
  return request({ url: '/master/location/list', method: 'get', params })
}

export function getLocationDetail(id) {
  return request({ url: `/master/location/${id}`, method: 'get' })
}

export function createLocation(data) {
  return request({ url: '/master/location', method: 'post', data })
}

export function updateLocation(data) {
  return request({ url: '/master/location', method: 'put', data })
}

export function deleteLocation(id) {
  return request({ url: `/master/location/${id}`, method: 'delete' })
}

// ==================== 供应商 ====================

export function getSupplierList(params) {
  return request({ url: '/master/supplier/list', method: 'get', params })
}

export function getSupplierDetail(id) {
  return request({ url: `/master/supplier/${id}`, method: 'get' })
}

export function createSupplier(data) {
  return request({ url: '/master/supplier', method: 'post', data })
}

export function updateSupplier(data) {
  return request({ url: '/master/supplier', method: 'put', data })
}

export function deleteSupplier(id) {
  return request({ url: `/master/supplier/${id}`, method: 'delete' })
}

// ==================== 下拉选项 ====================

export function getWarehouseOptions() {
  return request({ url: '/master/warehouse/options', method: 'get' })
}

export function getZoneOptions(warehouseId) {
  return request({ url: `/master/zone/options/${warehouseId}`, method: 'get' })
}

export function getLocationOptions(zoneId) {
  return request({ url: `/master/location/options/${zoneId}`, method: 'get' })
}

export function getMaterialOptions(keyword) {
  return request({ url: '/master/material/options', method: 'get', params: { keyword } })
}

export function getSupplierOptions(keyword) {
  return request({ url: '/master/supplier/options', method: 'get', params: { keyword } })
}
