# 生辰八字分析网站

这是一个基于Next.js和OpenAI API构建的生辰八字分析网站。用户可以输入性别、出生地和生辰八字信息，系统会通过OpenAI API进行分析，并返回详细的命理解读结果。

## 功能特点

- 简洁美观的用户界面
- 实时分析用户提交的生辰八字信息
- 详细的命理分析结果展示
- 响应式设计，适配各种设备

## 技术栈

- [Next.js](https://nextjs.org/) - React框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [OpenAI API](https://openai.com/) - AI分析引擎

## 本地开发

1. 克隆仓库

```bash
git clone https://github.com/yourusername/bazi-analyze.git
cd bazi-analyze
```

2. 安装依赖

```bash
npm install
```

3. 创建`.env.local`文件并添加OpenAI API密钥

```
OPENAI_API_KEY=your_openai_api_key_here
```

4. 启动开发服务器

```bash
npm run dev
```

5. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 部署到Vercel

1. 在[Vercel](https://vercel.com)上创建一个新项目
2. 连接到你的GitHub仓库
3. 在环境变量设置中添加`OPENAI_API_KEY`
4. 部署项目

## 使用方法

1. 在网站上选择性别（男/女）
2. 输入出生地（例如：北京市朝阳区）
3. 输入生辰八字（例如：1990年7月15日 12时30分）
4. 点击"开始分析"按钮
5. 等待分析结果显示

## 许可证

MIT
