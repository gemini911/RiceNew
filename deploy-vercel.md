# RiceApp Vercel 部署指南

## 📋 部署前检查清单

✅ **已完成检查的项目：**
- [x] 项目结构完整
- [x] Vercel配置文件已优化
- [x] API路由配置已修复 (适配 Supabase & Express)
- [x] 依赖包已添加（express, @supabase/supabase-js, cors）
- [x] 构建测试通过

## 🚀 部署步骤

### 方法一：通过Vercel CLI部署（推荐）

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel --prod
   ```

### 方法二：通过GitHub集成部署

1. **提交代码到GitHub**
   ```bash
   git add .
   git commit -m "配置Supabase并优化Vercel部署"
   git push origin main
   ```

2. **在Vercel控制台配置**
   - 访问 [Vercel官网](https://vercel.com)
   - 连接您的GitHub账户
   - 导入RiceApp项目
   - 配置环境变量（见下文）

## 🔧 环境变量配置

在Vercel控制台中设置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|----|------|
| `SUPABASE_URL` | `https://ljkqxfzeuxlztasxjiwd.supabase.co` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | `sb_publishable_mNpQtaQh_3EBVTW0ZwasXg_Ps-f5kKO` | Supabase Public Key |

**重要：** 不要设置 `REACT_APP_API_BASE_URL` 环境变量，前端会自动使用相对路径。

## 📁 项目结构说明

```
RiceApp/
├── api/
│   └── data.js              # API服务器（Express App, Vercel Serverless Function）
├── src/                     # React前端源码
├── build/                   # 构建输出目录
├── package.json             # 项目配置和依赖
├── vercel.json             # Vercel部署配置
└── deploy-vercel.md        # 本部署指南
```

## 🔍 部署后验证

### 1. 健康检查
```bash
curl https://your-app.vercel.app/api/data/health
```

### 2. API功能测试
```bash
# 测试获取数据
curl https://your-app.vercel.app/api/data

# 测试添加项目
curl -X POST https://your-app.vercel.app/api/data/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","points":10}'
```

### 3. 前端页面访问
访问您的Vercel域名，检查页面是否正常加载。

## 🛠️ 故障排除

### 常见问题及解决方案

**问题1：API返回404错误**
- 检查 `vercel.json` 配置是否正确
- 确认 `api/data.js` 导出的是 Express App

**问题2：Supabase连接失败**
- 检查环境变量 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确设置
- 检查 Supabase 项目的数据库表权限（RLS Policies）

**问题3：构建失败**
- 检查 `package.json` 依赖是否完整
- 运行 `npm install` 确保所有依赖已安装

**问题4：CORS错误**
- API已配置CORS，无需额外设置
- 检查前端API调用是否使用相对路径

## 📈 性能优化

已实施的优化措施：
- ✅ API请求使用相对路径，避免跨域延迟
- ✅ 增加请求节流（10秒间隔）
- ✅ 添加数据缓存机制（30秒缓存）
- ✅ 优化Vercel路由配置
- ✅ 使用 Supabase 替代内存存储，数据持久化

## 🔗 相关链接

- [Vercel官方文档](https://vercel.com/docs)
- [Supabase文档](https://supabase.com/docs)
- [React部署指南](https://create-react-app.dev/docs/deployment/)

## 💡 技术支持

如遇到部署问题，请检查：
1. 控制台错误信息
2. Vercel部署日志
3. 浏览器Network面板

---

**部署状态：** ✅ 代码已优化，可立即部署到Vercel