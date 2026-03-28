#!/bin/bash

# EdgeOne全栈部署脚本
# 作者: AI助手
# 描述: 自动化部署RiceApp到EdgeOne Pages

echo "🚀 RiceApp EdgeOne全栈部署脚本"
echo "================================"

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 构建前端
echo "🔨 构建前端应用..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 检查后端依赖
echo "📦 检查后端依赖..."
if [ -f "package-leancloud.json" ]; then
    echo "✅ 后端配置已就绪"
else
    echo "❌ 后端配置文件缺失"
    exit 1
fi

# 检查EdgeOne配置文件
if [ -f "edgeone.json" ]; then
    echo "✅ EdgeOne配置已就绪"
else
    echo "❌ EdgeOne配置文件缺失"
    exit 1
fi

echo ""
echo "🎉 本地准备完成！"
echo ""
echo "下一步操作："
echo "1. 登录腾讯云EdgeOne控制台：https://console.cloud.tencent.com/edgeone"
echo "2. 进入Pages服务"
echo "3. 创建新项目并关联Git仓库或上传代码"
echo "4. 配置环境变量（参考deploy-edgeone.md）"
echo "5. 触发部署"
echo ""
echo "📋 环境变量配置："
echo "SUPABASE_URL=https://ljkqxfzeuxlztasxjiwd.supabase.co"
echo "SUPABASE_ANON_KEY=sb_publishable_mNpQtaQh_3EBVTW0ZwasXg_Ps-f5kKO"
echo ""
echo "🔗 部署完成后测试命令："
echo "curl https://您的域名/health"
echo "curl \"https://您的域名/api/data?debug=true\""
echo ""
echo "💡 详细说明请查看 deploy-edgeone.md 文件"