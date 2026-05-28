const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const config = require('../sub-project/project.config')

// 根目录
const rootDir = path.resolve(__dirname, '..')

// =========================================
// 1. 先安装主项目依赖
// =========================================
console.log('🔧 检查主项目依赖...')
const rootNodeModules = path.join(rootDir, 'node_modules')
const rootYarnLock = path.join(rootDir, 'yarn.lock')
const rootPackageLock = path.join(rootDir, 'package-lock.json')
const rootHasNodeModules = fs.existsSync(rootNodeModules)
const rootHasLockFile = fs.existsSync(rootYarnLock) || fs.existsSync(rootPackageLock)

if (rootHasNodeModules && rootHasLockFile) {
	console.log('✅ 主项目依赖已存在，跳过安装')
} else {
	console.log('🔧 安装主项目依赖...')
	try {
		execSync('yarn install', {
			stdio: 'inherit',
			cwd: rootDir
		})
		console.log('✅ 主项目依赖安装完成')
	} catch (e) {
		console.log('⚠️ 主项目 install 失败，但继续执行')
	}
}

// =========================================
// 2. 安装所有子项目（读取你的配置）
// =========================================
console.log('\n📦 开始检查所有子项目依赖...')

config.forEach(proj => {
	// 没有 install 命令 → 跳过
	if (!proj.install) {
		console.log(`\n⏭️ 跳过 ${proj.name}（无 install 配置）`)
		return
	}

	console.log(`\n=== 正在检查：${proj.name} ==`)

	// 子项目目录（和你 build 用的一模一样）
	const cwd = path.resolve(__dirname, '../sub-project', proj.name)

	// 检查是否已经安装过依赖
	const nodeModulesPath = path.join(cwd, 'node_modules')
	const yarnLockPath = path.join(cwd, 'yarn.lock')
	const packageLockPath = path.join(cwd, 'package-lock.json')
	const hasNodeModules = fs.existsSync(nodeModulesPath)
	const hasLockFile = fs.existsSync(yarnLockPath) || fs.existsSync(packageLockPath)

	if (hasNodeModules && hasLockFile) {
		console.log(`✅ ${proj.name} 依赖已存在，跳过安装`)
	} else {
		// 执行 install 命令
		console.log(`📦 安装 ${proj.name} 依赖...`)
		try {
			execSync(proj.install, {
				stdio: 'inherit',
				cwd
			})
			console.log(`✅ ${proj.name} 依赖安装完成`)
		} catch (e) {
			console.log(`❌ ${proj.name} 安装失败`)
		}
	}
})

console.log('\n🎉 所有项目依赖检查完成！')
