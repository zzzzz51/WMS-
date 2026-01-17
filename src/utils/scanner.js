/**
 * 扫码工具类
 * 支持：扫描枪输入、摄像头扫描
 */

/**
 * 扫描枪监听器
 * 原理：扫描枪会快速连续输入字符，最后以回车结束
 * 通过检测输入速度来区分扫描枪和手动输入
 */
export class ScannerListener {
  constructor(options = {}) {
    this.onScan = options.onScan || (() => {})  // 扫描完成回调
    this.minLength = options.minLength || 4     // 最小条码长度
    this.maxTime = options.maxTime || 100       // 两次按键最大间隔(ms)
    this.endChar = options.endChar || 'Enter'   // 结束字符
    
    this.buffer = ''        // 输入缓冲
    this.lastTime = 0       // 上次输入时间
    this.isListening = false
    
    this._handleKeydown = this._handleKeydown.bind(this)
  }

  /**
   * 开始监听
   */
  start() {
    if (this.isListening) return
    this.isListening = true
    document.addEventListener('keydown', this._handleKeydown)
    console.log('[Scanner] 扫描枪监听已启动')
  }

  /**
   * 停止监听
   */
  stop() {
    if (!this.isListening) return
    this.isListening = false
    document.removeEventListener('keydown', this._handleKeydown)
    console.log('[Scanner] 扫描枪监听已停止')
  }

  /**
   * 处理键盘事件
   */
  _handleKeydown(event) {
    const now = Date.now()
    const key = event.key
    
    // 如果焦点在输入框，且不是快速输入，则不处理
    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
    
    // 检测是否是快速输入（扫描枪特征）
    const isQuickInput = (now - this.lastTime) < this.maxTime
    
    // 结束字符
    if (key === this.endChar) {
      if (this.buffer.length >= this.minLength) {
        // 触发扫描完成
        this.onScan(this.buffer)
        
        // 如果焦点在输入框，阻止回车提交
        if (isInputFocused) {
          event.preventDefault()
        }
      }
      this.buffer = ''
      this.lastTime = 0
      return
    }
    
    // 累积输入
    if (key.length === 1) { // 单个字符
      if (this.buffer === '' || isQuickInput) {
        this.buffer += key
      } else {
        // 输入太慢，重置
        this.buffer = key
      }
      this.lastTime = now
    }
  }
}

/**
 * 摄像头扫码器
 * 依赖：html5-qrcode 库
 * CDN: https://unpkg.com/html5-qrcode
 */
export class CameraScanner {
  constructor(elementId, options = {}) {
    this.elementId = elementId
    this.onScan = options.onScan || (() => {})
    this.onError = options.onError || (() => {})
    this.scanner = null
    this.isScanning = false
  }

  /**
   * 初始化扫描器
   */
  async init() {
    // 动态加载 html5-qrcode
    if (!window.Html5Qrcode) {
      await this._loadScript('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js')
    }
    
    this.scanner = new window.Html5Qrcode(this.elementId)
    return this
  }

  /**
   * 动态加载脚本
   */
  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  /**
   * 获取可用摄像头列表
   */
  async getCameras() {
    if (!window.Html5Qrcode) {
      await this.init()
    }
    return await window.Html5Qrcode.getCameras()
  }

  /**
   * 开始扫描
   * @param {string} cameraId - 摄像头ID，不传则使用默认后置摄像头
   */
  async start(cameraId = null) {
    if (this.isScanning) return
    
    if (!this.scanner) {
      await this.init()
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }

    try {
      if (cameraId) {
        await this.scanner.start(cameraId, config, this._onScanSuccess.bind(this), this._onScanError.bind(this))
      } else {
        // 优先使用后置摄像头
        await this.scanner.start({ facingMode: 'environment' }, config, this._onScanSuccess.bind(this), this._onScanError.bind(this))
      }
      this.isScanning = true
      console.log('[CameraScanner] 摄像头扫描已启动')
    } catch (err) {
      console.error('[CameraScanner] 启动失败:', err)
      this.onError(err)
    }
  }

  /**
   * 停止扫描
   */
  async stop() {
    if (!this.isScanning || !this.scanner) return
    
    try {
      await this.scanner.stop()
      this.isScanning = false
      console.log('[CameraScanner] 摄像头扫描已停止')
    } catch (err) {
      console.error('[CameraScanner] 停止失败:', err)
    }
  }

  /**
   * 扫描成功回调
   */
  _onScanSuccess(decodedText, decodedResult) {
    console.log('[CameraScanner] 扫描成功:', decodedText)
    this.onScan(decodedText, decodedResult)
  }

  /**
   * 扫描错误回调（扫描过程中的错误，如无法识别）
   */
  _onScanError(errorMessage) {
    // 忽略正常的"未检测到条码"错误
    if (!errorMessage.includes('No MultiFormat Readers')) {
      console.warn('[CameraScanner] 扫描提示:', errorMessage)
    }
  }

  /**
   * 销毁扫描器
   */
  destroy() {
    this.stop()
    this.scanner = null
  }
}

/**
 * 简单的输入框扫描组件
 * 监听输入框的回车事件，适用于扫描枪直接输入到输入框的场景
 */
export function useScanInput(inputRef, callback) {
  let lastInputTime = 0
  let inputBuffer = ''
  
  const handleInput = (e) => {
    const now = Date.now()
    const value = e.target.value
    
    // 如果输入很快（扫描枪特征），累积到buffer
    if (now - lastInputTime < 50) {
      inputBuffer = value
    } else {
      inputBuffer = value
    }
    lastInputTime = now
  }
  
  const handleKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const code = e.target.value.trim()
      if (code) {
        callback(code)
        e.target.value = ''
        inputBuffer = ''
      }
    }
  }
  
  // 返回事件绑定对象
  return {
    onInput: handleInput,
    onKeydown: handleKeydown
  }
}

export default {
  ScannerListener,
  CameraScanner,
  useScanInput
}
