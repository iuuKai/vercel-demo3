import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const isBuild = command === 'build'
	const baseURL = env.BASE_URL

	// 仅供演示，且方便以后统一维护，当然你也可以直接设置 base: "/p/demo1"
	if (!baseURL) {
		throw new Error('[vite.config] BASE_URL 是必填的，请在 .env 文件中设置')
	}

	return {
		base: isBuild ? baseURL : '/',
		plugins: [vue()]
	}
})
