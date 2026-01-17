<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <img src="@/assets/logo.svg" alt="logo" v-if="!isCollapsed" />
        <span v-if="!isCollapsed">WMS仓库系统</span>
        <span v-else>W</span>
      </div>
      
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :collapse-transition="false"
          background-color="#1d1e1f"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          router
        >
          <template v-for="menu in menuList" :key="menu.path">
            <!-- 无子菜单 -->
            <el-menu-item v-if="!menu.children" :index="menu.path">
              <el-icon><component :is="menu.icon" /></el-icon>
              <template #title>{{ menu.title }}</template>
            </el-menu-item>
            
            <!-- 有子菜单 -->
            <el-sub-menu v-else :index="menu.path">
              <template #title>
                <el-icon><component :is="menu.icon" /></el-icon>
                <span>{{ menu.title }}</span>
              </template>
              
              <template v-for="sub in menu.children" :key="sub.path || sub.title">
                <!-- 二级菜单直接项 -->
                <el-menu-item v-if="sub.path && !sub.children" :index="sub.path">
                  {{ sub.title }}
                </el-menu-item>
                
                <!-- 三级菜单分组 -->
                <el-menu-item-group v-else-if="sub.children" :title="sub.title">
                  <el-menu-item v-for="item in sub.children" :key="item.path" :index="item.path">
                    {{ item.title }}
                  </el-menu-item>
                </el-menu-item-group>
              </template>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <div class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <Expand v-if="isCollapsed" />
            <Fold v-else />
          </el-icon>
          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- PDA入口 -->
          <el-tooltip content="打开PDA终端" placement="bottom">
            <el-button type="primary" link @click="openPda">
              <el-icon><Iphone /></el-icon>
            </el-button>
          </el-tooltip>
          
          <!-- 全屏 -->
          <el-tooltip content="全屏" placement="bottom">
            <el-button type="primary" link @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          
          <!-- 用户信息 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" icon="User" />
              <span class="username">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon> 修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs-bar">
        <el-tabs v-model="activeTab" type="card" @tab-remove="removeTab" @tab-click="clickTab">
          <el-tab-pane 
            v-for="tab in tabs" 
            :key="tab.path" 
            :label="tab.title" 
            :name="tab.path"
            :closable="tab.path !== '/dashboard'"
          />
        </el-tabs>
      </div>

      <!-- 内容区 -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Expand, Fold, FullScreen, User, Lock, SwitchButton, ArrowDown, Iphone,
  Monitor, Box, Download, Upload, Switch, Document, DataLine, PieChart,
  DataAnalysis, Ticket, Files, Setting
} from '@element-plus/icons-vue'
import menuList from '@/router/menu.js'

const route = useRoute()
const router = useRouter()

// 折叠状态
const isCollapsed = ref(false)

// 用户名
const username = ref(localStorage.getItem('username') || '管理员')

// 当前激活菜单
const activeMenu = computed(() => route.path)

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({ path: item.path, title: item.meta.title }))
})

// 标签页
const tabs = ref([{ path: '/dashboard', title: '首页看板' }])
const activeTab = ref('/dashboard')
const cachedViews = computed(() => tabs.value.map(t => t.path))

// 监听路由变化
watch(() => route.path, (path) => {
  activeTab.value = path
  const title = route.meta.title || '未命名'
  const exists = tabs.value.find(t => t.path === path)
  if (!exists) {
    tabs.value.push({ path, title })
  }
}, { immediate: true })

// 点击标签
const clickTab = (tab) => {
  router.push(tab.props.name)
}

// 关闭标签
const removeTab = (path) => {
  const idx = tabs.value.findIndex(t => t.path === path)
  if (idx > -1) {
    tabs.value.splice(idx, 1)
    if (activeTab.value === path) {
      const next = tabs.value[idx] || tabs.value[idx - 1]
      router.push(next.path)
    }
  }
}

// 打开PDA
const openPda = () => {
  window.open('/pda', '_blank')
}

// 全屏
const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

// 用户菜单
const handleCommand = (cmd) => {
  switch (cmd) {
    case 'profile':
      router.push('/system/profile')
      break
    case 'password':
      ElMessage.info('修改密码')
      break
    case 'logout':
      ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
        .then(() => {
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
          router.push('/login')
        }).catch(() => {})
      break
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background: #1d1e1f;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #2d2d2d;
  white-space: nowrap;
  overflow: hidden;
}

.logo img {
  width: 28px;
  height: 28px;
}

.menu-scrollbar {
  flex: 1;
  overflow: hidden;
}

.el-menu {
  border-right: none;
}

/* 三级菜单样式 */
:deep(.el-menu-item-group__title) {
  padding-left: 20px !important;
  color: #909399;
  font-size: 12px;
}

:deep(.el-menu-item-group .el-menu-item) {
  padding-left: 60px !important;
}

/* 主内容区 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

/* 顶部导航 */
.header {
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  color: #606266;
  font-size: 14px;
}

/* 标签栏 */
.tabs-bar {
  background: #fff;
  padding: 6px 16px 0;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.tabs-bar :deep(.el-tabs__header) {
  margin: 0;
  border: none;
}

.tabs-bar :deep(.el-tabs__nav) {
  border: none;
}

.tabs-bar :deep(.el-tabs__item) {
  border: 1px solid #e4e7ed;
  border-radius: 4px 4px 0 0;
  margin-right: 4px;
  background: #fff;
}

.tabs-bar :deep(.el-tabs__item.is-active) {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 内容区 */
.content-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
