const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const CleanCSS = require('clean-css')
const { minify } = require('terser')

/**
 * 只复制 HTML 文件中引用的 assets 资源，并进行压缩、混淆和 cache-busting 处理
 *
 * 为什么需要这个插件？
 * - Vite 默认只会处理 JS 模块引用的资源，HTML 中直接引用的资源不会被自动复制
 * - 如果直接复制整个 assets 目录，会导致不必要的文件被重复复制
 * - JS 中引用的资源会被 Vite 打包处理，生成带 hash 的文件，无需手动复制
 *
 * 工作原理：
 * 1. 扫描所有 HTML 文件（src/index.html 和 src\pages\*\index.html）
 * 2. 提取 HTML 中通过 href 或 src 属性引用的 /assets/ 路径
 * 3. 根据文件类型分别处理：
 *    - CSS 文件：压缩 + 生成 [name]-[hash].css
 *    - JS 文件：压缩 + 混淆 + 生成 [name]-[hash].js
 *    - 其他文件：直接复制
 * 4. 更新 HTML 中的资源引用路径
 *
 * 支持的引用模式：
 * - <link rel="stylesheet" href="/assets/css/reset.css">
 * - <script src="/assets/js/test.js"></script>
 * - <img src="/assets/images/demo.jpg">
 *
 * @param {string} srcDir - 源 assets 目录的绝对路径
 * @param {string} destDir - 目标 assets 目录的绝对路径
 * @param {string} baseURL - 基础路径，例如 '/p/demo2/'
 */
function copyAssetsPlugin(srcDir, destDir, baseURL) {
	if (!baseURL) {
		throw new Error('[copyAssetsPlugin] baseURL 是必填的，请在 .env 文件中设置 BASE_URL')
	}
	const baseWithoutSlash = baseURL.slice(0, -1)
	return {
		name: 'copy-assets',
		writeBundle: async () => {
			const srcRoot = path.resolve(__dirname, '../src')
			const referencedAssets = new Set()
			const assetMappings = {}

			// ==========================
			// 1. 扫描 HTML 文件，收集引用的资源
			// ==========================
			const scanHtmlFile = htmlPath => {
				if (fs.existsSync(htmlPath)) {
					const content = fs.readFileSync(htmlPath, 'utf-8')
					const attrPattern = /(href|src)="\/assets\/([^"]+)"/g
					let match
					while ((match = attrPattern.exec(content)) !== null) {
						const assetPath = match[2]
						referencedAssets.add(assetPath)
					}
				}
			}

			scanHtmlFile(path.join(srcRoot, 'index.html'))

			const pagesDir = path.join(srcRoot, 'pages')
			if (fs.existsSync(pagesDir)) {
				fs.readdirSync(pagesDir).forEach(dirName => {
					const dirPath = path.join(pagesDir, dirName)
					if (fs.statSync(dirPath).isDirectory()) {
						scanHtmlFile(path.join(dirPath, 'index.html'))
					}
				})
			}

			// ==========================
			// 2. 处理收集到的资源
			// ==========================
			const processAssets = []
			referencedAssets.forEach(assetPath => {
				const srcPath = path.join(srcDir, assetPath)
				if (fs.existsSync(srcPath)) {
					processAssets.push(processAsset(srcPath, assetPath, srcDir, destDir, assetMappings))
				}
			})

			await Promise.all(processAssets)

			// ==========================
			// 3. 更新 HTML 中的资源路径
			// ==========================
			if (Object.keys(assetMappings).length > 0) {
				const updateHtmlFile = htmlPath => {
					if (fs.existsSync(htmlPath)) {
						let content = fs.readFileSync(htmlPath, 'utf-8')
						for (const oldPath in assetMappings) {
							const newPath = assetMappings[oldPath]
							const regex = new RegExp(
								'"' +
									baseWithoutSlash +
									'/assets/' +
									oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
									'"',
								'g'
							)
							content = content.replace(regex, '"' + baseWithoutSlash + '/assets/' + newPath + '"')
							const regex2 = new RegExp(
								'"/assets/' + oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"',
								'g'
							)
							content = content.replace(regex2, '"' + baseURL + 'assets/' + newPath + '"')
						}
						fs.writeFileSync(htmlPath, content, 'utf-8')
					}
				}

				updateHtmlFile(path.join(destDir, '../index.html'))

				const distPagesDir = path.join(destDir, '../pages')
				if (fs.existsSync(distPagesDir)) {
					fs.readdirSync(distPagesDir).forEach(dirName => {
						const dirPath = path.join(distPagesDir, dirName)
						if (fs.statSync(dirPath).isDirectory()) {
							updateHtmlFile(path.join(dirPath, 'index.html'))
						}
					})
				}
			}
		}
	}
}

async function processAsset(srcPath, assetPath, srcDir, destDir, assetMappings) {
	const ext = path.extname(assetPath)
	let finalDestPath = path.join(destDir, assetPath)

	// ==========================
	// 1. CSS 文件处理
	// ==========================
	if (ext === '.css') {
		const cssContent = fs.readFileSync(srcPath, 'utf-8')
		const hash = crypto.createHash('md5').update(cssContent).digest('hex').substring(0, 8)
		const baseName = path.basename(assetPath, '.css')
		const hashedFileName = baseName + '-' + hash + '.css'
		const relativeDir = path.dirname(assetPath)
		finalDestPath = path.join(destDir, relativeDir, hashedFileName)

		const destDirPath = path.dirname(finalDestPath)
		if (!fs.existsSync(destDirPath)) {
			fs.mkdirSync(destDirPath, { recursive: true })
		}

		const minified = new CleanCSS().minify(cssContent).styles
		fs.writeFileSync(finalDestPath, minified, 'utf-8')

		assetMappings[assetPath] = path.join(relativeDir, hashedFileName).replace(/\\/g, '/')
		console.log(
			'Copied, minified and hashed (referenced in HTML): ' + srcPath + ' -> ' + finalDestPath
		)
		// ==========================
		// 2. JS 文件处理
		// ==========================
	} else if (ext === '.js') {
		const jsContent = fs.readFileSync(srcPath, 'utf-8')
		const hash = crypto.createHash('md5').update(jsContent).digest('hex').substring(0, 8)
		const baseName = path.basename(assetPath, '.js')
		const hashedFileName = baseName + '-' + hash + '.js'
		const relativeDir = path.dirname(assetPath)
		finalDestPath = path.join(destDir, relativeDir, hashedFileName)

		const destDirPath = path.dirname(finalDestPath)
		if (!fs.existsSync(destDirPath)) {
			fs.mkdirSync(destDirPath, { recursive: true })
		}

		const result = await minify(jsContent, {
			compress: {
				drop_console: false,
				drop_debugger: true
			},
			mangle: true
		})

		if (result.code) {
			fs.writeFileSync(finalDestPath, result.code, 'utf-8')
		}

		assetMappings[assetPath] = path.join(relativeDir, hashedFileName).replace(/\\/g, '/')
		console.log(
			'Copied, minified, obfuscated and hashed (referenced in HTML): ' +
				srcPath +
				' -> ' +
				finalDestPath
		)
		// ==========================
		// 3. 其他文件处理
		// ==========================
	} else {
		const destDirPath = path.dirname(finalDestPath)
		if (!fs.existsSync(destDirPath)) {
			fs.mkdirSync(destDirPath, { recursive: true })
		}
		fs.copyFileSync(srcPath, finalDestPath)
		console.log('Copied (referenced in HTML): ' + srcPath + ' -> ' + finalDestPath)
	}
}

module.exports = copyAssetsPlugin
