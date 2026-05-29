<template>
	<div>
		<h1>About</h1>
		<div class="user-list">
			<div class="loading" v-if="isLoading">加载中...</div>
			<template v-else>
				<ul v-if="userList.length > 0">
					<li v-for="user in userList" :key="user.id">{{ user.name }} - {{ user.email }}</li>
				</ul>
				<div v-else class="empty">暂无用户</div>
			</template>
		</div>
	</div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue'

const props = defineProps({
	isSubProject: {
		type: Boolean,
		default: false
	}
})

const userList = ref([])
const isLoading = ref(true)

onBeforeMount(async () => {
	if (props.isSubProject) {
		userList.value = await fetch('/api/user/all')
			.then(res => res.json())
			.then(res => {
				isLoading.value = false
				return res.data || []
			})
	}
})
</script>

<style scoped>
.user-list {
	max-height: 300px;
	overflow-y: auto;
}
.user-list ul li {
	line-height: 40px;
}
</style>
