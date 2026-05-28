const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()

// 禁止 HTML 缓存
app.use((req, res, next) => {
	const ext = req.path.split('.').pop()
	// 只有 HTML 不缓存
	if (ext === 'html' || req.path === '/' || !ext) {
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
		res.setHeader('Pragma', 'no-cache')
		res.setHeader('Expires', '0')
	}
	next()
})

// 主项目静态资源
app.use('/static', express.static(path.join(__dirname, '../static')))

// API 路由
app.use('/api/user', require('./api/user'))

// 读取子项目配置
const projects = require('../sub-project/project.config.js')

// 自动注册所有子项目
projects.forEach(item => {
	const { route, type, dist, entry = 'index.html' } = item
	const distPath = path.join(__dirname, '../', dist)
	const entryFile = entry.replace(/^\//, '') // 去除前导斜杠

	// 静态资源放前面 + 关闭自动 index.html ✅ 不影响 Vercel
	app.use(route, express.static(distPath, { index: false }))

	// 根路径入口
	app.get(route, (req, res) => {
		res.sendFile(path.join(distPath, entryFile), {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		})
	})

	// SPA 子路径处理
	if (type === 'spa') {
		app.get(new RegExp(`^${route}/.+$`), (req, res) => {
			res.sendFile(path.join(distPath, entryFile), {
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					Pragma: 'no-cache',
					Expires: '0'
				}
			})
		})
	}
})

// 首页
app.get('/', (req, res) => {
	const indexPath = path.join(__dirname, '../views', 'index.html')
	fs.readFile(indexPath, 'utf8', (err, content) => {
		if (err) {
			res.status(500).send('无法读取首页')
			return
		}
		// 生成项目链接 HTML
		const projectLinks = projects
			.map(item => {
				return `<a href="${item.route}" target="_self">
					<div class="project-item">
						<h3>${item.name}</h3>
						<p>${item.description}</p>
					</div>
				</a>`
			})
			.join('\n')
		// 替换模板变量
		const html = content.replace('{{projects}}', projectLinks)
		res.send(html)
	})
})

// 404 处理
app.use((req, res) => {
	res.status(404)
	// 尝试返回 404.html，如果不存在则返回文本
	const notFoundPath = path.join(__dirname, '../public', '404.html')
	if (fs.existsSync(notFoundPath)) {
		res.sendFile(notFoundPath, {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		})
	} else {
		res.send('404 - 请配置 404 页面')
	}
})

// 错误处理
app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('500 - 服务器内部错误')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`✅ http://localhost:${PORT}`)
})

module.exports = app
