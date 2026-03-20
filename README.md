# 王一轩｜数字作品集

线上地址：[buildspace.top](https://www.buildspace.top)

这是我的个人网站项目，用来个人介绍、项目展示、旅行照片与视频、平台入口和联系方式。  


## 网站定位

这个网站主要承担 3 个作用：

- 个人主页：介绍我是谁、我在做什么、我关注哪些方向
- 项目展示：集中展示项目简介、技术栈和后续真实链接
- 内容入口：承接旅行照片、视频和各个平台分发入口

## 当前模块

当前网站采用单页多视图结构，主要包含：

- `Home`
  展示名字、身份、简短介绍和开场动效
- `About`
  展示背景简介、技能方向和技术栈
- `Projects`
  使用卡片展示项目内容
- `Media`
  展示旅行照片和视频内容
- `Links`
  放 GitHub 和其他平台入口
- `Contact`
  放联系方式和合作方向

## 交互特点

- Three.js 粒子背景
- GSAP 开场动画与场景切换
- 单页 `view` 切换，不依赖真实多页面跳转
- 自定义光标（桌面端）
- 移动端顶部抽屉导航
- 照片全屏查看与左右切换
- 视频全屏查看与左右切换

## 技术栈

- HTML
- Tailwind CSS（CDN）
- Three.js
- GSAP
- 原生 JavaScript

## 项目结构

```text
.
├── index.html
├── README.md
└── assets
    ├── boy.png
    ├── css
    │   ├── animations.css
    │   └── main.css
    ├── js
    │   ├── gallery-viewer.js
    │   ├── lab-scene.js
    │   └── main.js
    └── media
        ├── photos
        ├── posters
        └── videos
```

## 本地运行

这是一个静态前端项目，直接用本地静态服务器即可运行。

例如：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 本地访问记录测试

如果你想把访问记录写入本地 MySQL，可以同时启动一个本地记录服务：

```bash
node server.js
```

默认配置：

- 接口地址：`http://127.0.0.1:3000/api/track-visit`
- 数据库：`personal_website`
- 表：`visit_logs`
- MySQL 客户端：`/opt/homebrew/bin/mysql`

然后再开一个终端运行静态站：

```bash
python3 -m http.server 8000
```

打开网站后，访问记录会自动写入 `visit_logs`。  
你可以在 MySQL 中查看：

```sql
SELECT * FROM visit_logs ORDER BY visited_at DESC LIMIT 20;
```

## 线上访问记录

如果要让部署在 Vercel 上的网站把访问记录写入云端 MySQL，项目已经预留好了：

- 接口：`/api/track-visit`
- Vercel Function 文件：`api/track-visit.js`
- 前端会在生产环境自动请求同域接口

你需要做的是：

1. 安装依赖

```bash
npm install
```

2. 在云端 MySQL 中创建数据库和 `visit_logs` 表

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

如果你想把设备类型、系统和浏览器单独存下来，在线上已经支持这几个字段。对现有表执行一次：

```sql
ALTER TABLE visit_logs
ADD COLUMN device_type VARCHAR(32) NULL,
ADD COLUMN os VARCHAR(32) NULL,
ADD COLUMN browser VARCHAR(32) NULL;
```

如果你还想记录 IP 属地，可以继续补这 3 列：

```sql
ALTER TABLE visit_logs
ADD COLUMN country VARCHAR(64) NULL,
ADD COLUMN region VARCHAR(64) NULL,
ADD COLUMN city VARCHAR(128) NULL;
```

线上部署在 Vercel 时，会优先读取官方地理请求头：

- `x-vercel-ip-country`
- `x-vercel-ip-country-region`
- `x-vercel-ip-city`

参考文档：

- https://vercel.com/docs/headers/request-headers
- https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions

3. 在 Vercel 项目环境变量中配置：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_SSL`

例如使用 Aiven 时，一般会像这样：

- `MYSQL_HOST=<your-aiven-host>`
- `MYSQL_PORT=<your-aiven-port>`
- `MYSQL_USER=avnadmin`
- `MYSQL_PASSWORD=<your-aiven-password>`
- `MYSQL_DATABASE=defaultdb`
- `MYSQL_SSL=true`

4. 重新部署后，网站访问会自动写入云端 MySQL

## 数据库连接与常用操作

如果你要从本地终端连接云端 MySQL，可以使用 Aiven 提供的命令，格式大致如下：

```bash
mysql --user avnadmin --password=你的密码 --host 你的host --port 你的端口 defaultdb
```

连接成功后会看到：

```text
mysql>
```

这时就可以直接执行 SQL 查询。

看当前数据库里有哪些表：

```sql
SHOW TABLES;
```

看 `visit_logs` 表结构：

```sql
DESCRIBE visit_logs;
```

## 访问记录查询手册

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

看最近访问，并直接查看设备、系统、浏览器：

```sql
SELECT id, ip, path, device_type, os, browser, visited_at
FROM visit_logs
ORDER BY id DESC
LIMIT 20;
```

如果你已经给表补了设备字段，可以这样查：

```sql
SELECT id, ip, path, device_type, os, browser, visited_at
FROM visit_logs
ORDER BY id DESC
LIMIT 20;
```

如果你也补了属地字段，可以这样查完整访问画像：

```sql
SELECT id, ip, path, country, region, city, device_type, os, browser, visited_at
FROM visit_logs
ORDER BY id DESC
LIMIT 20;
```

看某个页面最近被谁访问过：

```sql
SELECT id, ip, path, referer, device_type, os, browser, visited_at
FROM visit_logs
WHERE path = '/#media'
ORDER BY id DESC
LIMIT 20;
```

看某个来源最近带来了哪些访问：

```sql
SELECT id, ip, path, referer, visited_at
FROM visit_logs
WHERE referer LIKE '%buildspace.top%'
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

看国家分布：

```sql
SELECT country, COUNT(*) AS visits
FROM visit_logs
GROUP BY country
ORDER BY visits DESC;
```

看地区分布：

```sql
SELECT country, region, COUNT(*) AS visits
FROM visit_logs
GROUP BY country, region
ORDER BY visits DESC;
```

看城市分布：

```sql
SELECT country, region, city, COUNT(*) AS visits
FROM visit_logs
GROUP BY country, region, city
ORDER BY visits DESC;
```

看操作系统分布：

```sql
SELECT os, COUNT(*) AS visits
FROM visit_logs
GROUP BY os
ORDER BY visits DESC;
```

看浏览器分布：

```sql
SELECT browser, COUNT(*) AS visits
FROM visit_logs
GROUP BY browser
ORDER BY visits DESC;
```

看来源分布：

```sql
SELECT referer, COUNT(*) AS visits
FROM visit_logs
GROUP BY referer
ORDER BY visits DESC;
```

看访客 IP 分布：

```sql
SELECT ip, COUNT(*) AS visits
FROM visit_logs
GROUP BY ip
ORDER BY visits DESC;
```

看今天的访问总数：

```sql
SELECT COUNT(*) AS today_visits
FROM visit_logs
WHERE DATE(visited_at) = CURDATE();
```

看最近一次访问：

```sql
SELECT *
FROM visit_logs
ORDER BY id DESC
LIMIT 1;
```

删除所有测试数据：

```sql
DELETE FROM visit_logs;
```

重置自增 ID：

```sql
ALTER TABLE visit_logs AUTO_INCREMENT = 1;
```

## 时间与设备说明

- `visited_at` 现在按中国时区 `Asia/Shanghai` 写入
- 旧数据如果是在修正前写入的，时间可能还是旧时区
- `device_type / os / browser` 只有在你为表添加了对应字段之后，新访问才会写入
- `country / region / city` 也只有在你为表添加了对应字段之后，新访问才会写入
- 你仍然可以通过 `user_agent` 查看完整原始设备字符串
- 设备型号在 Web 场景里通常拿不到稳定的精确值，但设备类型、系统、浏览器和 IP 属地是可以稳定记录的

## 素材管理

网站里的真实素材建议统一放在：

- 照片：`assets/media/photos/<album-name>/`
- 视频封面：`assets/media/posters/<album-name>/`
- 视频文件：`assets/media/videos/<album-name>/`

例如当前川西素材：

- `assets/media/photos/chuanxi/`
- `assets/media/posters/chuanxi-drive/`
- `assets/media/videos/chuanxi-drive/`

后续如果继续新增其他城市、旅行或项目素材，建议继续按这个目录方式整理。

## 后续计划

- 将更多真实照片与视频替换当前占位内容
- 将项目卡片替换为真实项目与真实 GitHub / Demo 链接
- 持续优化移动端体验
- 逐步补充更多个人表达和内容更新入口

## 说明

这个仓库是我个人网站的持续迭代版本。  
它既是一个前端作品，也是我长期整理个人内容、项目和旅行记录的数字空间。
