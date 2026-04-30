import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 컨테이너 환경에서 외부 접근 허용 (docker-compose dev 실행 시 필요)
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // 로컬 실행 시 localhost:8080, 컨테이너 실행 시 VITE_PROXY_TARGET 환경변수로 오버라이드
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
