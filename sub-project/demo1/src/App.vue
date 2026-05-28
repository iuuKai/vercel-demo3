<template>
	<div class="container">
		<div v-if="isSubProject" class="sup-nav">
			<a href="/">返回导航33</a>
		</div>
		<div class="nav">
			<ul>
				<li class="nav-item" v-for="item in navItems" :key="item.path">
					<button @click="toPage(item.path)">to {{ item.name }}</button>
					<span>{{ item.description }}</span>
				</li>
			</ul>
		</div>
		<router-view :isSubProject="isSubProject"></router-view>
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSubProject = ref(location.pathname.startsWith('/p/'))
const navItems = ref([
	{
		name: 'Home',
		path: '/',
		description: '加载图片资源'
	},
	{
		name: 'About',
		path: '/about',
		description: '请求主项目接口'
	},
	{
		name: '404',
		path: `/404/${Date.now()}`,
		description: '404错误页'
	}
])

const toPage = path => {
	router.push(path)
}
</script>

<style scoped>
.container {
	margin: 20vh auto 0;
	padding: 20px;
	width: 400px;
	background-color: #fff;
	border-radius: 10px;
}
.nav-item {
	line-height: 40px;
}
.nav button {
	margin-right: 20px;
}
</style>
