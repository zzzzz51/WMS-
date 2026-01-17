import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'  // ← 新增1：导入
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    basicSsl()  // ← 新增2：添加插件
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    https: true,  // ← 新增3：启用 HTTPS
    proxy: {
      '/api': {
        target: 'http://localhost:9200',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})