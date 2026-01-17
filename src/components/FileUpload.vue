<template>
  <div class="file-upload-component">
    <!-- 上传区域 -->
    <el-upload ref="uploadRef" :action="action" :multiple="multiple" :limit="limit"
      :accept="acceptTypes" :file-list="fileList" :auto-upload="autoUpload"
      :on-exceed="handleExceed" :on-change="handleChange" :on-remove="handleRemove"
      :on-success="handleSuccess" :on-error="handleError" :before-upload="beforeUpload"
      :http-request="customUpload" :disabled="disabled" :drag="drag"
      :list-type="listType" :class="{ 'hide-upload': hideUploadBtn }">
      
      <!-- 拖拽上传 -->
      <template v-if="drag">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或 <em>点击上传</em>
        </div>
        <div class="el-upload__tip" v-if="tip">{{ tip }}</div>
      </template>
      
      <!-- 普通按钮上传 -->
      <template v-else-if="listType === 'text'">
        <el-button type="primary" :disabled="disabled">
          <el-icon><Upload /></el-icon> {{ buttonText }}
        </el-button>
        <template #tip>
          <div class="el-upload__tip" v-if="tip">{{ tip }}</div>
        </template>
      </template>
      
      <!-- 图片卡片上传 -->
      <template v-else-if="listType === 'picture-card'">
        <el-icon><Plus /></el-icon>
      </template>
    </el-upload>

    <!-- 文件列表（自定义样式） -->
    <div class="custom-file-list" v-if="showCustomList && fileList.length > 0">
      <div class="file-item" v-for="(file, index) in fileList" :key="file.uid || index">
        <div class="file-info">
          <el-icon class="file-icon" :size="20">
            <component :is="getFileIcon(file.name)" />
          </el-icon>
          <span class="file-name" :title="file.name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
        </div>
        <div class="file-actions">
          <el-button type="primary" link size="small" @click="handlePreview(file)" v-if="canPreview(file)">
            预览
          </el-button>
          <el-button type="primary" link size="small" @click="handleDownload(file)">
            下载
          </el-button>
          <el-button type="danger" link size="small" @click="handleRemoveFile(index)" v-if="!disabled">
            删除
          </el-button>
        </div>
        <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage" :stroke-width="3" />
      </div>
    </div>

    <!-- 图片预览 -->
    <el-dialog v-model="previewVisible" title="预览" width="800px">
      <img :src="previewUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled, Plus, Document, Picture, VideoCamera, Headset, Grid, Files } from '@element-plus/icons-vue'

