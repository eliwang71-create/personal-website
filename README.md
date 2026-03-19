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
