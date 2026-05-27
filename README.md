# 🚀 Vercel 多项目一体化部署模板（单域名管理多个前端项目）

> 基于 Express + Vercel 构建，实现**单域名、单仓库**管理多个前端静态项目，支持 SPA/MPA/原生项目，适合作品集展示与多项目管理场景。

---

## 一、项目背景与目标

### 痛点场景

- 只有**一个免费域名**，但需要展示多个前端作品（作品集、Demo、测试项目等）
- 希望在**单个 GitHub 仓库**中管理所有项目，避免多仓库维护成本
- 要求一键部署到 Vercel，无需复杂配置
- 子项目类型多样：SPA 单页面、MPA 多页面、工程化构建（Vite/Webpack）、原生无工程化项目

### 核心目标

- ✅ **单域名 + 单仓库**：通过路径区分不同项目，如 `domain.com/demo1`、`domain.com/demo2`
- ✅ **动态配置**：新增子项目无需修改核心配置，仅需添加目录与配置文件
- ✅ **Vercel 友好**：避免子项目 JS 被编译为 CommonJS，保留 ES Module 特性
- ✅ **一体化架构**：主项目（导航页）+ 多子项目 + 服务端接口（未来扩展）

---

## 二、项目架构

```
vercel-demo3/
├── src/                     # 核心服务层
│   ├── index.js            # Express 主服务入口
│   ├── api/                # 子项目共用服务端接口（预留）
│   ├── assets/             # 主项目静态资源（CSS/JS/图片）
│   └── views/              # 主项目页面模板（Pug）
├── static/                 # 根目录静态资源（可选，兼容传统 Express 结构）
├── sub-project/            # 所有子项目集合（核心目录）
│   ├── demo1/              # 示例：工程化 SPA 单页面项目
│   ├── demo2/              # 示例：工程化 MPA 多页面项目
│   ├── demo3/              # 示例：原生无工程化多页面项目
│   └── project.config.js   # 子项目全局配置文件（动态路由入口）
└── vercel.json             # Vercel 部署核心配置
```

### 架构分层

1.  **主项目层（`src/`）**
    - 提供项目导航页，自动展示所有子项目入口
    - 管理全局静态资源与页面模板
    - 预留 `api/` 目录，未来可扩展为子项目提供服务端接口

2.  **子项目层（`sub-project/`）**
    - 每个子项目独立目录，最终产物必须为 `dist/` 静态资源
    - 支持任意前端技术栈：Vue/React/原生 HTML 等
    - 类型不限：SPA、MPA、工程化/非工程化项目

3.  **部署层（`vercel.json`）**
    - 处理静态资源路由分发
    - 确保子项目资源不被 Vercel 错误编译
    - 动态映射子项目路径到对应 `dist/` 目录

---

## 三、核心功能与配置

### 1. 子项目动态配置机制

所有子项目信息收敛到 `sub-project/project.config.js`，主项目与路由逻辑动态读取配置，实现**新增子项目零配置成本**。

```js
// sub-project/project.config.js
module.exports = [
  {
    route: '/demo1',        // 访问路径（域名后拼接的路径）
    name: 'Demo1 (工程化 SPA)', // 导航页展示名称
    dist: 'demo1/dist'      // 子项目 dist 目录相对路径
  },
  {
    route: '/demo2',
    name: 'Demo2 (工程化 MPA)',
    dist: 'demo2/dist'
  },
  {
    route: '/demo3',
    name: 'Demo3 (原生多页面)',
    dist: 'demo3'
  }
  // 新增子项目只需在这里添加配置项
]
```

### 2. Express 核心路由逻辑

