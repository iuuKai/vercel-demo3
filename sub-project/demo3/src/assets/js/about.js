window.PageAbout = {
	init() {
		console.log('✅ about 页面初始化')

		waitForDom('.user-list', async () => {
			$('.loading').show()
			try {
				const res = await $.ajax('/api/user/all')
				const html = res.data.map(item => {
					return `<li>${item.name}：${item.email}</li>`
				})
				$('.user-list ul').html(html)
			} catch (error) {
				$('.user-list ul').html('<li>数据加载失败</li>')
			} finally {
				$('.loading').hide()
			}
		})
	},

	destroy() {
		console.log('🗑️ about 页面销毁（可清理事件/定时器）')
		// 这里写解绑、清定时器等操作
	}
}
