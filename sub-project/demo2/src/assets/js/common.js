import $ from 'jquery'
// js 里引入别名样式资源演示
import '@css/common.css'

const $container = $('#app').append('<div class="container"></div>').find('.container')
const isSubProject = window.location.pathname.startsWith('\/p\/')
window.isSubProject = isSubProject

// 创建返回导航
const $supNav = $('<div class="sup-nav"><a href="/">返回导航</a></div>')
if (isSubProject) {
	$container.append($supNav)
}

const navItems = [
	{
		name: 'Home',
		path: '/pages/home/index.html',
		description: '加载图片资源'
	},
	{
		name: 'About',
		path: '/pages/about/index.html',
		description: '请求主项目接口'
	},
	{
		name: '404',
		path: `/404/${Date.now()}.html`,
		description: '404错误页',
		hidden: !isSubProject
	}
]

const navItemHtml = navItems
	.filter(item => !item.hidden)
	.map(item => {
		return `<li class="nav-item">
		<button class="nav-btn" data-path="${item.path}">to ${item.name}</button>
		<span>${item.description}</span>
	</li>`
	})
	.join('')

const $ul = $(`<div class="nav"><ul>${navItemHtml}</ul></div>`)

$ul.on('click', '.nav-btn', function () {
	const path = $(this).data('path')
	window.location.href = path
})

$container.append($ul)
