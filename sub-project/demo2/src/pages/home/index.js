import $ from 'jquery'
// import 别名演示
import img from '@images/demo.jpg'
import '@js/common.js'
import './index.css'

const $container = $('.container')
$container.append(
	// '<div><h1>Home</h1><div><img src="../../assets/images/demo.jpg" width="200" height="200" alt="demo" /></div></div>'
	`<div><h1>Home</h1><div><img src="${img}" width="200" height="200" alt="demo" /></div></div>`
)
