/**
 * 文件上传工具类
 * 支持：单文件/多文件上传、图片预览、文件类型校验
 */

/**
 * 文件类型配置
 */
export const FILE_TYPES = {
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: '图片'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    label: '文档'
  },
  excel: {
    accept: '.xls,.xlsx,.csv',
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    label: 'Excel文件'
  },
  all: {
    accept: '*',
    mimeTypes: [],
    maxSize: 50 * 1024 * 1024, // 50MB
    label: '文件'
  }
}

/**
 * 校验文件
 * @param {File} file - 文件对象
 * @param {Object} options - 配置项
 * @returns {Object} {valid: boolean, message: string}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024,
    accept = '*',
    mimeTypes = []
  } = options

  // 检查文件大小
  if (file.size > maxSize) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(0)
    return { valid: false, message: `文件大小不能超过 ${sizeMB}MB` }
  }

  // 检查文件类型
  if (accept !== '*') {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const acceptExts = accept.split(',').map(e => e.trim().toLowerCase())
    
    if (!acceptExts.includes(ext)) {
      return { valid: false, message: `只支持 ${accept} 格式的文件` }
    }
  }

  // 检查MIME类型
  if (mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
    return { valid: false, message: '文件类型不正确' }
  }

  return { valid: true, message: '' }
}

/**
 * 获取文件预览URL
 * @param {File} file - 文件对象
 * @returns {string} 预览URL
 */
export function getFilePreviewUrl(file) {
  return URL.createObjectURL(file)
}

/**
 * 释放文件预览URL
 * @param {string} url - 预览URL
 */
export function revokeFilePreviewUrl(url) {
  URL.revokeObjectURL(url)
}

/**
 * 文件转Base64
 * @param {File} file - 文件对象
 * @returns {Promise<string>} Base64字符串
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Base64转Blob
 * @param {string} base64 - Base64字符串
 * @param {string} mimeType - MIME类型
 * @returns {Blob}
 */
export function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  const byteCharacters = atob(base64.split(',')[1])
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件图标
 * @param {string} fileName - 文件名
 * @returns {string} 图标名称
 */
export function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: 'Document',
    doc: 'Document',
    docx: 'Document',
    xls: 'Grid',
    xlsx: 'Grid',
    csv: 'Grid',
    ppt: 'Present',
    pptx: 'Present',
    txt: 'Tickets',
    zip: 'Files',
    rar: 'Files',
    jpg: 'Picture',
    jpeg: 'Picture',
    png: 'Picture',
    gif: 'Picture',
    mp4: 'VideoCamera',
    mp3: 'Headset'
  }
  return iconMap[ext] || 'Document'
}

/**
 * 模拟上传文件到服务器
 * @param {File} file - 文件对象
 * @param {Object} options - 配置项
 * @returns {Promise<Object>} 上传结果
 */
export function uploadFile(file, options = {}) {
  const {
    url = '/api/upload',
    fieldName = 'file',
    extraData = {},
    onProgress = () => {}
  } = options

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append(fieldName, file)
    
    // 添加额外数据
    Object.entries(extraData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const xhr = new XMLHttpRequest()
    
    // 上传进度
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch {
          resolve({ success: true, url: URL.createObjectURL(file), name: file.name })
        }
      } else {
        reject(new Error(`上传失败: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('网络错误'))

    xhr.open('POST', url)
    xhr.send(formData)
  })
}

/**
 * 模拟文件上传（本地演示用）
 * @param {File} file - 文件对象
 * @returns {Promise<Object>} 模拟上传结果
 */
export function mockUploadFile(file) {
  return new Promise((resolve) => {
    // 模拟上传延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          id: Date.now(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadTime: new Date().toISOString()
        }
      })
    }, 500 + Math.random() * 1000)
  })
}

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} fileName - 文件名
 */
export function downloadFile(url, fileName) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default {
  FILE_TYPES,
  validateFile,
  getFilePreviewUrl,
  revokeFilePreviewUrl,
  fileToBase64,
  base64ToBlob,
  formatFileSize,
  getFileIcon,
  uploadFile,
  mockUploadFile,
  downloadFile
}
