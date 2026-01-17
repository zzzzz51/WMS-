/**
 * WMS 菜单配置
 * 与 router/index.js 完全匹配
 */
export const menuList = [
  {
    path: '/dashboard',
    title: '首页看板',
    icon: 'Monitor'
  },
  {
    path: '/material',
    title: '物料管理',
    icon: 'Box',
    children: [
      { path: '/material/manage', title: '物料信息管理' },
      { path: '/material/transfer', title: '调拨管理' },
      { path: '/material/exchange', title: '以物换物' },
      { path: '/material/borrow', title: '借用管理' },
      { path: '/material/scrap', title: '报废管理' },
      { path: '/material/repair', title: '维修管理' }
    ]
  },
  {
    path: '/inbound',
    title: '入库管理',
    icon: 'Download',
    children: [
      {
        title: '送货接收',
        children: [
          { path: '/inbound/delivery-list', title: '待接收清单' },
          { path: '/inbound/delivery-dispatch', title: '送货分流' },
          { path: '/inbound/delivery-record', title: '接收记录' }
        ]
      },
      {
        title: '收货上架',
        children: [
          { path: '/inbound/receive-task', title: '待收货任务' },
          { path: '/inbound/receive-work', title: '收货作业' },
          { path: '/inbound/putaway-task', title: '待上架任务' },
          { path: '/inbound/putaway-work', title: '上架作业' },
          { path: '/inbound/putaway-record', title: '上架记录' }
        ]
      },
      {
        title: '杂项入库',
        children: [
          { path: '/inbound/misc', title: '杂项入库单' },
          { path: '/inbound/misc-execute', title: '杂项入库执行' },
          { path: '/inbound/misc-record', title: '杂项入库记录' }
        ]
      },
      {
        title: '退库入库',
        children: [
          { path: '/inbound/return-in', title: '退库单管理' }
        ]
      }
    ]
  },
  {
    path: '/outbound',
    title: '出库管理',
    icon: 'Upload',
    children: [
      {
        title: '领用发料',
        children: [
          { path: '/outbound/requisition-list', title: '待发料清单' },
          { path: '/outbound/picking-work', title: '发料作业' },
          { path: '/outbound/picking-record', title: '发料记录' }
        ]
      },
      {
        title: '退料管理',
        children: [
          { path: '/outbound/return-order', title: '退料单管理' },
          { path: '/outbound/return-execute', title: '退料接收' },
          { path: '/outbound/return-record', title: '退料记录' }
        ]
      }
    ]
  },
  {
    path: '/transfer',
    title: '移库管理',
    icon: 'Switch',
    children: [
      {
        title: '移拨管理',
        children: [
          { path: '/transfer/order', title: '移拨单管理' },
          { path: '/transfer/execute', title: '移拨执行' },
          { path: '/transfer/record', title: '移拨记录' }
        ]
      },
      {
        title: '以物换物',
        children: [
          { path: '/transfer/exchange-order', title: '以物换物单' },
          { path: '/transfer/exchange-execute', title: '换物执行' }
        ]
      },
      {
        title: '储位调整',
        children: [
          { path: '/transfer/location-adjust', title: '储位调整' },
          { path: '/transfer/location-record', title: '储位调整记录' }
        ]
      }
    ]
  },
  {
    path: '/count',
    title: '盘点管理',
    icon: 'Document',
    children: [
      { path: '/count/plan', title: '盘点计划' },
      { path: '/count/task', title: '盘点任务' },
      { path: '/count/work', title: '盘点作业' },
      { path: '/count/diff', title: '差异处理' },
      { path: '/count/record', title: '盘点记录' }
    ]
  },
  {
    path: '/inventory',
    title: '库存管理',
    icon: 'DataLine',
    children: [
      { path: '/inventory/list', title: '库存查询' },
      { path: '/inventory/flow', title: '库存流水' },
      { path: '/inventory/batch', title: '批次管理' },
      { path: '/inventory/warning', title: '库存预警' }
    ]
  },
  {
    path: '/analysis',
    title: '数据分析',
    icon: 'PieChart',
    children: [
      { path: '/analysis/abc', title: 'ABC分类分析' },
      { path: '/analysis/turnover', title: '周转率分析' },
      { path: '/analysis/age', title: '库龄分析' },
      { path: '/analysis/stagnant', title: '呆滞物分析' },
      { path: '/analysis/safety-stock', title: '安全库存分析' },
      { path: '/analysis/requisition-rate', title: '领用及时率' },
      { path: '/analysis/receive-rate', title: '收货及时率' },
      { path: '/analysis/inventory-accuracy', title: '库存准确率' }
    ]
  },
  {
    path: '/report',
    title: '报表统计',
    icon: 'DataAnalysis',
    children: [
      { path: '/report/inventory', title: '库存报表' },
      { path: '/report/in-out', title: '出入库报表' },
      { path: '/report/metrics', title: '指标总览' }
    ]
  },
  {
    path: '/barcode',
    title: '条码管理',
    icon: 'Ticket',
    children: [
      { path: '/barcode/manage', title: '条码管理' }
    ]
  },
  {
    path: '/basedata',
    title: '基础数据',
    icon: 'Files',
    children: [
      { path: '/basedata/warehouse', title: '仓库管理' },
      { path: '/basedata/location', title: '储位管理' },
      { path: '/basedata/material', title: '物料管理' },
      { path: '/basedata/supplier', title: '供应商管理' }
    ]
  },
  {
    path: '/system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      { path: '/system/user', title: '用户管理' },
      { path: '/system/role', title: '角色管理' },
      { path: '/system/menu', title: '菜单管理' },
      { path: '/system/dict', title: '字典管理' },
      { path: '/system/log', title: '操作日志' },
      { path: '/system/erp-config', title: 'ERP接口配置' }
    ]
  }
]

export default menuList
