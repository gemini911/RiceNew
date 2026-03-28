# EdgeOne全栈部署指南

## 项目概述
本项目是一个全栈应用，包含：
- 前端：React单页应用
- 后端：Node.js API服务（适配LeanCloud）

## 部署前准备

### 1. 环境要求
- Node.js >= 14.0.0
- npm 或 yarn

### 2. 本地测试
```bash
# 安装依赖
npm install

# 构建前端
npm run build

# 启动后端API（测试用）
cd api && node data.js
```

## EdgeOne Pages部署步骤

### 1. 登录腾讯云控制台
- 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
- 进入 EdgeOne 服务

### 2. 创建EdgeOne Pages项目
1. 点击"Pages"服务
2. 点击"新建项目"
3. 选择部署方式：
   - **Git仓库部署**（推荐）：关联GitHub/GitLab仓库
   - **手动上传**：上传项目zip包

### 3. 配置项目设置

#### 构建配置
- **构建命令**: `npm run build`
- **输出目录**: `build`
- **Node版本**: 16.x

#### 环境变量
在项目设置中添加以下环境变量：
```
LEANCLOUD_APP_ID=iqseIsVajhxxl3v6x9O1upkO-gzGzoHsz
LEANCLOUD_APP_MASTER_KEY=WrpnPZFUFALs8OUgzwjzEnZr
LEANCLOUD_SERVER_URL=https://iqseisva.lc-cn-n1-shared.com
```

#### 路由配置
EdgeOne Pages会自动识别以下路由：
- `/api/data/*` → 后端API函数
- `/*` → 前端静态页面

### 4. 部署和验证

#### 部署命令（如果使用CLI）
```bash
# 安装EdgeOne CLI
npm install -g @tencent/edgeone-cli

# 登录
edgeone login

# 部署
edgeone deploy
```

#### 验证部署
部署完成后，测试以下端点：

```bash
# 测试健康检查
curl https://您的域名/health

# 测试API调试模式
curl "https://您的域名/api/data?debug=true"

# 测试前端页面
curl https://您的域名/
```

## 备选方案：EdgeOne反向代理

如果EdgeOne Pages不可用，可以使用反向代理配置：

### 1. 配置API源站
- 源站类型：自定义域名
- 地址：`iqseisva.lc-cn-n1-shared.com`
- 端口：443

### 2. 配置路径规则
- 规则1：`/api/data` → 指向API源站，禁用缓存
- 规则2：`/api/data/*` → 指向API源站，禁用缓存

## 故障排除

### 常见问题

1. **API返回404**
   - 检查环境变量是否正确配置
   - 验证LeanCloud应用ID和密钥

2. **前端页面无法加载**
   - 检查构建是否成功
   - 验证路由配置

3. **CORS错误**
   - 后端已配置CORS，确保域名正确

### 调试工具

使用调试模式检查环境变量：
```bash
curl "https://您的域名/api/data?debug=true"
```

## 项目结构说明

```
RiceApp/
├── src/                 # 前端React源码
├── api/                 # 后端API代码
│   └── data.js          # 主API处理函数
├── build/               # 前端构建输出
├── public/              # 前端静态资源
├── package.json         # 前端依赖配置
├── package-leancloud.json # 后端依赖配置
├── edgeone.json         # EdgeOne Pages配置
└── deploy-edgeone.md    # 本部署指南
```

## 技术支持

如有问题，请参考：
- [EdgeOne官方文档](https://cloud.tencent.com/document/product/1552)
- [LeanCloud文档](https://leancloud.cn/docs/)

---
**部署状态**: ✅ 配置文件已准备就绪
**下一步**: 登录EdgeOne控制台开始部署