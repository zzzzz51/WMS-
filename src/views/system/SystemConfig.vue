<template>
  <div class="system-config">
    <h2>系统设置</h2>
    
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="基础设置" name="basic">
        <el-form :model="basicConfig" label-width="150px" style="max-width: 600px;">
          <el-form-item label="系统名称">
            <el-input v-model="basicConfig.systemName" />
          </el-form-item>
          <el-form-item label="公司名称">
            <el-input v-model="basicConfig.companyName" />
          </el-form-item>
          <el-form-item label="系统Logo">
            <el-upload action="#" :show-file-list="false">
              <el-button>上传Logo</el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="登录页背景">
            <el-color-picker v-model="basicConfig.loginBg" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveBasic">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="库存设置" name="inventory">
        <el-form :model="inventoryConfig" label-width="150px" style="max-width: 600px;">
          <el-form-item label="默认安全库存">
            <el-input-number v-model="inventoryConfig.defaultSafetyStock" :min="0" />
          </el-form-item>
          <el-form-item label="低库存预警天数">
            <el-input-number v-model="inventoryConfig.lowStockDays" :min="1" /> 天
          </el-form-item>
          <el-form-item label="呆滞物料天数">
            <el-input-number v-model="inventoryConfig.slowMovingDays" :min="30" /> 天
          </el-form-item>
          <el-form-item label="自动ABC分类">
            <el-switch v-model="inventoryConfig.autoAbcClass" />
          </el-form-item>
          <el-form-item label="负库存允许">
            <el-switch v-model="inventoryConfig.allowNegative" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveInventory">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="通知设置" name="notification">
        <el-form :model="notifyConfig" label-width="150px" style="max-width: 600px;">
          <el-form-item label="库存预警通知">
            <el-switch v-model="notifyConfig.stockWarning" />
          </el-form-item>
          <el-form-item label="过期预警通知">
            <el-switch v-model="notifyConfig.expireWarning" />
          </el-form-item>
          <el-form-item label="邮件通知">
            <el-switch v-model="notifyConfig.emailNotify" />
          </el-form-item>
          <el-form-item label="通知邮箱" v-if="notifyConfig.emailNotify">
            <el-input v-model="notifyConfig.notifyEmail" placeholder="多个邮箱用逗号分隔" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveNotify">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <el-tab-pane label="打印设置" name="print">
        <el-form :model="printConfig" label-width="150px" style="max-width: 600px;">
          <el-form-item label="打印纸张">
            <el-select v-model="printConfig.paperSize">
              <el-option label="A4" value="A4" />
              <el-option label="A5" value="A5" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="条码类型">
            <el-select v-model="printConfig.barcodeType">
              <el-option label="Code128" value="code128" />
              <el-option label="Code39" value="code39" />
              <el-option label="QRCode" value="qrcode" />
            </el-select>
          </el-form-item>
          <el-form-item label="自动打印">
            <el-switch v-model="printConfig.autoPrint" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="savePrint">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')

const basicConfig = reactive({
  systemName: 'WMS仓储管理系统',
  companyName: '示例公司',
  loginBg: '#667eea'
})

const inventoryConfig = reactive({
  defaultSafetyStock: 100,
  lowStockDays: 7,
  slowMovingDays: 180,
  autoAbcClass: true,
  allowNegative: false
})

const notifyConfig = reactive({
  stockWarning: true,
  expireWarning: true,
  emailNotify: false,
  notifyEmail: ''
})

const printConfig = reactive({
  paperSize: 'A4',
  barcodeType: 'code128',
  autoPrint: false
})

const saveBasic = () => { ElMessage.success('基础设置保存成功') }
const saveInventory = () => { ElMessage.success('库存设置保存成功') }
const saveNotify = () => { ElMessage.success('通知设置保存成功') }
const savePrint = () => { ElMessage.success('打印设置保存成功') }
</script>

<style scoped>
.system-config { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
</style>
