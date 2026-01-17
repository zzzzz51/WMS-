import axios from 'axios'

const API_BASE = 'http://localhost:9200'

export function getInventoryList(params) {
  return axios.get(`${API_BASE}/inventory/list`, { params })
    .then(res => res.data)
}

export function getInventoryStats() {
  return axios.get(`${API_BASE}/inventory/stats`)
    .then(res => res.data)
}

export function inboundInventory(data) {
  return axios.post(`${API_BASE}/inventory/inbound`, data)
    .then(res => res.data)
}

export function outboundInventory(data) {
  return axios.post(`${API_BASE}/inventory/outbound`, data)
    .then(res => res.data)
}