import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// 导入模块化的构建工具函数
import getMultiPageEntries from './plugins/getMultiPageEntries'
import copyAssetsPlugin from './plugins/copyAssetsPlugin'
import htmlBasePathPlugin from './plugins/htmlBasePathPlugin'

export default defineConfig(({ command, mode }) => {
	// 加载环境变量（空前缀表示加载所有）
	const env = loadEnv(mode, process.cwd(), '')
	const isBuild = command === 'build'
	const baseURL = env.BASE_URL
	const ignoreSingleSlash = env.IGNORE_SINGLE_SLASH === 'true'

	if (!baseURL) {
		throw new Error('[vite.config] BASE_URL 是必填的，请在 .env 文件中设置')
	}

	return {
		root: 'src', // 根目录, 用于查找入口文件
		base: isBuild ? baseURL : '/',
		publicDir: path.resolve(__dirname, 'public'), // public 目录位置，文件会直接复制到 dist 根目录
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
				'@assets': path.resolve(__dirname, 'src/assets'),
				'@css': path.resolve(__dirname, 'src/assets/css'),
				'@js': path.resolve(__dirname, 'src/assets/js'),
				'@images': path.resolve(__dirname, 'src/assets/images')
			}
		},
		plugins: [
			isBuild && htmlBasePathPlugin(baseURL, ignoreSingleSlash),
			isBuild &&
				copyAssetsPlugin(
					path.resolve(__dirname, 'src/assets'),
					path.resolve(__dirname, 'dist/assets'),
					baseURL
				)
		],
		build: {
			outDir: path.resolve(__dirname, 'dist'),
			emptyOutDir: true,
			rollupOptions: {
				input: getMultiPageEntries(),
				output: {
					chunkFileNames: 'assets/js/[name]-[hash].js',
					entryFileNames: 'assets/js/[name]-[hash].js',
					assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
				}
			}
		}
	}
})
