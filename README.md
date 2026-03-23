# 个人内容整理与展示网站

线上地址：[buildspace.top](https://www.buildspace.top)

这是我的个人网站项目，用来整理项目、照片、视频、平台入口和联系信息。  
我想解决的不是“再做一个主页”，而是把原本分散在不同地方的内容收拢到一个统一入口里，让招聘方、合作方和普通访问者都能更快看懂我在做什么。

## 项目简介

这是一个基于 `React + Vite` 实现的单页网站，主要解决 4 个问题：

- 个人内容分散在多个平台，信息入口不统一
- 项目、媒体、链接和联系方式缺少清晰的浏览路径
- 静态展示页表达效率低，信息重点不够清楚
- 上线后缺少访问反馈，不知道哪些页面真的被看到了

网站本身偏交互式表达，但核心还是内容整理与展示。

## 解决了什么问题

- 对招聘方：更快看到项目内容、技术方向和真实链接
- 对合作方：更容易理解我能提供什么能力和合作入口
- 对普通访问者：可以顺着作品、照片、视频和外链继续浏览
- 对我自己：后续继续补内容时，不需要再把素材分散维护在多个地方

## AI 辅助开发说明

开发这个项目时，我在中间环节用了 AI 辅助，主要是帮助我更快完成问题拆解、信息结构梳理、方案比较和文案初稿。  
最后的内容取舍、语气统一、交互判断、页面实现和上线迭代，还是我自己来做。

## 怎么运行和验证

安装依赖并启动开发环境：

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:5173
```

如果你想同时验证访问记录链路，再开一个终端启动本地记录服务：

```bash
npm run track:local
```

本地环境下，前端会自动把访问记录发到：

```text
http://127.0.0.1:3000/api/track-visit
```

## 项目亮点

- 交互表达：使用动画、过渡和场景切换让浏览路径更完整
- 内容统一承接：把项目、媒体、链接和联系入口整合到一个平台
- 访问记录闭环：记录路径、设备、系统、浏览器和属地信息
- AI 辅助开发：主要用在信息结构梳理、方案比较、文案初稿和部分实现提效上

## AI 辅助开发流程

这个项目里，AI 主要参与中间环节，不是直接替我把网站做完。

### 1. 原始素材输入

输入内容包括：

- 项目经历
- 旅行照片与视频
- 外部平台链接
- 个人介绍
- 希望传达给招聘方和合作方的重点

### 2. 问题定义与目标确认

先明确这个项目要解决的不是“页面不够炫”，而是：

- 内容分散
- 更新效率低
- 表达不清楚
- 浏览路径不明确

同时确认主要访问对象是招聘方、合作方和普通访问者，再决定信息优先级。

### 3. AI 辅助生成与方案比较

这一阶段里，我主要把 AI 用在中间产物生成和方案对比上，例如：

- 拆解栏目和页面层级
- 起草模块文案和标题方向
- 比较不同页面顺序和展示方案
- 辅助生成部分前端实现思路与代码草稿
- 对动效、结构和内容组织给出备选方案

重点是加快比较和试错，不是直接照搬生成结果。

### 4. 人工判断与内容取舍

我会在 AI 生成的草稿基础上继续人工判断，包括：

- 删掉空话和不真实的表达
- 补充实际做过的内容和真实约束
- 统一页面语气和项目叙事
- 决定保留哪些模块、弱化哪些信息
- 最终确认交互方式和视觉方向

### 5. 页面实现与上线部署

方案稳定后，再把内容真正落成网站，包括：

- 前端页面实现
- 动效和切换联调
- 媒体内容接入
- 访问记录链路接入
- 本地测试与线上部署

### 6. 访问记录反馈与持续迭代

项目上线后，我会继续通过访问记录看：

- 哪些页面被访问得更多
- 访问来源和页面路径是什么
- 设备、系统和浏览器分布如何
- 后续应该优化哪些展示内容和模块顺序

## 流程图说明

仓库内已经补充流程图源文件：

- `docs/ai-assisted-workflow.drawio`

这份流程图和上面的流程说明一一对应，展示了从素材输入到访问反馈迭代的 6 个阶段。  
你可以直接用 draw.io / diagrams.net 打开它继续编辑。

## 系统结构与模块

当前网站采用单页多视图结构，主要包含：

- `Home`
  开场信息、身份表达和进入网站的第一视图
- `About`
  背景介绍、能力方向和技术栈
- `Projects`
  项目卡片、项目详情弹层和真实项目链接
- `Media`
  旅行照片和视频内容展示
- `Links`
  GitHub、外部平台和分发入口
- `Contact`
  联系方式和合作方向

访问记录链路：

- 前端在视图切换时触发访问记录
- 本地开发时请求 `http://127.0.0.1:3000/api/track-visit`
- 线上部署时请求同域 `/api/track-visit`
- 服务端解析路径、设备、系统、浏览器、设备型号和属地信息后写入数据库

## 技术栈

前端与交互：

- React 19
- Vite
- Framer Motion
- CSS

运行与服务：

- Node.js
- Vercel Functions
- MySQL

辅助能力：

- Client Hints / User-Agent 解析
- 本地与线上统一的访问记录接口

## 项目结构

```text
.
├── README.md
├── index.html
├── package.json
├── server.js
├── api
│   └── track-visit.js
├── docs
│   └── ai-assisted-workflow.drawio
├── lib
│   └── device-models.js
├── src
│   ├── App.jsx
│   ├── main.jsx
│   ├── data
│   │   └── site-data.js
│   └── utils
│       ├── fluid-bg.js
│       └── tracking.js
├── assets
│   ├── boy.png
│   ├── css
│   │   ├── animations.css
│   │   └── main.css
│   └── js
│       ├── gallery-viewer.js
│       └── lab-scene.js
└── public
    └── assets
        └── boy.png
```

## 本地运行

### 1. 启动前端开发环境

```bash
npm install
npm run dev
```

### 2. 启动本地访问记录服务

```bash
npm run track:local
```

默认配置：

- 接口地址：`http://127.0.0.1:3000/api/track-visit`
- 数据库：`personal_website`
- 表：`visit_logs`
- MySQL 客户端：`/opt/homebrew/bin/mysql`

### 3. 验证访问记录

打开网站后切换不同视图，访问记录会自动写入 `visit_logs`。  
你可以在 MySQL 中查看：

```sql
SELECT * FROM visit_logs ORDER BY visited_at DESC LIMIT 20;
```

## 线上部署与访问记录

如果要让部署在 Vercel 上的网站把访问记录写入云端 MySQL，项目已经预留好了：

- 接口：`/api/track-visit`
- Vercel Function 文件：`api/track-visit.js`
- 前端生产环境自动请求同域接口

### 1. 创建基础表

```sql
CREATE TABLE visit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ip VARCHAR(64),
  user_agent TEXT,
  path VARCHAR(255),
  referer TEXT,
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 按需补充字段

设备字段：

```sql
ALTER TABLE visit_logs
ADD COLUMN device_type VARCHAR(32) NULL,
ADD COLUMN os VARCHAR(32) NULL,
ADD COLUMN browser VARCHAR(32) NULL;
```

设备型号与系统版本：

```sql
ALTER TABLE visit_logs
ADD COLUMN device_model VARCHAR(128) NULL,
ADD COLUMN os_version VARCHAR(64) NULL;
```

设备原始型号：

```sql
ALTER TABLE visit_logs
ADD COLUMN device_model_raw VARCHAR(128) NULL;
```

浏览器版本：

```sql
ALTER TABLE visit_logs
ADD COLUMN browser_version VARCHAR(64) NULL;
```

IP 属地：

```sql
ALTER TABLE visit_logs
ADD COLUMN country VARCHAR(64) NULL,
ADD COLUMN region VARCHAR(64) NULL,
ADD COLUMN city VARCHAR(128) NULL;
```

### 3. 配置 Vercel 环境变量

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_SSL`

例如使用 Aiven：

- `MYSQL_HOST=<your-aiven-host>`
- `MYSQL_PORT=<your-aiven-port>`
- `MYSQL_USER=avnadmin`
- `MYSQL_PASSWORD=<your-aiven-password>`
- `MYSQL_DATABASE=defaultdb`
- `MYSQL_SSL=true`

### 4. 地理信息与自动化流量处理

线上会优先读取 Vercel 官方请求头：

- `x-vercel-ip-country`
- `x-vercel-ip-country-region`
- `x-vercel-ip-city`

如果请求头信息不完整，会再用 `ipapi.co` 做一次兜底。  
同时项目会忽略一部分明显的自动化流量，例如：

- `vercel-screenshot/1.0`
- `HeadlessChrome/...`
- 常见 `bot / crawler / spider / preview` 标识

## 数据库连接与常用查询

连接云端 MySQL：

```bash
mysql --user avnadmin --password=你的密码 --host 你的host --port 你的端口 defaultdb
```

查看表：

```sql
SHOW TABLES;
```

查看表结构：

```sql
DESCRIBE visit_logs;
```

看最近访问：

```sql
SELECT id, path, visited_at
FROM visit_logs
ORDER BY id DESC
LIMIT 20;
```

看完整访问和设备原始信息：

```sql
SELECT id, ip, path, referer, user_agent, visited_at
FROM visit_logs
ORDER BY id DESC
LIMIT 20;
```

看某个页面最近访问：

```sql
SELECT id, ip, path, referer, device_type, os, browser, visited_at
FROM visit_logs
WHERE path = '/#media'
ORDER BY id DESC
LIMIT 20;
```

看页面访问次数：

```sql
SELECT path, COUNT(*) AS visits
FROM visit_logs
GROUP BY path
ORDER BY visits DESC;
```

看最近 24 小时页面访问次数：

```sql
SELECT path, COUNT(*) AS visits
FROM visit_logs
WHERE visited_at >= NOW() - INTERVAL 1 DAY
GROUP BY path
ORDER BY visits DESC;
```

看设备类型分布：

```sql
SELECT device_type, COUNT(*) AS visits
FROM visit_logs
GROUP BY device_type
ORDER BY visits DESC;
```

看国家 / 地区 / 城市分布：

```sql
SELECT country, region, city, COUNT(*) AS visits
FROM visit_logs
GROUP BY country, region, city
ORDER BY visits DESC;
```

看浏览器分布：

```sql
SELECT browser, COUNT(*) AS visits
FROM visit_logs
GROUP BY browser
ORDER BY visits DESC;
```

看今天访问总数：

```sql
SELECT COUNT(*) AS today_visits
FROM visit_logs
WHERE DATE(visited_at) = CURDATE();
```

删除测试数据：

```sql
DELETE FROM visit_logs;
```

重置自增 ID：

```sql
ALTER TABLE visit_logs AUTO_INCREMENT = 1;
```

## 时间与设备说明

- `visited_at` 现在按中国时区 `Asia/Shanghai` 写入
- `device_type / os / browser` 只有在你为表添加了对应字段之后，新访问才会写入
- `country / region / city` 只有在你为表添加了对应字段之后，新访问才会写入
- 你仍然可以通过 `user_agent` 查看完整原始设备字符串
- Web 场景里通常拿不到稳定的精确设备型号，但设备类型、系统、浏览器和属地可以稳定记录

## 素材管理

真实素材建议统一放在：

- 照片：`assets/media/photos/<album-name>/`
- 视频封面：`assets/media/posters/<album-name>/`
- 视频文件：`assets/media/videos/<album-name>/`

例如当前川西素材：

- `assets/media/photos/chuanxi/`
- `assets/media/posters/chuanxi-drive/`
- `assets/media/videos/chuanxi-drive/`

## 后续计划

- 继续补充真实项目与真实链接
- 持续优化移动端浏览体验
- 根据访问记录继续调整模块顺序和信息优先级
- 补充更多个人表达与内容更新入口

## 说明

这个仓库既是我的个人网站，也是我持续整理内容、更新项目和观察访问反馈的地方。  
AI 在其中主要承担辅助分析、起草和比较的角色，不替代最终判断。
