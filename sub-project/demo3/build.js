const fs = require('fs')
const path = require('path')

// 配置文件
const { BASE_URL } = require('./env')

// 路径
const srcDir = path.resolve(__dirname, 'src')
const outDir = path.resolve(__dirname, 'dist')

// 1. 先把整个 src 复制到 dist
fs.cpSync(srcDir, outDir, { recursive: true, force: true })

// 2. 递归替换所有 HTML、JS 文件里的路径
function replaceAllFiles(dir) {
	const files = fs.readdirSync(dir, { withFileTypes: true })

	files.forEach(item => {
		const fullPath = path.join(dir, item.name)

		// 是文件夹 → 递归
		if (item.isDirectory()) {
			replaceAllFiles(fullPath)
			return
		}

		// 只处理 HTML / JS
		const isHtml = item.name.endsWith('.html')
		const isJs = item.name.endsWith('.js')
		if (!isHtml && !isJs) return

		let content = fs.readFileSync(fullPath, 'utf8')

		// ==============================================
		// 🔥 全覆盖替换规则
		// ==============================================

		// 1. HTML 属性：href="/xxx"  src="/xxx"
		content = content.replace(/(href|src)="\/([^"#]+)"/g, (_, attr, rest) => {
			return `${attr}="${BASE_URL}${rest}"`
		})

		// 2. JS 中的路径：location.href = '/xxx'
		content = content.replace(/location\.href\s*=\s*['"](\/[^'"]+)['"]/g, (_, url) => {
			return `location.href = "${BASE_URL}${url.slice(1)}"`
		})

		// 3. window.open('/xxx')
		content = content.replace(/window\.open\(\s*['"](\/[^'"]+)['"]/g, (_, url) => {
			return `window.open("${BASE_URL}${url.slice(1)}"`
		})

		// 4. location.assign('/xxx')
		content = content.replace(/location\.assign\(\s*['"](\/[^'"]+)['"]/g, (_, url) => {
			return `location.assign("${BASE_URL}${url.slice(1)}"`
		})

		// 5. location.replace('/xxx')
		content = content.replace(/location\.replace\(\s*['"](\/[^'"]+)['"]/g, (_, url) => {
			return `location.replace("${BASE_URL}${url.slice(1)}"`
		})

		// 写回文件
		fs.writeFileSync(fullPath, content, 'utf8')
	})
}

// 执行替换
replaceAllFiles(outDir)

console.log('✅ 原生项目打包完成！所有路径已替换：' + BASE_URL)