```js
// src/index.js
const express = require('express')
const path = require('path')
const app = express()

// 1. 视图引擎配置（Pug 模板）
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// 2. 主项目静态资源
app.use('/assets', express.static(path.join(__dirname, 'assets')))

// 3. 动态挂载子项目路由
const projects = require('../sub-project/project.config')
projects.forEach(project => {
  app.use(project.route, express.static(path.join(__dirname, '../sub-project', project.dist)))
})

// 4. 首页渲染（自动生成导航列表）
app.get('/', (req, res) => {
  res.render('index', { projects })
})

// 5. 启动服务
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

### 3. Vercel 关键配置（解决核心坑点）

```json
{
  "version": 2,
  "builds": [
    { "src": "static/**/*", "use": "@vercel/static" },
    { "src": "sub-project/**/dist/**/*", "use": "@vercel/static" },
    {
      "src": "src/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "sub-project/**/dist/**",
          "sub-project/project.config.js",
          "src/views/**",
          "src/assets/**",
          "static/**"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "^/(?!assets/)([^/]+)/(.+\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp))$",
      "dest": "/sub-project/$1/dist/$2"
    },
    {
      "src": "/(.*)",
      "dest": "/src/index.js"
    }
  ]
}
```

**核心作用：**

- `builds`：将子项目 `dist/` 与主项目静态资源标记为静态资源，避免被 Node 服务处理
- `routes`：
  - 正则匹配子项目静态资源，直接分发源文件，防止 Vercel 编译 ES Module 为 CommonJS
  - 排除主项目 `/assets` 路径，避免 404 错误
  - 其余请求全部交由 Express 处理，保证路由与页面渲染正常

---

## 四、快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
```

### 2. 本地开发

```bash
npm run dev
# 访问 http://localhost:3000
```

### 3. 新增子项目

1. 在 `sub-project/` 下新建子项目目录（如 `my-project`）
2. 构建项目并生成 `dist/` 目录（原生项目可直接将 HTML/CSS/JS 放在目录下）
3. 在 `sub-project/project.config.js` 中添加配置：

   ```js
   {
     route: '/my-project',
     name: '我的新项目',
     dist: 'my-project/dist' // 或 'my-project'（原生项目）
   }
   ```

5. 重启服务，访问 `http://localhost:3000/my-project`

### 4. 部署到 Vercel

1. Fork 本仓库到你的 GitHub
2. 在 Vercel 中导入该仓库
3. 保持默认配置，点击「Deploy」完成部署
4. 访问你的 Vercel 域名，即可看到所有子项目

---

## 五、关键技术难点与解决方案

### 1. Vercel 自动编译子项目 JS 为 CommonJS

- **问题**：Vercel 默认将 Node 服务返回的 JS 编译为 CommonJS，导致子项目 `import/export` 语法报错
- **解决方案**：通过 `vercel.json` 路由正则，将子项目静态资源直接映射到 `sub-project/xxx/dist/` 路径，绕过 Node 服务，保留原始 ES Module 语法

### 2. 主项目与子项目静态资源路径冲突

- **问题**：若主项目与子项目都使用 `/assets/` 路径，会导致正则误匹配，主项目资源 404
- **解决方案**：主项目静态资源使用 `/assets/` 前缀，并在 `routes` 正则中排除该路径；或重构为 `base-assets`/`static` 等更独特的前缀

### 3. 动态添加子项目无需修改部署配置

- **解决方案**：子项目信息全部收敛到 `project.config.js`，主项目与路由逻辑动态读取配置，`vercel.json` 一次性配置完成后永久不变

---

## 六、项目亮点（可写入简历）

> 设计并实现了一套基于 Express + Vercel 的多项目一体化部署模板，支持在**单域名、单仓库**中管理多个前端静态项目（SPA/MPA/原生项目）。通过**动态配置机制**与 Vercel 路由优化，解决了子项目资源冲突与 ES Module 编译问题，实现了**一键部署**与**零配置扩展**，可用于作品集展示或多项目管理场景。

### 技术亮点

- ✅ **架构设计**：主项目 + 多子项目的轻量化 Monorepo 架构，兼顾扩展性与维护性
- ✅ **工程化**：动态配置机制，新增子项目零配置成本，符合开源项目易用性原则
- ✅ **部署优化**：解决 Vercel 环境下 ES Module 编译问题，保证子项目在生产环境正常运行
- ✅ **一体化**：预留服务端接口层，未来可扩展为完整全栈项目

---

## 七、未来规划

- [ ] 完善 `src/api/` 接口层，提供子项目通用服务端能力
- [ ] 增加子项目模板（Vue/React/原生），降低用户使用成本
- [ ] 支持子项目环境变量配置
- [ ] 优化 Vercel 冷启动速度
- [ ] 增加子项目分类与搜索功能

---

## 八、License

MIT License

---

## 九、联系方式

- GitHub：[iuuKai/vercel-demo3](https://github.com/iuuKai/vercel-demo3)
- 欢迎 Star & Fork & Issue！

---

> 本模板完美解决了**单域名管理多个前端项目**的需求，架构清晰、配置简洁、易于扩展，非常适合作为个人作品集展示或开源项目基础模板。
