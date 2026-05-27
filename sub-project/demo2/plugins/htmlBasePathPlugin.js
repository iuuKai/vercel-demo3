/**
 * 处理多页面 base 路径的 Vite 插件
 * 在打包时，将代码中访问根路径 '/' 的资源自动拼接上 baseURL
 * 例如：/pages/home/index.html → /p/demo2/pages/home/index.html
 *
 * 为什么需要？
 * - 确保与主项目 Express 路由代理前缀同步
 * - 否则主项目访问当前项目 dist 页面时会导致资源加载失败
 *
 * 支持的场景：
 * 1. HTML 属性：
 *    - href="/xxx" → href="${baseURL}xxx"
 *    - src="/xxx" → src="${baseURL}xxx"
 *
 * 2. data-* 自定义属性：
 *    - data-path="/pages/xxx" → data-path="${baseURL}pages/xxx"
 *
 * 3. meta refresh：
 *    - <meta http-equiv="refresh" content="0; url=/xxx">
 *      → <meta http-equiv="refresh" content="0; url=${baseURL}xxx">
 *
 * 4. JavaScript 中的路径操作：
 *    - location.replace('/xxx')
 *    - location.href = '/xxx'
 *    - window.location = '/xxx'
 *    - location.assign('/xxx')
 *    - window.open('/xxx')
 *    - history.pushState(null, '', '/xxx')
 *    - history.replaceState(null, '', '/xxx')
 *
 * 5. JavaScript 模块中的字符串路径（仅处理 /pages/ 和 /assets/ 开头的）：
 *    - '/pages/home/index.html' → '${baseURL}pages/home/index.html'
 *    - '/assets/images/demo.jpg' → '${baseURL}assets/images/demo.jpg'
 *
 * @param baseURL - 打包后的路径前缀，例如 '/p/demo2/'
 * @param ignoreSingleSlash - 【仅作用于纯 /】true=不处理 /，保持原样；false=给 / 加 baseURL
 */
function htmlBasePathPlugin(baseURL, ignoreSingleSlash) {
	if (!baseURL) {
		throw new Error('[htmlBasePathPlugin] baseURL 是必填的，请在 .env 文件中设置 BASE_URL')
	}

	const baseWithoutSlash = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
	const formattedBase = baseURL

	// ==========================
	// 【封装函数】仅判断：是不是 单独一个 /
	// ==========================
	function isJustSingleSlash(path) {
		// 只有 空字符串 才代表匹配到了 href="/" 这种纯根路径
		return path === ''
	}

	return {
		name: 'html-base-path',
		transform: (code, id) => {
			let result = code
			const isHtml = id.endsWith('.html')
			const isJs = id.endsWith('.js')

			if (isHtml || isJs) {
				// ==========================
				// 1. 处理 HTML 属性中的路径
				// ==========================
				const attrPattern = /(href|src)="\/([^"]*)"/g
				result = result.replace(attrPattern, (match, attr, pathPart) => {
					// ============== 核心：只处理 纯 / ==============
					if (isJustSingleSlash(pathPart)) {
						if (ignoreSingleSlash) {
							// 忽略：保持 / 不变
							return `${attr}="/"`
						} else {
							// 不忽略：替换成 base
							return `${attr}="${formattedBase}"`
						}
					}
					// ==============================================

					if (pathPart.startsWith(baseWithoutSlash)) return match
					return `${attr}="${formattedBase}${pathPart}"`
				})

				// ==========================
				// 2. 处理 data-* 自定义属性中的路径
				// ==========================
				const dataAttrPattern = /(data-[a-zA-Z-]+)="\/([^"]*)"/g
				result = result.replace(dataAttrPattern, (match, attr, pathPart) => {
					if (isJustSingleSlash(pathPart)) {
						if (ignoreSingleSlash) return `${attr}="/"`
						return `${attr}="${formattedBase}"`
					}
					if (pathPart.startsWith(baseWithoutSlash)) return match
					return `${attr}="${formattedBase}${pathPart}"`
				})

				// ==========================
				// 3. 处理 meta refresh 中的路径
				// ==========================
				if (isHtml) {
					const metaPattern = /content="(\d+);\s*url=\/([^"]*)"/g
					result = result.replace(metaPattern, (match, delay, pathPart) => {
						if (isJustSingleSlash(pathPart)) {
							if (ignoreSingleSlash) return `content="${delay}; url=/"`
							return `content="${delay}; url=${formattedBase}"`
						}
						if (pathPart.startsWith(baseWithoutSlash)) return match
						return `content="${delay}; url=${formattedBase}${pathPart}"`
					})
				}

				// ==========================
				// 4. 处理 JavaScript 中的路径操作
				// ==========================
				const jsPattern =
					/(location\.replace|location\.href|window\.location|location\.assign|window\.open|history\.pushState|history\.replaceState)\s*[:(]\s*['"]\/([^'"]*)['"]/g
				result = result.replace(jsPattern, (match, func, pathPart) => {
					if (isJustSingleSlash(pathPart)) {
						if (ignoreSingleSlash) return match.replace(/\/([^'"]*)/, '/')
						return match.replace(/\/([^'"]*)/, formattedBase)
					}
					if (pathPart.startsWith(baseWithoutSlash)) return match
					return match.replace(`/${pathPart}`, `${formattedBase}${pathPart}`)
				})

				// ==========================
				// 5. 处理 JS 文件中的字符串路径（仅 /pages/ 和 /assets/）
				// ==========================
				if (isJs) {
					const jsPathPattern = /['"](\/(pages|assets)\/[^'"]*)['"]/g
					result = result.replace(jsPathPattern, (match, pathPart) => {
						if (pathPart.startsWith(baseWithoutSlash)) return match
						return `'${formattedBase}${pathPart.slice(1)}'`
					})
				}
			}

			return result
		}
	}
}

module.exports = htmlBasePathPlugin
