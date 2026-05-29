let isListening = false // 防止重复监听
const loadedCss = new Set() // 已加载CSS缓存

// 监听路由变化（pushState / replaceState / 前进后退）
function listenRouteChange(callback) {
	if (isListening) return
	isListening = true

	const originPush = history.pushState
	history.pushState = function (...args) {
		originPush.apply(history, args)
		window.dispatchEvent(new Event('routechange'))
	}

	const originReplace = history.replaceState
	history.replaceState = function (...args) {
		originReplace.apply(history, args)
		window.dispatchEvent(new Event('routechange'))
	}

	window.addEventListener('popstate', function () {
		window.dispatchEvent(new Event('routechange'))
	})

	window.addEventListener('routechange', function () {
		const url = new URLSearchParams(location.search).get('route')
		callback(url)
	})
}

// 修改 URL 不刷新
function changeRoute(url, isInit = false) {
	const u = new URL(location.href)
	u.searchParams.set('route', url)
	if (isInit) {
		history.replaceState({}, '', u)
	} else {
		history.pushState({}, '', u)
	}
}

// 渲染页面 Promise 化（带错误处理）
function renderBox(url) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: url,
			success: function (html) {
				$('#box').html(html)
				resolve()
			},
			error: function () {
				$('#box').html('<div>页面加载失败</div>')
				reject()
			}
		})
	})
}

// 监听 DOM 渲染完成（最稳版）
function waitForDom(selector, callback) {
	const el = document.querySelector(selector)
	if (el) {
		callback(el)
		return
	}

	const observer = new MutationObserver(() => {
		const el = document.querySelector(selector)
		if (el) {
			observer.disconnect()
			callback(el)
		}
	})

	observer.observe(document.body, {
		childList: true,
		subtree: true
	})
}

// 动态加载页面CSS
async function loadPageCss(pageName) {
	const cssUrl = `/assets/css/${pageName}.css`

	if (loadedCss.has(cssUrl)) return

	return new Promise(resolve => {
		const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.href = cssUrl
		link.onload = resolve
		document.head.appendChild(link)
		loadedCss.add(cssUrl)
	})
}

// 首字母大写
function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1)
}
