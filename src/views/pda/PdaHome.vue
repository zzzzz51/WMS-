<template>
  <div class="pda-home">
    <div class="pda-header">
      <h2>WMS移动端</h2>
      <div class="user-info">
        <span>操作员：张三</span>
        <el-icon><Setting /></el-icon>
      </div>
    </div>

    <div class="quick-menu">
      <div class="menu-item" v-for="item in menuItems" :key="item.path" @click="goTo(item.path)">
        <div class="menu-icon" :style="{ background: item.color }">
          <span>{{ item.icon }}</span>
        </div>
        <div class="menu-label">{{ item.label }}</div>
        <div class="menu-badge" v-if="item.badge">{{ item.badge }}</div>
      </div>
    </div>

    <div class="today-stats">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">28</div>
          <div class="stat-label">收货单</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">45</div>
          <div class="stat-label">上架任务</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">32</div>
          <div class="stat-label">发料单</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">8</div>
          <div class="stat-label">盘点任务</div>
        </div>
      </div>
    </div>

    <div class="recent-tasks">
      <h3>待处理任务</h3>
      <div class="task-list">
        <div class="task-item" v-for="task in recentTasks" :key="task.id" @click="handleTask(task)">
          <div class="task-icon" :style="{ background: task.color }">{{ task.icon }}</div>
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-desc">{{ task.desc }}</div>
          </div>
          <div class="task-time">{{ task.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'

const router = useRouter()

const menuItems = ref([
  { label: '收货作业', icon: '📥', path: '/pda/receive', color: '#409eff', badge: 5 },
  { label: '上架作业', icon: '⬆️', path: '/pda/putaway', color: '#67c23a', badge: 12 },
  { label: '发料作业', icon: '📤', path: '/pda/picking', color: '#e6a23c', badge: 8 },
  { label: '退料接收', icon: '↩️', path: '/pda/return', color: '#f56c6c', badge: 2 },
  { label: '移库作业', icon: '🔄', path: '/pda/transfer', color: '#909399', badge: 0 },
  { label: '盘点作业', icon: '📋', path: '/pda/count', color: '#9c27b0', badge: 3 },
  { label: '库存查询', icon: '🔍', path: '/pda/query', color: '#00bcd4', badge: 0 },
  { label: '条码扫描', icon: '📷', path: '/pda/scan', color: '#ff9800', badge: 0 }
])

const recentTasks = ref([
  { id: 1, icon: '📥', title: '收货单 RK20250111001', desc: '供应商：华东五金', time: '10:30', color: '#e6f4ff' },
  { id: 2, icon: '⬆️', title: '上架任务 SJ20250111008', desc: '物料：螺栓M10×30 × 500', time: '10:25', color: '#f0f9eb' },
  { id: 3, icon: '📤', title: '发料单 FL20250111005', desc: '领用部门：生产车间', time: '10:20', color: '#fdf6ec' }
])

const goTo = (path) => {
  router.push(path)
}

const handleTask = (task) => {
  console.log('处理任务:', task)
}
</script>

<style scoped>
.pda-home {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100vh;
  max-width: 500px;
  margin: 0 auto;
}

.pda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pda-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.quick-menu {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.menu-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.menu-item:active {
  transform: scale(0.95);
}

.menu-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 22px;
}

.menu-label {
  font-size: 12px;
  color: #606266;
}

.menu-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.today-stats {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.today-stats h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #303133;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.recent-tasks {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.recent-tasks h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #303133;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.task-item:last-child {
  border-bottom: none;
}

.task-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.task-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.task-time {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
