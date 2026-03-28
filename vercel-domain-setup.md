# Vercel国内域名配置指南

## 概述
本文档详细说明如何将Vercel部署的项目连接国内域名，包括备案注意事项和优化方案。

## 重要提醒

### 备案要求
- **国内域名（.com/.cn/.net等）必须备案**
- Vercel服务器位于国外，使用国内域名需要ICP备案
- 未备案域名可能被运营商拦截

### 推荐方案
1. **国际域名**：使用.io、.dev、.app等无需备案的域名
2. **Cloudflare加速**：通过Cloudflare CDN改善国内访问速度
3. **备案后使用**：如已备案，可配置国内CDN加速

## 配置步骤

### 第一步：部署到Vercel
```bash
# 确保项目已部署到Vercel
# 获得默认域名：your-project.vercel.app
```

### 第二步：域名DNS配置

#### 阿里云DNS配置示例
```
记录类型: CNAME
主机记录: www  # 或 @ 表示根域名
记录值: cname.vercel-dns.com
TTL: 600秒
线路类型: 默认
```

#### 腾讯云DNS配置示例
```
记录类型: CNAME
主机名: www.yourdomain.com
目标地址: cname.vercel-dns.com
TTL: 600
```

### 第三步：Vercel域名设置
1. 登录Vercel控制台
2. 进入项目设置 → Domains
3. 添加自定义域名：www.yourdomain.com
4. 等待DNS验证（通常需要几分钟到几小时）

## 优化国内访问速度

### 方案一：Cloudflare加速（推荐）
```
用户 → Cloudflare CDN → Vercel服务器
```

**Cloudflare配置：**
1. 将域名DNS指向Cloudflare
2. 在Cloudflare中添加CNAME记录指向Vercel
3. 开启以下优化：
   - CDN加速
   - 页面规则缓存
   - HTTP/2支持
   - Brotli压缩
   - 最小化CSS/JS

### 方案二：备案后使用国内CDN
如果已完成备案：
- 阿里云CDN：配置回源到Vercel
- 腾讯云CDN：类似配置
- 百度云加速：免费方案

## 故障排除

### DNS验证失败 - Invalid Configuration错误
**常见错误原因：**
- 使用了通用的`cname.vercel-dns.com`而不是Vercel提供的特定验证域名
- DNS记录未完全匹配Vercel的要求

**解决方案：**
1. 在域名服务商删除现有的CNAME记录
2. 使用Vercel提供的**精确验证域名**（如：`1121a2722279d2e7.vercel-dns-017.com`）
3. 重新添加CNAME记录
4. 等待DNS生效（5-30分钟）

**验证命令：**
```bash
# 检查CNAME记录是否正确
dig www.yourdomain.com CNAME
# 或使用nslookup
nslookup -type=CNAME www.yourdomain.com
```

### 其他DNS问题
- 检查CNAME记录是否正确
- 等待DNS完全生效（最长48小时）
- 使用dig命令验证：`dig www.yourdomain.com`

### 国内访问慢
- 使用Cloudflare等CDN加速
- 启用Vercel的边缘缓存
- 优化前端资源加载

### HTTPS证书问题
- Vercel自动提供SSL证书
- 确保域名解析正确
- 检查证书状态

## 最佳实践

1. **域名选择**：优先选择国际域名避免备案
2. **CDN配置**：始终使用CDN改善访问体验
3. **监控设置**：配置监控告警检测可用性
4. **备份方案**：保留Vercel默认域名作为备用

## 相关链接

- [Vercel官方域名文档](https://vercel.com/docs/projects/domains)
- [Cloudflare配置指南](https://developers.cloudflare.com/)
- [国内域名备案流程](https://beian.miit.gov.cn/)

---
*最后更新：2024年*