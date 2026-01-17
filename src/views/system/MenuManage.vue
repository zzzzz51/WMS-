<template>
  <div class="menu-manage">
    <h2>菜单管理</h2>
    
    <div class="action-bar">
      <el-button type="primary" @click="handleAdd(null)">
        <el-icon><Plus /></el-icon> 新增菜单
      </el-button>
      <el-button @click="toggleExpand">
        <el-icon><component :is="isExpand ? 'FolderOpened' : 'Folder'" /></el-icon>
        {{ isExpand ? '折叠全部' : '展开全部' }}
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="menuList" row-key="id" :tree-props="{ children: 'children' }"
        :default-expand-all="isExpand" border
        :header-cell-style="{ background: '#f5f7fa', fontWeight: 600 }">
        <el-table-column prop="name" label="菜单名称" min-width="200" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="180" />
        <el-table-column prop="component" label="组件路径" width="250" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="type" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'menu' ? 'primary' : row.type === 'dir' ? 'success' : 'warning'" size="small">
              {{ row.type === 'menu' ? '菜单' : row.type === 'dir' ? '目录' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAdd(row)" v-if="row.type !== 'button'">新增</el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select v-model="formData.parentId" :data="menuTree" check-strictly
            :render-after-expand="false" placeholder="选择上级菜单" clearable style="width: 100%" />
        </el-form-item>
        <el-form-item label="菜单类型">
          <el-radio-group v-model="formData.type">
            <el-radio label="dir">目录</el-radio>
            <el-radio label="menu">菜单</el-radio>
            <el-radio label="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="菜单名称">
              <el-input v-model="formData.name" placeholder="菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标" v-if="formData.type !== 'button'">
              <el-input v-model="formData.icon" placeholder="图标名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="formData.type !== 'button'">
          <el-col :span="12">
            <el-form-item label="路由路径">
              <el-input v-model="formData.path" placeholder="/path" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组件路径">
              <el-input v-model="formData.component" placeholder="views/xxx/index.vue" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限标识" v-if="formData.type === 'button'">
              <el-input v-model="formData.permission" placeholder="sys:user:add" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, FolderOpened, Folder, HomeFilled, Box, Download, Upload, Grid, DataAnalysis, Setting, Iphone } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')
const isExpand = ref(true)

const menuList = ref([
  /* ================= 首页 ================= */
  {
    id: 1,
    name: '首页',
    icon: 'HomeFilled',
    path: '/dashboard',
    component: 'views/dashboard/index.vue',
    type: 'menu',
    sort: 1,
    status: 1
  },

  /* ================= 基础资料 ================= */
  {
    id: 2,
    name: '基础资料',
    icon: 'Folder',
    path: '/basedata',
    type: 'dir',
    sort: 2,
    status: 1,
    children: [
      {
        id: 21,
        name: '仓库管理',
        path: '/basedata/warehouse',
        component: 'views/basedata/WarehouseManage.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 22,
        name: '库位管理',
        path: '/basedata/location',
        component: 'views/basedata/LocationManage.vue',
        type: 'menu',
        sort: 2,
        status: 1
      },
      {
        id: 23,
        name: '物料主数据',
        path: '/basedata/material',
        component: 'views/basedata/MaterialManage.vue',
        type: 'menu',
        sort: 3,
        status: 1
      },
      {
        id: 24,
        name: '供应商管理',
        path: '/basedata/supplier',
        component: 'views/basedata/SupplierManage.vue',
        type: 'menu',
        sort: 4,
        status: 1
      },
      {
        id: 25,
        name: '条码管理',
        path: '/basedata/barcode',
        component: 'views/basedata/BarcodeManage.vue',
        type: 'menu',
        sort: 5,
        status: 1
      }
    ]
  },

  /* ================= 入库管理 ================= */
  {
    id: 3,
    name: '入库管理',
    icon: 'Download',
    path: '/inbound',
    type: 'dir',
    sort: 3,
    status: 1,
    children: [
      {
        id: 31,
        name: '收货管理',
        path: '/inbound/receive',
        component: 'views/inbound/receive.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 32,
        name: '上架管理',
        path: '/inbound/putaway',
        component: 'views/inbound/putaway.vue',
        type: 'menu',
        sort: 2,
        status: 1
      }
    ]
  },

  /* ================= 出库管理 ================= */
  {
    id: 4,
    name: '出库管理',
    icon: 'Upload',
    path: '/outbound',
    type: 'dir',
    sort: 4,
    status: 1,
    children: [
      {
        id: 41,
        name: '领料出库',
        path: '/outbound/requisition',
        component: 'views/outbound/requisition.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 42,
        name: '波次出库',
        path: '/outbound/wave',
        component: 'views/outbound/wave.vue',
        type: 'menu',
        sort: 2,
        status: 1
      }
    ]
  },

  /* ================= 库存管理 ================= */
  {
    id: 5,
    name: '库存管理',
    icon: 'Box',
    path: '/inventory',
    type: 'dir',
    sort: 5,
    status: 1,
    children: [
      {
        id: 51,
        name: '库存台账',
        path: '/inventory/list',
        component: 'views/inventory/list.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 52,
        name: '库存盘点',
        path: '/inventory/check',
        component: 'views/inventory/check.vue',
        type: 'menu',
        sort: 2,
        status: 1
      },
      {
        id: 53,
        name: '库存流水',
        path: '/inventory/flow',
        component: 'views/inventory/flow.vue',
        type: 'menu',
        sort: 3,
        status: 1
      },
      {
        id: 54,
        name: '库存事务',
        path: '/inventory/transaction',
        component: 'views/inventory/transaction.vue',
        type: 'menu',
        sort: 4,
        status: 1
      },
      {
        id: 55,
        name: 'ABC分类',
        path: '/inventory/abc',
        component: 'views/inventory/AbcClassification.vue',
        type: 'menu',
        sort: 5,
        status: 1
      },
      {
        id: 56,
        name: '周转分析',
        path: '/inventory/turnover',
        component: 'views/inventory/TurnoverAnalysis.vue',
        type: 'menu',
        sort: 6,
        status: 1
      },
      {
        id: 57,
        name: '库存预警',
        path: '/inventory/warning',
        component: 'views/inventory/StockWarning.vue',
        type: 'menu',
        sort: 7,
        status: 1
      },
      {
        id: 58,
        name: '安全库存预警',
        path: '/inventory/safety-warning',
        component: 'views/inventory/SafetyStockWarning.vue',
        type: 'menu',
        sort: 8,
        status: 1
      }
    ]
  },

  /* ================= 物资管理 ================= */
  {
    id: 6,
    name: '物资管理',
    icon: 'Grid',
    path: '/material',
    type: 'dir',
    sort: 6,
    status: 1,
    children: [
      {
        id: 61,
        name: '物资台账',
        path: '/material/manage',
        component: 'views/material/MaterialManage.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 62,
        name: '借用管理',
        path: '/material/borrow',
        component: 'views/material/BorrowManage.vue',
        type: 'menu',
        sort: 2,
        status: 1
      },
      {
        id: 63,
        name: '调拨管理',
        path: '/material/transfer',
        component: 'views/material/TransferManage.vue',
        type: 'menu',
        sort: 3,
        status: 1
      },
      {
        id: 64,
        name: '换货管理',
        path: '/material/exchange',
        component: 'views/material/ExchangeManage.vue',
        type: 'menu',
        sort: 4,
        status: 1
      },
      {
        id: 65,
        name: '维修管理',
        path: '/material/repair',
        component: 'views/material/RepairManage.vue',
        type: 'menu',
        sort: 5,
        status: 1
      },
      {
        id: 66,
        name: '报废管理',
        path: '/material/scrap',
        component: 'views/material/ScrapManage.vue',
        type: 'menu',
        sort: 6,
        status: 1
      }
    ]
  },

  /* ================= 报表分析 ================= */
  {
    id: 7,
    name: '报表分析',
    icon: 'DataAnalysis',
    path: '/report',
    type: 'dir',
    sort: 7,
    status: 1,
    children: [
      {
        id: 71,
        name: '指标分析',
        path: '/report/metrics',
        component: 'views/report/MetricsAnalysis.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 72,
        name: '库存报表',
        path: '/report/inventory',
        component: 'views/report/InventoryReport.vue',
        type: 'menu',
        sort: 2,
        status: 1
      },
      {
        id: 73,
        name: '出入库报表',
        path: '/report/inout',
        component: 'views/report/InOutReport.vue',
        type: 'menu',
        sort: 3,
        status: 1
      }
    ]
  },

  /* ================= 系统管理 ================= */
  {
    id: 8,
    name: '系统管理',
    icon: 'Setting',
    path: '/system',
    type: 'dir',
    sort: 99,
    status: 1,
    children: [
      {
        id: 81,
        name: '用户管理',
        path: '/system/user',
        component: 'views/system/UserManage.vue',
        type: 'menu',
        sort: 1,
        status: 1
      },
      {
        id: 82,
        name: '角色管理',
        path: '/system/role',
        component: 'views/system/RoleManage.vue',
        type: 'menu',
        sort: 2,
        status: 1
      },
      {
        id: 83,
        name: '菜单管理',
        path: '/system/menu',
        component: 'views/system/MenuManage.vue',
        type: 'menu',
        sort: 3,
        status: 1
      },
      {
        id: 84,
        name: '字典管理',
        path: '/system/dict',
        component: 'views/system/DictManage.vue',
        type: 'menu',
        sort: 4,
        status: 1
      },
      {
        id: 85,
        name: '系统配置',
        path: '/system/config',
        component: 'views/system/SystemConfig.vue',
        type: 'menu',
        sort: 5,
        status: 1
      },
      {
        id: 86,
        name: '操作日志',
        path: '/system/log',
        component: 'views/system/OperationLog.vue',
        type: 'menu',
        sort: 6,
        status: 1
      },
      {
        id: 87,
        name: '个人中心',
        path: '/system/profile',
        component: 'views/system/Profile.vue',
        type: 'menu',
        sort: 7,
        status: 1
      }
    ]
  }
])

const menuTree = computed(() => {
  const buildTree = (list) => list.map(item => ({
    value: item.id,
    label: item.name,
    children: item.children ? buildTree(item.children) : undefined
  }))
  return [{ value: 0, label: '顶级菜单' }, ...buildTree(menuList.value)]
})

const formData = reactive({ id: null, parentId: 0, name: '', icon: '', path: '', component: '', type: 'menu', sort: 0, permission: '' })

const toggleExpand = () => { isExpand.value = !isExpand.value }

const handleAdd = (parent) => {
  Object.assign(formData, { id: null, parentId: parent?.id || 0, name: '', icon: '', path: '', component: '', type: 'menu', sort: 0, permission: '' })
  dialogTitle.value = '新增菜单'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(formData, row)
  dialogTitle.value = '编辑菜单'
  dialogVisible.value = true
}

const submitForm = () => { ElMessage.success('保存成功'); dialogVisible.value = false }

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除菜单 "${row.name}"？`, '确认')
    .then(() => ElMessage.success('删除成功'))
    .catch(() => {})
}
</script>

<style scoped>
.menu-manage { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 84px); }
.action-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>
