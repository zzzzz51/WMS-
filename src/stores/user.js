import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: { username: 'admin', nickname: '管理员' },
    roles: ['admin'],
    permissions: ['*']
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    nickname: (state) => state.userInfo?.nickname || ''
  },

  actions: {
    // 登录 - 演示模式
    async login(loginForm) {
      if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        this.token = 'demo-token-12345'
        this.userInfo = { username: 'admin', nickname: '管理员' }
        localStorage.setItem('token', this.token)
        return { code: 200 }
      }
      throw new Error('用户名或密码错误')
    },

    // 获取用户信息
    async getUserInfo() {
      return { data: this.userInfo }
    },

    // 登出
    async logout() {
      this.resetState()
    },

    // 重置状态
    resetState() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      localStorage.removeItem('token')
    }
  }
})
