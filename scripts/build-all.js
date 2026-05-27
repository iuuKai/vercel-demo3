const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const config = require('../sub-project/project.config')

// =========================================
// 1. 自动判断：主项目有没有 build 脚本
// =========================================
const packagePath = path.resolve(__dirname, '../package.json')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

if (pkg.scripts?.build) {
	console.log('🚀 构建主项目...')
	try {
		execSync('yarn build', { stdio: 'inherit', cwd: process.cwd() })
	} catch (e) {}
} else {
	console.log('✅ 主项目无需构建，跳过')
}

// =========================================
// 2. 构建所有子项目（你的配置）
// =========================================
console.log('\n📦 开始构建所有子项目...')

config.forEach(proj => {
	if (!proj.build) return

	console.log(`\n=== 正在构建：${proj.name} ==`)

	// 关键：路径必须正确
	const cwd = path.resolve(__dirname, '../sub-project', proj.name)

	execSync(proj.build, {
		stdio: 'inherit',
		cwd
	})
})

console.log('\n🎉 所有项目构建完成！')
