<template>
  <div class="erp-config">
    <h2>ERP接口配置</h2>

    <el-row :gutter="16">
      <!-- 连接配置 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>ERP连接配置</span>
              <el-tag :type="connectionStatus ? 'success' : 'danger'" size="small">
                {{ connectionStatus ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </template>
          
          <el-form :model="connectionForm" label-width="100px">
            <el-form-item label="ERP系统">
              <el-select v-model="connectionForm.erpType" style="width: 100%">
                <el-option label="SAP" value="sap" />
                <el-option label="Oracle EBS" value="oracle" />
                <el-option label="用友U8" value="yongyou" />
                <el-option label="金蝶K3" value="kingdee" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="API地址">
              <el-input v-model="connectionForm.apiUrl" placeholder="https://erp.example.com/api" />
            </el-form-item>
            <el-form-item label="认证方式">
              <el-select v-model="connectionForm.authType" style="width: 100%">
                <el-option label="API Key" value="apikey" />
                <el-option label="OAuth 2.0" value="oauth" />
                <el-option label="Basic Auth" value="basic" />
              </el-select>
            </el-form-item>
            <el-form-item label="API Key" v-if="connectionForm.authType === 'apikey'">
              <el-input v-model="connectionForm.apiKey" type="password" show-password />
            </el-form-item>
            <el-form-item label="用户名" v-if="connectionForm.authType === 'basic'">
              <el-input v-model="connectionForm.username" />
            </el-form-item>
            <el-form-item label="密码" v-if="connectionForm.authType === 'basic'">
              <el-input v-model="connectionForm.password" type="password" show-password />
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number v-model="connectionForm.timeout" :min="5" :max="120" style="width: 100%" />
              <span style="margin-left: 8px; color: #909399">秒</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testConnection" :loading="testing">测试连接</el-button>
              <el-button type="success" @click="saveConnection">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 同步配置 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>同步配置</template>
          
          <el-form label-width="120px">
            <el-form-item label="自动同步">
              <el-switch v-model="syncConfig.autoSync" />
            </el-form-item>
            <el-form-item label="同步间隔" v-if="syncConfig.autoSync">
              <el-select v-model="syncConfig.interval" style="width: 100%">
                <el-option label="每5分钟" :value="5" />
                <el-option label="每10分钟" :value="10" />
                <el-option label="每30分钟" :value="30" />
                <el-option label="每小时" :value="60" />
              </el-select>
            </el-form-item>
            <el-form-item label="同步数据范围">
              <el-checkbox-group v-model="syncConfig.dataTypes">
                <el-checkbox label="material">物料主数据</el-checkbox>
                <el-checkbox label="requisition">领用单</el-checkbox>
                <el-checkbox label="delivery">送货单</el-checkbox>
                <el-checkbox label="inventory">库存数据</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="回传模式">
              <el-radio-group v-model="syncConfig.pushMode">
                <el-radio label="realtime">实时回传</el-radio>
                <el-radio label="batch">批量回传</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="批量间隔" v-if="syncConfig.pushMode === 'batch'">
              <el-select v-model="syncConfig.batchInterval" style="width: 100%">
                <el-option label="每10分钟" :value="10" />
                <el-option label="每30分钟" :value="30" />
                <el-option label="每小时" :value="60" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="saveSyncConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 接口列表 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>接口清单</span>
          <el-button type="primary" size="small" @click="syncAllNow">
            <el-icon><Refresh /></el-icon> 立即全部同步
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="ERP → WMS（下发）" name="inbound">
          <el-table :data="inboundApis" border size="small">
            <el-table-column prop="name" label="接口名称" width="150" />
            <el-table-column prop="endpoint" label="接口地址" min-width="200" />
            <el-table-column prop="method" label="方法" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="150" />
            <el-table-column prop="lastSync" label="最后同步" width="160" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="testApi(row)">测试</el-button>
                <el-button type="success" link size="small" @click="syncApi(row)">同步</el-button>
                <el-button type="info" link size="small" @click="viewLog(row)">日志</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="WMS → ERP（回传）" name="outbound">
          <el-table :data="outboundApis" border size="small">
            <el-table-column prop="name" label="接口名称" width="150" />
            <el-table-column prop="endpoint" label="接口地址" min-width="200" />
            <el-table-column prop="method" label="方法" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.method }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="150" />
            <el-table-column prop="lastPush" label="最后推送" width="160" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'success' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="testApi(row)">测试</el-button>
                <el-button type="info" link size="small" @click="viewLog(row)">日志</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 同步日志 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>同步日志</span>
          <el-button type="danger" link size="small" @click="clearLogs">清空日志</el-button>
        </div>
      </template>

      <el-table :data="syncLogs" border size="small" max-height="300">
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'inbound' ? 'primary' : 'success'" size="small">
              {{ row.type === 'inbound' ? '下发' : '回传' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="api" label="接口" width="150" />
        <el-table-column prop="result" label="结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="数据量" width="100" align="right" />
        <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const connectionStatus = ref(true)
const testing = ref(false)
const activeTab = ref('inbound')

const connectionForm = reactive({
  erpType: 'custom',
  apiUrl: 'https://erp.company.com/api/v1',
  authType: 'apikey',
  apiKey: '********************************',
  username: '',
  password: '',
  timeout: 30
})

const syncConfig = reactive({
  autoSync: true,
  interval: 10,
  dataTypes: ['material', 'requisition', 'delivery'],
  pushMode: 'realtime',
  batchInterval: 30
})

const inboundApis = ref([
  { name: '物料主数据', endpoint: '/material/sync', method: 'GET', description: '同步物料基础信息', lastSync: '2025-01-10 10:30:00', status: 'success' },
  { name: '领用单', endpoint: '/requisition/approved', method: 'GET', description: '获取审批通过的领用单', lastSync: '2025-01-10 10:28:00', status: 'success' },
  { name: '送货单', endpoint: '/delivery/list', method: 'GET', description: '获取ERP送货单', lastSync: '2025-01-10 10:25:00', status: 'success' },
  { name: '退料单审批', endpoint: '/return/approval', method: 'GET', description: '获取退料审批结果', lastSync: '2025-01-10 10:20:00', status: 'success' },
  { name: '移拨单审批', endpoint: '/transfer/approval', method: 'GET', description: '获取移拨审批结果', lastSync: '2025-01-10 10:15:00', status: 'success' }
])

const outboundApis = ref([
  { name: '收货确认', endpoint: '/receive/confirm', method: 'POST', description: '回传收货结果', lastPush: '2025-01-10 10:32:00', status: 'success' },
  { name: '发料确认', endpoint: '/picking/confirm', method: 'POST', description: '回传发料结果', lastPush: '2025-01-10 10:30:00', status: 'success' },
  { name: '退料提交', endpoint: '/return/submit', method: 'POST', description: '提交退料单审批', lastPush: '2025-01-10 09:45:00', status: 'success' },
  { name: '移拨提交', endpoint: '/transfer/submit', method: 'POST', description: '提交移拨单审批', lastPush: '2025-01-10 09:30:00', status: 'success' },
  { name: '盘点差异', endpoint: '/count/diff', method: 'POST', description: '回传盘点差异', lastPush: '2025-01-09 18:00:00', status: 'success' },
  { name: '库存同步', endpoint: '/inventory/sync', method: 'POST', description: '回传库存数据', lastPush: '2025-01-10 10:20:00', status: 'error' }
])

const syncLogs = ref([
  { time: '2025-01-10 10:32:00', type: 'outbound', api: '收货确认', result: 'success', count: 3, message: '成功回传3条收货记录' },
  { time: '2025-01-10 10:30:00', type: 'inbound', api: '物料主数据', result: 'success', count: 15, message: '成功同步15条物料数据' },
  { time: '2025-01-10 10:28:00', type: 'inbound', api: '领用单', result: 'success', count: 8, message: '成功同步8条领用单' },
  { time: '2025-01-10 10:20:00', type: 'outbound', api: '库存同步', result: 'error', count: 0, message: '连接超时，请检查网络' }
])

const testConnection = async () => {
  testing.value = true
  setTimeout(() => {
    testing.value = false
    connectionStatus.value = true
    ElMessage.success('ERP连接测试成功')
  }, 1500)
}

const saveConnection = () => {
  ElMessage.success('连接配置保存成功')
}

const saveSyncConfig = () => {
  ElMessage.success('同步配置保存成功')
}

const syncAllNow = () => {
  ElMessage.success('开始全部同步...')
}

const testApi = (row) => {
  ElMessage.info(`测试接口：${row.name}`)
}

const syncApi = (row) => {
  ElMessage.success(`开始同步：${row.name}`)
}

const viewLog = (row) => {
  ElMessage.info(`查看日志：${row.name}`)
}

const clearLogs = () => {
  syncLogs.value = []
  ElMessage.success('日志已清空')
}
</script>

<style scoped>
.erp-config { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 120px); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
