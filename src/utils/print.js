/**
 * 打印工具类
 * 支持：表格打印、条码打印、报表打印
 */

// 打印样式
const printStyles = `
  @media print {
    body { font-family: 'Microsoft YaHei', sans-serif; }
    .no-print { display: none !important; }
    .print-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 16px; }
    .print-info { margin-bottom: 12px; font-size: 12px; color: #666; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .print-table th, .print-table td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    .print-table th { background: #f0f0f0; font-weight: bold; }
    .print-footer { margin-top: 20px; font-size: 12px; color: #666; }
    .barcode-container { text-align: center; margin: 20px 0; }
    .barcode-label { margin-top: 8px; font-size: 14px; font-weight: bold; }
  }
`

/**
 * 通用打印方法
 * @param {string} content - HTML内容
 * @param {string} title - 打印标题
 */
export function printHtml(content, title = '打印') {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>${printStyles}</style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); }
        }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * 打印表格数据
 * @param {Object} options - 配置项
 * @param {string} options.title - 标题
 * @param {Array} options.columns - 列配置 [{label, prop, width}]
 * @param {Array} options.data - 数据
 * @param {Object} options.info - 附加信息 {打印时间, 操作人等}
 */
export function printTable({ title, columns, data, info = {} }) {
  const infoHtml = Object.entries(info)
    .map(([key, value]) => `<span>${key}: ${value}</span>`)
    .join(' &nbsp;&nbsp; ')

  const headerHtml = columns
    .map(col => `<th style="width:${col.width || 'auto'}">${col.label}</th>`)
    .join('')

  const bodyHtml = data
    .map(row => {
      const cells = columns.map(col => `<td>${row[col.prop] ?? ''}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const content = `
    <div class="print-title">${title}</div>
    <div class="print-info">${infoHtml}</div>
    <table class="print-table">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
    <div class="print-footer">
      打印时间: ${new Date().toLocaleString()}
    </div>
  `
  printHtml(content, title)
}

/**
 * 打印条码标签
 * @param {Object} options - 配置项
 * @param {string} options.code - 条码内容
 * @param {string} options.name - 物料名称
 * @param {string} options.spec - 规格型号
 * @param {string} options.location - 库位
 * @param {number} options.count - 打印数量
 */
export function printBarcode({ code, name, spec, location, count = 1 }) {
  // 使用 JsBarcode CDN
  const labels = Array(count).fill(null).map(() => `
    <div style="page-break-after: always; padding: 10px; border: 1px dashed #ccc; margin: 10px;">
      <div class="barcode-container">
        <svg id="barcode-${Math.random().toString(36).substr(2, 9)}"></svg>
      </div>
      <div style="text-align: center; font-size: 12px;">
        <div style="font-weight: bold; font-size: 14px;">${name || ''}</div>
        <div>规格: ${spec || '-'}</div>
        <div>库位: ${location || '-'}</div>
        <div class="barcode-label">${code}</div>
      </div>
    </div>
  `).join('')

  const content = `
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    ${labels}
    <script>
      document.querySelectorAll('svg[id^="barcode-"]').forEach(svg => {
        JsBarcode(svg, "${code}", {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false
        });
      });
    </script>
  `
  printHtml(content, `条码-${code}`)
}

/**
 * 打印二维码标签
 * @param {Object} options - 配置项
 */
export function printQRCode({ code, name, spec, location, count = 1 }) {
  const labels = Array(count).fill(null).map(() => `
    <div style="page-break-after: always; padding: 10px; border: 1px dashed #ccc; margin: 10px;">
      <div class="barcode-container">
        <div id="qrcode-${Math.random().toString(36).substr(2, 9)}" style="display:inline-block;"></div>
      </div>
      <div style="text-align: center; font-size: 12px;">
        <div style="font-weight: bold; font-size: 14px;">${name || ''}</div>
        <div>规格: ${spec || '-'}</div>
        <div>库位: ${location || '-'}</div>
        <div class="barcode-label">${code}</div>
      </div>
    </div>
  `).join('')

  const content = `
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    ${labels}
    <script>
      document.querySelectorAll('div[id^="qrcode-"]').forEach(div => {
        new QRCode(div, {
          text: "${code}",
          width: 100,
          height: 100,
          correctLevel: QRCode.CorrectLevel.M
        });
      });
    </script>
  `
  printHtml(content, `二维码-${code}`)
}

/**
 * 打印拣货单
 */
export function printPickList({ orderNo, items, picker, createTime }) {
  const itemsHtml = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.materialCode}</td>
      <td>${item.materialName}</td>
      <td>${item.location}</td>
      <td>${item.quantity}</td>
      <td style="width:60px;"></td>
    </tr>
  `).join('')

  const content = `
    <div class="print-title">拣货单</div>
    <div class="print-info">
      <span>单号: ${orderNo}</span> &nbsp;&nbsp;
      <span>拣货员: ${picker || '-'}</span> &nbsp;&nbsp;
      <span>创建时间: ${createTime}</span>
    </div>
    <table class="print-table">
      <thead>
        <tr>
          <th style="width:40px">序号</th>
          <th style="width:120px">物料编码</th>
          <th>物料名称</th>
          <th style="width:100px">库位</th>
          <th style="width:80px">数量</th>
          <th style="width:60px">确认</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="print-footer">
      <div>拣货员签名: ________________</div>
      <div style="margin-top:10px;">打印时间: ${new Date().toLocaleString()}</div>
    </div>
  `
  printHtml(content, `拣货单-${orderNo}`)
}

/**
 * 打印盘点单
 */
export function printCheckList({ checkNo, warehouse, items, createTime }) {
  const itemsHtml = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.materialCode}</td>
      <td>${item.materialName}</td>
      <td>${item.location}</td>
      <td>${item.systemQty}</td>
      <td style="width:80px;"></td>
      <td style="width:80px;"></td>
    </tr>
  `).join('')

  const content = `
    <div class="print-title">库存盘点单</div>
    <div class="print-info">
      <span>盘点单号: ${checkNo}</span> &nbsp;&nbsp;
      <span>仓库: ${warehouse}</span> &nbsp;&nbsp;
      <span>创建时间: ${createTime}</span>
    </div>
    <table class="print-table">
      <thead>
        <tr>
          <th style="width:40px">序号</th>
          <th style="width:120px">物料编码</th>
          <th>物料名称</th>
          <th style="width:100px">库位</th>
          <th style="width:80px">系统数量</th>
          <th style="width:80px">实盘数量</th>
          <th style="width:80px">差异</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="print-footer">
      <div>盘点人签名: ________________ &nbsp;&nbsp;&nbsp;&nbsp; 复核人签名: ________________</div>
      <div style="margin-top:10px;">打印时间: ${new Date().toLocaleString()}</div>
    </div>
  `
  printHtml(content, `盘点单-${checkNo}`)
}

export default {
  printHtml,
  printTable,
  printBarcode,
  printQRCode,
  printPickList,
  printCheckList
}
