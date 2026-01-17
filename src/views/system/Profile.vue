<template>
  <div class="profile-page">
    <h2>个人中心</h2>
    
    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="user-card">
          <div class="user-info">
            <el-avatar :size="100">管</el-avatar>
            <h3>管理员</h3>
            <p class="user-role">系统管理员</p>
            <div class="user-stats">
              <div class="stat-item">
                <div class="stat-value">128</div>
                <div class="stat-label">登录天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">1,256</div>
                <div class="stat-label">操作次数</div>
              </div>
            </div>
          </div>
          <el-divider />
          <div class="user-detail">
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span>用户名：admin</span>
            </div>
            <div class="detail-item">
              <el-icon><OfficeBuilding /></el-icon>
              <span>部门：IT部</span>
            </div>
            <div class="detail-item">
              <el-icon><Phone /></el-icon>
              <span>手机：138****8888</span>
            </div>
            <div class="detail-item">
              <el-icon><Message /></el-icon>
              <span>邮箱：admin@company.com</span>
            </div>
            <div class="detail-item">
              <el-icon><Calendar /></el-icon>
              <span>注册时间：2024-01-01</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="16">
        <el-card shadow="never">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="basic">
              <el-form :model="basicForm" label-width="100px" style="max-width: 500px;">
                <el-form-item label="用户名">
                  <el-input v-model="basicForm.username" disabled />
                </el-form-item>
                <el-form-item label="姓名">
                  <el-input v-model="basicForm.realName" />
                </el-form-item>
                <el-form-item label="手机号">
                  <el-input v-model="basicForm.phone" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="basicForm.email" />
                </el-form-item>
                <el-form-item label="性别">
                  <el-radio-group v-model="basicForm.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveBasic">保存修改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="修改密码" name="password">
              <el-form :model="passwordForm" label-width="100px" style="max-width: 500px;">
                <el-form-item label="原密码">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="savePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="操作日志" name="logs">
              <el-table :data="recentLogs" size="small">
                <el-table-column prop="time" label="时间" width="160" />
                <el-table-column prop="action" label="操作" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.type" size="small">{{ row.action }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="content" label="内容" />
                <el-table-column prop="ip" label="IP" width="130" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, OfficeBuilding, Phone, Message, Calendar } from '@element-plus/icons-vue'

const activeTab = ref('basic')

const basicForm = reactive({
  username: 'admin',
  realName: '管理员',
  phone: '13888888888',
  email: 'admin@company.com',
  gender: 'male'
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const recentLogs = ref([
  { time: '2024-12-20 10:30:00', action: '登录', type: 'success', content: '登录系统', ip: '192.168.1.100' },
  { time: '2024-12-20 10:35:00', action: '查询', type: 'info', content: '查询库存列表', ip: '192.168.1.100' },
  { time: '2024-12-20 11:00:00', action: '新增', type: 'primary', content: '新增物料MAT001234', ip: '192.168.1.100' },
  { time: '2024-12-20 11:30:00', action: '修改', type: 'warning', content: '修改物料MAT001234', ip: '192.168.1.100' },
  { time: '2024-12-20 14:00:00', action: '导出', type: '', content: '导出库存报表', ip: '192.168.1.100' }
])

const saveBasic = () => { ElMessage.success('资料保存成功') }
const savePassword = () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次密码不一致')
    return
  }
  ElMessage.success('密码修改成功')
}
</script>

<style scoped>
.profile-page { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }

.user-card { text-align: center; }
.user-info { padding: 20px 0; }
.user-info h3 { margin: 16px 0 8px; font-size: 20px; }
.user-role { color: #909399; font-size: 14px; }
.user-stats { display: flex; justify-content: center; gap: 40px; margin-top: 20px; }
.stat-item .stat-value { font-size: 24px; font-weight: bold; color: #409eff; }
.stat-item .stat-label { font-size: 12px; color: #909399; }

.user-detail { text-align: left; }
.detail-item { display: flex; align-items: center; gap: 8px; padding: 10px 0; color: #606266; }
.detail-item .el-icon { color: #409eff; }
</style>
