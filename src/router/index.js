import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页看板', icon: 'HomeFilled' }
      },
      
      // ========== 物料管理 ==========
      {
        path: 'material',
        name: 'Material',
        meta: { title: '物料管理', icon: 'Box' },
        children: [
          {
            path: 'manage',
            name: 'MaterialManage',
            component: () => import('@/views/material/MaterialManage.vue'),
            meta: { title: '物料信息管理' }
          },
          {
            path: 'transfer',
            name: 'MaterialTransfer',
            component: () => import('@/views/material/TransferManage.vue'),
            meta: { title: '调拨管理' }
          },
          {
            path: 'exchange',
            name: 'MaterialExchange',
            component: () => import('@/views/material/ExchangeManage.vue'),
            meta: { title: '以物换物' }
          },
          {
            path: 'borrow',
            name: 'MaterialBorrow',
            component: () => import('@/views/material/BorrowManage.vue'),
            meta: { title: '借用管理' }
          },
          {
            path: 'scrap',
            name: 'MaterialScrap',
            component: () => import('@/views/material/ScrapManage.vue'),
            meta: { title: '报废管理' }
          },
          {
            path: 'repair',
            name: 'MaterialRepair',
            component: () => import('@/views/material/RepairManage.vue'),
            meta: { title: '维修管理' }
          }
        ]
      },

      // ========== 入库管理 ==========
      {
        path: 'inbound',
        name: 'Inbound',
        meta: { title: '入库管理', icon: 'Download' },
        children: [
          // 送货接收
          {
            path: 'delivery-list',
            name: 'DeliveryList',
            component: () => import('@/views/inbound/DeliveryList.vue'),
            meta: { title: '待接收清单' }
          },
          {
            path: 'delivery-dispatch',
            name: 'DeliveryDispatch',
            component: () => import('@/views/inbound/DeliveryDispatch.vue'),
            meta: { title: '送货分流' }
          },
          {
            path: 'delivery-record',
            name: 'DeliveryRecord',
            component: () => import('@/views/inbound/DeliveryRecord.vue'),
            meta: { title: '接收记录' }
          },
          
          // 收货上架
          {
            path: 'receive-task',
            name: 'ReceiveTask',
            component: () => import('@/views/inbound/ReceiveTask.vue'),
            meta: { title: '待收货任务' }
          },
          {
            path: 'receive-work',
            name: 'ReceiveWork',
            component: () => import('@/views/inbound/ReceiveWork.vue'),
            meta: { title: '收货作业' }
          },
          {
            path: 'putaway-task',
            name: 'PutawayTask',
            component: () => import('@/views/inbound/PutawayTask.vue'),
            meta: { title: '待上架任务' }
          },
          {
            path: 'putaway-work',
            name: 'PutawayWork',
            component: () => import('@/views/inbound/PutawayWork.vue'),
            meta: { title: '上架作业' }
          },
          {
            path: 'putaway-record',
            name: 'PutawayRecord',
            component: () => import('@/views/inbound/PutawayRecord.vue'),
            meta: { title: '上架记录' }
          },
          
          // 杂项入库
          {
            path: 'misc',
            name: 'MiscInbound',
            component: () => import('@/views/inbound/MiscInbound.vue'),
            meta: { title: '杂项入库单' }
          },
          {
            path: 'misc-execute',
            name: 'MiscExecute',
            component: () => import('@/views/inbound/MiscExecute.vue'),
            meta: { title: '杂项入库执行' }
          },
          {
            path: 'misc-record',
            name: 'MiscRecord',
            component: () => import('@/views/inbound/MiscRecord.vue'),
            meta: { title: '杂项入库记录' }
          },
          
          // 退库入库
          {
            path: 'return-in',
            name: 'ReturnManage',
            component: () => import('@/views/inbound/ReturnManage.vue'),
            meta: { title: '退库单管理' }
          }
        ]
      },

      // ========== 出库管理 ==========
      {
        path: 'outbound',
        name: 'Outbound',
        meta: { title: '出库管理', icon: 'Upload' },
        children: [
          // 领用发料
          {
            path: 'requisition-list',
            name: 'RequisitionList',
            component: () => import('@/views/outbound/RequisitionList.vue'),
            meta: { title: '待发料清单' }
          },
          {
            path: 'picking-work',
            name: 'PickingWork',
            component: () => import('@/views/outbound/requisition.vue'),
            meta: { title: '发料作业' }
          },
          {
            path: 'picking-record',
            name: 'PickingRecord',
            component: () => import('@/views/outbound/PickingRecord.vue'),
            meta: { title: '发料记录' }
          },
          
          // 退料管理
          {
            path: 'return-order',
            name: 'ReturnOrder',
            component: () => import('@/views/outbound/ReturnOrder.vue'),
            meta: { title: '退料单管理' }
          },
          {
            path: 'return-execute',
            name: 'ReturnExecute',
            component: () => import('@/views/outbound/ReturnExecute.vue'),
            meta: { title: '退料接收' }
          },
          {
            path: 'return-record',
            name: 'ReturnRecord',
            component: () => import('@/views/outbound/ReturnRecord.vue'),
            meta: { title: '退料记录' }
          }
        ]
      },

      // ========== 移库管理 ==========
      {
        path: 'transfer',
        name: 'Transfer',
        meta: { title: '移库管理', icon: 'Sort' },
        children: [
          // 移拨单
          {
            path: 'order',
            name: 'TransferOrder',
            component: () => import('@/views/transfer/TransferOrder.vue'),
            meta: { title: '移拨单管理' }
          },
          {
            path: 'execute',
            name: 'TransferExecute',
            component: () => import('@/views/transfer/TransferExecute.vue'),
            meta: { title: '移拨执行' }
          },
          {
            path: 'record',
            name: 'TransferRecord',
            component: () => import('@/views/transfer/TransferRecord.vue'),
            meta: { title: '移拨记录' }
          },
          
          // 以物换物
          {
            path: 'exchange-order',
            name: 'ExchangeOrder',
            component: () => import('@/views/transfer/ExchangeOrder.vue'),
            meta: { title: '以物换物单' }
          },
          {
            path: 'exchange-execute',
            name: 'ExchangeExecute',
            component: () => import('@/views/transfer/ExchangeExecute.vue'),
            meta: { title: '换物执行' }
          },
          
          // 储位调整
          {
            path: 'location-adjust',
            name: 'LocationAdjust',
            component: () => import('@/views/transfer/LocationAdjust.vue'),
            meta: { title: '储位调整' }
          },
          {
            path: 'location-record',
            name: 'LocationRecord',
            component: () => import('@/views/transfer/LocationRecord.vue'),
            meta: { title: '储位调整记录' }
          }
        ]
      },

      // ========== 盘点管理 ==========
      {
        path: 'count',
        name: 'Count',
        meta: { title: '盘点管理', icon: 'DocumentChecked' },
        children: [
          {
            path: 'plan',
            name: 'CountPlan',
            component: () => import('@/views/count/CountPlan.vue'),
            meta: { title: '盘点计划' }
          },
          {
            path: 'task',
            name: 'CountTask',
            component: () => import('@/views/count/CountTask.vue'),
            meta: { title: '盘点任务' }
          },
          {
            path: 'work',
            name: 'CountWork',
            component: () => import('@/views/pda/PdaCount.vue'),
            meta: { title: '盘点作业' }
          },
          {
            path: 'diff',
            name: 'CountDiff',
            component: () => import('@/views/count/CountDiff.vue'),
            meta: { title: '差异处理' }
          },
          {
            path: 'record',
            name: 'CountRecord',
            component: () => import('@/views/count/CountRecord.vue'),
            meta: { title: '盘点记录' }
          }
        ]
      },

      // ========== 库存管理 ==========
      {
        path: 'inventory',
        name: 'Inventory',
        meta: { title: '库存管理', icon: 'Tickets' },
        children: [
          {
            path: 'list',
            name: 'InventoryList',
            component: () => import('@/views/inventory/list.vue'),
            meta: { title: '库存查询' }
          },
          {
            path: 'flow',
            name: 'InventoryFlow',
            component: () => import('@/views/inventory/flow.vue'),
            meta: { title: '库存流水' }
          },
          {
            path: 'batch',
            name: 'BatchManage',
            component: () => import('@/views/inventory/BatchManage.vue'),
            meta: { title: '批次管理' }
          },
          {
            path: 'warning',
            name: 'StockWarning',
            component: () => import('@/views/inventory/StockWarning.vue'),
            meta: { title: '库存预警' }
          }
        ]
      },

      // ========== 数据分析 ==========
      {
        path: 'analysis',
        name: 'Analysis',
        meta: { title: '数据分析', icon: 'DataAnalysis' },
        children: [
          {
            path: 'abc',
            name: 'ABCAnalysis',
            component: () => import('@/views/analysis/ABCAnalysis.vue'),
            meta: { title: 'ABC分类分析' }
          },
          {
            path: 'turnover',
            name: 'TurnoverAnalysis',
            component: () => import('@/views/analysis/TurnoverAnalysis.vue'),
            meta: { title: '周转率分析' }
          },
          {
            path: 'age',
            name: 'AgeAnalysis',
            component: () => import('@/views/analysis/AgeAnalysis.vue'),
            meta: { title: '库龄分析' }
          },
          {
            path: 'stagnant',
            name: 'StagnantAnalysis',
            component: () => import('@/views/analysis/StagnantAnalysis.vue'),
            meta: { title: '呆滞物分析' }
          },
          {
            path: 'safety-stock',
            name: 'SafetyStockAnalysis',
            component: () => import('@/views/analysis/SafetyStockAnalysis.vue'),
            meta: { title: '安全库存分析' }
          },
          {
            path: 'requisition-rate',
            name: 'RequisitionRate',
            component: () => import('@/views/analysis/RequisitionRate.vue'),
            meta: { title: '领用及时率' }
          },
          {
            path: 'receive-rate',
            name: 'ReceiveRate',
            component: () => import('@/views/analysis/ReceiveRate.vue'),
            meta: { title: '收货及时率' }
          },
          {
            path: 'inventory-accuracy',
            name: 'InventoryAccuracy',
            component: () => import('@/views/analysis/InventoryAccuracy.vue'),
            meta: { title: '库存准确率' }
          }
        ]
      },

      // ========== 报表统计 ==========
      {
        path: 'report',
        name: 'Report',
        meta: { title: '报表统计', icon: 'Document' },
        children: [
          {
            path: 'inventory',
            name: 'InventoryReport',
            component: () => import('@/views/report/InventoryReport.vue'),
            meta: { title: '库存报表' }
          },
          {
            path: 'in-out',
            name: 'InOutReport',
            component: () => import('@/views/report/InOutReport.vue'),
            meta: { title: '出入库报表' }
          },
          {
            path: 'metrics',
            name: 'MetricsAnalysis',
            component: () => import('@/views/report/MetricsAnalysis.vue'),
            meta: { title: '指标总览' }
          }
        ]
      },

      // ========== 条码管理 ==========
      {
        path: 'barcode',
        name: 'Barcode',
        meta: { title: '条码管理', icon: 'Histogram' },
        children: [
          {
            path: 'manage',
            name: 'BarcodeManage',
            component: () => import('@/views/barcode/BarcodeManage.vue'),
            meta: { title: '条码管理' }
          }
        ]
      },

      // ========== 基础数据 ==========
      {
        path: 'basedata',
        name: 'BaseData',
        meta: { title: '基础数据', icon: 'Management' },
        children: [
          {
            path: 'warehouse',
            name: 'WarehouseManage',
            component: () => import('@/views/basedata/warehouseManage.vue'),
            meta: { title: '仓库管理' }
          },
          {
            path: 'location',
            name: 'LocationManage',
            component: () => import('@/views/basedata/locationManage.vue'),
            meta: { title: '储位管理' }
          },
          {
            path: 'material',
            name: 'MaterialData',
            component: () => import('@/views/basedata/MaterialManage.vue'),
            meta: { title: '物料管理' }
          },
          {
            path: 'supplier',
            name: 'SupplierManage',
            component: () => import('@/views/basedata/supplierManage.vue'),
            meta: { title: '供应商管理' }
          }
        ]
      },

      // ========== 系统管理 ==========
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user',
            name: 'UserManage',
            component: () => import('@/views/system/user.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'role',
            name: 'RoleManage',
            component: () => import('@/views/system/role.vue'),
            meta: { title: '角色管理' }
          },
          {
            path: 'menu',
            name: 'MenuManage',
            component: () => import('@/views/system/MenuManage.vue'),
            meta: { title: '菜单管理' }
          },
          {
            path: 'dict',
            name: 'DictManage',
            component: () => import('@/views/system/DictManage.vue'),
            meta: { title: '字典管理' }
          },
          {
            path: 'log',
            name: 'OperationLog',
            component: () => import('@/views/system/OperationLog.vue'),
            meta: { title: '操作日志' }
          },
          {
            path: 'erp-config',
            name: 'ErpConfig',
            component: () => import('@/views/system/ErpConfig.vue'),
            meta: { title: 'ERP接口配置' }
          }
        ]
      }
    ]
  },

  // ========== PDA终端（独立路由） ==========
  {
    path: '/pda',
    component: () => import('@/views/pda/PdaLayout.vue'),
    redirect: '/pda/home',
    children: [
      {
        path: 'home',
        name: 'PdaHome',
        component: () => import('@/views/pda/PdaHome.vue'),
        meta: { title: 'PDA首页' }
      },
      {
        path: 'receive',
        name: 'PdaReceive',
        component: () => import('@/views/pda/PdaReceive.vue'),
        meta: { title: '收货' }
      },
      {
        path: 'putaway',
        name: 'PdaPutaway',
        component: () => import('@/views/pda/PdaPutaway.vue'),
        meta: { title: '上架' }
      },
      {
        path: 'picking',
        name: 'PdaPicking',
        component: () => import('@/views/pda/PdaPicking.vue'),
        meta: { title: '发料' }
      },
      {
        path: 'return',
        name: 'PdaReturn',
        component: () => import('@/views/pda/PdaReturn.vue'),
        meta: { title: '退料接收' }
      },
      {
        path: 'transfer',
        name: 'PdaTransfer',
        component: () => import('@/views/pda/PdaTransfer.vue'),
        meta: { title: '移库' }
      },
      {
        path: 'location',
        name: 'PdaLocation',
        component: () => import('@/views/pda/PdaLocation.vue'),
        meta: { title: '储位调整' }
      },
      {
        path: 'count',
        name: 'PdaCount',
        component: () => import('@/views/pda/PdaCount.vue'),
        meta: { title: '盘点' }
      },
      {
        path: 'query',
        name: 'PdaQuery',
        component: () => import('@/views/pda/PdaQuery.vue'),
        meta: { title: '库存查询' }
      }
    ]
  },

  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - WMS` : 'WMS仓库管理系统'
  
  // 登录验证
  const token = localStorage.getItem('token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else if (token && to.path === '/login') {
    next('/')
  } else {
    next()
  }
})

export default router
