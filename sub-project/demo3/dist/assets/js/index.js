let currentPage = null

// 路由监听
listenRouteChange(async route => {
	if (!route) return

	// 销毁上一页
	if (currentPage?.destroy) {
		currentPage.destroy()
	}

	// 加载CSS + 渲染页面
	const pageName = route.match(/([^\/]+)\.html$/)[1]
	await loadPageCss(pageName)
	await renderBox(route)

	// 执行当前页面
	const pageKey = 'Page' + capitalize(pageName)
	currentPage = window[pageKey]
	currentPage?.init()
})

// 初始化路由
function initRoute(defaultPage) {
	const search = new URLSearchParams(location.search)
	const route = search.get('route') || defaultPage
	changeRoute(route, true)
	// 触发路由change事件，触发路由监听
	window.dispatchEvent(new Event('routechange'))
}

$(function () {
	$(document).on('click', '.nav-btn', function () {
		const targetUrl = $(this).attr('data-url')
		const currentRoute = new URLSearchParams(location.search).get('route')

		if (targetUrl === currentRoute) {
			console.log('相同路由，不处理')
			return
		}

		if ($(this).is('[data-router]')) {
			changeRoute(targetUrl)
		} else {
			location.href = targetUrl
		}
	})

	// 启动
	initRoute($('.nav-btn').first().attr('data-url'))
})
