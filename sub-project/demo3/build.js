const fs = require('fs')
const path = require('path')

// 配置文件
const { BASE_URL } = require('./env')

// 路径
const srcDir = path.resolve(__dirname, 'src')
const outDir = path.resolve(__dirname, 'dist')

// 1. 先清空 dist 目录
if (fs.existsSync(outDir)) {
	fs.rmSync(outDir, { recursive: true, force: true })
}

// 2. 把整个 src 复制到 dist
fs.cpSync(srcDir, outDir, { recursive: true, force: true })

// 3. 递归替换所有 HTML、JS 文件里的路径
function replaceAllFiles(dir) {
	const files = fs.readdirSync(dir, { withFileTypes: true })

	files.forEach(item => {
		const fullPath = path.join(dir, item.name)

		// 是文件夹 → 递归
		if (item.isDirectory()) {
			replaceAllFiles(fullPath)
			return
		}

		// 只处理 HTML / JS / CSS
		const isHtml = item.name.endsWith('.html')
		const isJs = item.name.endsWith('.js')
		const isCss = item.name.endsWith('.css')
		if (!isHtml && !isJs && !isCss) return

		let content = fs.readFileSync(fullPath, 'utf8')

		// ==============================================
		// 🔥 全覆盖替换规则（仅处理 /pages/ 和 /assets/ 开头的路径）
		// ==============================================

		// 1. HTML 属性：href="/xxx"  src="/xxx"
		content = content.replace(/(href|src)="\/(pages|assets)\/([^"#]+)"/g, (_, attr, type, rest) => {
			return `${attr}="${BASE_URL}${type}/${rest}"`
		})

		// 2. data-* 自定义属性中的 URL
		content = content.replace(
			/(data-[a-zA-Z0-9-]+)="\/(pages|assets)\/([^"#]+)"/g,
			(_, attr, type, rest) => {
				return `${attr}="${BASE_URL}${type}/${rest}"`
			}
		)

		// 3. JS 中的路径：location.href = '/xxx'
		content = content.replace(
			/location\.href\s*=\s*['"]\/(pages|assets)\/([^'"]+)['"]/g,
			(_, type, url) => {
				return `location.href = "${BASE_URL}${type}/${url}"`
			}
		)

		// 4. window.open('/xxx')
		content = content.replace(
			/window\.open\(\s*['"]\/(pages|assets)\/([^'"]+)['"]/g,
			(_, type, url) => {
				return `window.open("${BASE_URL}${type}/${url}")`
			}
		)

		// 5. location.assign('/xxx')
		content = content.replace(
			/location\.assign\(\s*['"]\/(pages|assets)\/([^'"]+)['"]/g,
			(_, type, url) => {
				return `location.assign("${BASE_URL}${type}/${url}")`
			}
		)

		// 6. location.replace('/xxx')
		content = content.replace(
			/location\.replace\(\s*['"]\/(pages|assets)\/([^'"]+)['"]/g,
			(_, type, url) => {
				return `location.replace("${BASE_URL}${type}/${url}")`
			}
		)

		// 7. pjax 配置 url: '/xxx'
		content = content.replace(
			/(url:\s*['"])\/(pages|assets)\/([^'"]+)(['"])/g,
			(_, prefix, type, url, suffix) => {
				return `${prefix}${BASE_URL}${type}/${url}${suffix}`
			}
		)

		// 8. JS 文件中的字符串路径（单引号）
		content = content.replace(/'\/(pages|assets)\/([^']+)'/g, (_, type, url) => {
			return `'${BASE_URL}${type}/${url}'`
		})

		// 9. JS 文件中的字符串路径（双引号）
		content = content.replace(/"\/(pages|assets)\/([^"]+)"/g, (_, type, url) => {
			return `"${BASE_URL}${type}/${url}"`
		})

		// 10. JS 文件中的模板字符串（反引号）
		content = content.replace(/`\/(pages|assets)\/([^`]+)`/g, (_, type, url) => {
			return `\`${BASE_URL}${type}/${url}\``
		})

		// 11. CSS 中的 url() 路径：url('/xxx')
		if (isCss) {
			// 处理 url('/xxx') 或 url("/xxx")
			content = content.replace(
				/url\(\s*['"]\/(pages|assets)\/([^'"]+)['"]\s*\)/g,
				(_, type, url) => {
					return `url("${BASE_URL}${type}/${url}")`
				}
			)
			// 处理 url(/xxx) 不带引号的情况
			content = content.replace(/url\(\s*\/(pages|assets)\/([^'"\s)]+)\s*\)/g, (_, type, url) => {
				return `url("${BASE_URL}${type}/${url}")`
			})
		}

		// 写回文件
		fs.writeFileSync(fullPath, content, 'utf8')
	})
}

// 执行替换
replaceAllFiles(outDir)

console.log('✅ 原生项目打包完成！所有路径已替换：' + BASE_URL)
