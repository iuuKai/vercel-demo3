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
	if (!proj.build) {
		console.log(`\n⏭️ 跳过 ${proj.name}（无 build 配置）`)
		return
	}

	console.log(`\n=== 正在构建：${proj.name} ==`)

	// 关键：路径必须正确
	const cwd = path.resolve(__dirname, '../sub-project', proj.name)

	// 检查是否已经安装过依赖
	const nodeModulesPath = path.join(cwd, 'node_modules')
	const hasNodeModules = fs.existsSync(nodeModulesPath)

	// 也可以检查是否有其他标识文件，比如 .yarnrc 或 package-lock.json
	const yarnLockPath = path.join(cwd, 'yarn.lock')
	const packageLockPath = path.join(cwd, 'package-lock.json')
	const hasLockFile = fs.existsSync(yarnLockPath) || fs.existsSync(packageLockPath)

	if (hasNodeModules && hasLockFile) {
		console.log(`✅ ${proj.name} 依赖已存在，跳过安装`)
	} else {
		// 先安装子项目依赖
		console.log(`📦 安装 ${proj.name} 依赖...`)
		const installCmd = proj.install || 'yarn install'
		try {
			execSync(installCmd, {
				stdio: 'inherit',
				cwd
			})
			console.log(`✅ ${proj.name} 依赖安装完成`)
		} catch (e) {
			console.log(`⚠️ ${proj.name} 依赖安装失败，但继续构建`)
		}
	}

	// 执行子项目构建命令
	execSync(proj.build, {
		stdio: 'inherit',
		cwd
	})

	console.log(`✅ ${proj.name} 构建完成`)
})
console.log('\n🎉 所有项目构建完成！')