const props = defineProps({
  // v-model绑定值（文件URL数组或对象数组）
  modelValue: { type: Array, default: () => [] },
  // 上传地址
  action: { type: String, default: '#' },
  // 是否多选
  multiple: { type: Boolean, default: false },
  // 最大文件数
  limit: { type: Number, default: 5 },
  // 接受的文件类型
  accept: { type: String, default: '' }, // image, document, excel, all
  // 最大文件大小(MB)
  maxSize: { type: Number, default: 10 },
  // 是否自动上传
  autoUpload: { type: Boolean, default: true },
  // 是否禁用
  disabled: { type: Boolean, default: false },
  // 是否拖拽上传
  drag: { type: Boolean, default: false },
  // 列表类型 text/picture/picture-card
  listType: { type: String, default: 'text' },
  // 按钮文字
  buttonText: { type: String, default: '上传文件' },
  // 提示文字
  tip: { type: String, default: '' },
  // 是否显示自定义文件列表
  showCustomList: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change', 'success', 'error'])

const uploadRef = ref(null)
const fileList = ref([])
const previewVisible = ref(false)
const previewUrl = ref('')

// 文件类型配置
const fileTypeConfig = {
  image: { accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp', label: '图片' },
  document: { accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt', label: '文档' },
  excel: { accept: '.xls,.xlsx,.csv', label: 'Excel文件' },
  all: { accept: '*', label: '文件' }
}

const acceptTypes = computed(() => {
  if (props.accept && fileTypeConfig[props.accept]) {
    return fileTypeConfig[props.accept].accept
  }
  return props.accept || '*'
})

const hideUploadBtn = computed(() => {
  return props.limit && fileList.value.length >= props.limit
})

// 监听modelValue变化
watch(() => props.modelValue, (val) => {
  if (val && val.length > 0) {
    fileList.value = val.map((item, index) => {
      if (typeof item === 'string') {
        return { uid: index, name: item.split('/').pop(), url: item, status: 'success' }
      }
      return { ...item, status: 'success' }
    })
  } else {
    fileList.value = []
  }
}, { immediate: true })

// 上传前校验
const beforeUpload = (file) => {
  // 校验文件大小
  const maxBytes = props.maxSize * 1024 * 1024
  if (file.size > maxBytes) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  // 校验文件类型
  if (acceptTypes.value !== '*') {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    const accepts = acceptTypes.value.split(',').map(e => e.trim().toLowerCase())
    if (!accepts.includes(ext)) {
      ElMessage.error(`只支持 ${acceptTypes.value} 格式的文件`)
      return false
    }
  }
  
  return true
}

// 自定义上传（模拟）
const customUpload = ({ file, onProgress, onSuccess, onError }) => {
  // 模拟上传进度
  let progress = 0
  const timer = setInterval(() => {
    progress += 10
    onProgress({ percent: progress })
    
    if (progress >= 100) {
      clearInterval(timer)
      // 模拟上传成功
      setTimeout(() => {
        onSuccess({
          success: true,
          data: {
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size
          }
        })
      }, 200)
    }
  }, 100)
}

// 文件变化
const handleChange = (file, files) => {
  fileList.value = files
  emit('change', files)
  updateModelValue()
}

// 文件移除
const handleRemove = (file, files) => {
  fileList.value = files
  updateModelValue()
}

// 手动移除文件
const handleRemoveFile = (index) => {
  fileList.value.splice(index, 1)
  updateModelValue()
}

// 上传成功
const handleSuccess = (response, file, files) => {
  file.url = response.data?.url || URL.createObjectURL(file.raw)
  ElMessage.success('上传成功')
  emit('success', response, file)
  updateModelValue()
}

// 上传失败
const handleError = (err, file) => {
  ElMessage.error('上传失败')
  emit('error', err, file)
}

// 超出限制
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

// 更新v-model
const updateModelValue = () => {
  const value = fileList.value
    .filter(f => f.status === 'success' || f.url)
    .map(f => ({
      name: f.name,
      url: f.url || f.response?.data?.url,
      size: f.size
    }))
  emit('update:modelValue', value)
}

// 预览
const handlePreview = (file) => {
  previewUrl.value = file.url
  previewVisible.value = true
}

// 下载
const handleDownload = (file) => {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  link.click()
}

// 是否可预览
const canPreview = (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

// 获取文件图标
const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: Document, doc: Document, docx: Document, txt: Document,
    xls: Grid, xlsx: Grid, csv: Grid,
    jpg: Picture, jpeg: Picture, png: Picture, gif: Picture,
    mp4: VideoCamera, mp3: Headset,
    zip: Files, rar: Files
  }
  return iconMap[ext] || Document
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// 手动上传
const submit = () => {
  uploadRef.value?.submit()
}

// 清空文件列表
const clearFiles = () => {
  uploadRef.value?.clearFiles()
  fileList.value = []
  updateModelValue()
}

defineExpose({ submit, clearFiles })
</script>

<style scoped>
.file-upload-component {
  width: 100%;
}

.hide-upload :deep(.el-upload) {
  display: none;
}

.custom-file-list {
  margin-top: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-icon {
  color: #409eff;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.file-actions {
  display: flex;
  gap: 8px;
}
</style>
