const path = require('path')
const fs = require('fs')

/**
 * 获取多页面入口文件的 Vite 配置
 *
 * 为什么需要这个插件？
 * - Vite 默认只会处理 JS 模块引用的资源，HTML 中直接引用的资源不会被自动复制
 * - 如果直接复制整个 assets 目录，会导致不必要的文件被重复复制
 * - JS 中引用的资源会被 Vite 打包处理，生成带 hash 的文件，无需手动复制
 *
 * 工作原理：
 * 1. 扫描 src/pages 目录下的所有子目录
 * 2. 为每个子目录创建一个入口文件，文件名与子目录名相同
 * 3. 为每个入口文件添加一个 HTML 文件路径，路径为 src/index.html
 *
 * 支持的引用模式：
 * - <link rel="stylesheet" href="/assets/css/reset.css">
 * - <img src="/assets/images/demo.jpg">
 *
 * @returns {Object} - 多页面入口文件的 Vite 配置
 */
function getMultiPageEntries() {
	const pagesDir = path.resolve(__dirname, '../src/pages')
	const entries = {}

	// 添加 src/index.html 作为入口
	const rootIndexPath = path.resolve(__dirname, '../src/index.html')
	if (fs.existsSync(rootIndexPath)) {
		entries['index'] = rootIndexPath
	}

	// 遍历 pages 目录下的子文件夹
	fs.readdirSync(pagesDir).forEach(dirName => {
		const dirPath = path.join(pagesDir, dirName)
		const htmlPath = path.join(dirPath, 'index.html')

		if (fs.statSync(dirPath).isDirectory() && fs.existsSync(htmlPath)) {
			entries['pages/' + dirName] = htmlPath
		}
	})

	return entries
}

module.exports = getMultiPageEntries
