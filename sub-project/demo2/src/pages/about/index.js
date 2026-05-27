import $ from 'jquery'
import '@js/common.js'
import './index.css'

const $container = $('.container')
$container.append(
	'<div><h1>About</h1><div class="user-list"><div class="loading">加载中...</div><div></div>'
)
const isSubProject = window.isSubProject

if (isSubProject) {
	fetch('/api/user/all')
		.then(res => res.json())
		.then(res => {
			$('.loading').hide()
			const userList = res.data || []

			if (userList.length > 0) {
				const $userList = $('<ul></ul>').append(
					userList.map(user => `<li>${user.name} - ${user.email}</li>`)
				)
				$container.find('.user-list').append($userList)
			} else {
				$container.find('.user-list').append('<div class="empty">暂无用户</div>')
			}
		})
}
