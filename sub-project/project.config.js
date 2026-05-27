/**
 * 子项目配置表
 * @type {Array<{
 *   name: string,    // 项目名
 *   route: string,   // 访问路由 /p/demo1，多加 /p/ 是用于与主项目资源区分
 *   type: 'spa' | 'static' | 'mpa',  // 主要目的是用于node路由根据标识处理单页面刷新404
 *   description: string, // 项目描述
 *   dist: string     // dist 目录路径
 *   entry: string,   // dist 下的入口页面路径（初始页），默认 dist/index.html，支持自定义入口页面（首页）或在 index.html 重定向到其他页面（参考 demo3）
 *   build: string,   // 构建 dist 的命令（如果无需命令则不用设置，但得确保 dist 存在）
 * }>}
 */
module.exports = [
	{
		name: 'demo1',
		route: '/p/demo1',
		type: 'spa',
		description: 'vite 单页面项目演示',
		dist: 'sub-project/demo1/dist',
		entry: 'index.html',
		build: 'yarn build'
	},
	{
		name: 'demo2',
		route: '/p/demo2',
		type: 'mpa',
		description: 'vite 多页面项目演示（1）',
		dist: 'sub-project/demo2/dist',
		entry: 'index.html',
		build: 'yarn build'
	},
	{
		name: 'demo3',
		route: '/p/demo3',
		type: 'static',
		description: '纯原生静态项目演示',
		dist: 'sub-project/demo3/dist',
		entry: 'pages/home.html',
		build: 'node build'
	}
]
