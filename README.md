# Lakphy Copilot

为所有输入框添加 AI 自动补全功能的 Chrome 扩展。

## 功能特点

- 在任何网页的输入框中提供智能文本补全
- 支持 OpenRouter 和 OpenAI API
- 可自定义模型选择
- 简洁美观的用户界面

## 安装方法

### 从 Chrome 商店安装

_即将上线_

### 手动安装

1. 克隆或下载此仓库
2. 安装依赖：`npm install` 或 `pnpm install`
3. 生成图标：`npm run generate-icons` 或 `pnpm run generate-icons`
4. 构建扩展：`npm run build` 或 `pnpm run build`
5. 在 Chrome 浏览器中打开 `chrome://extensions/`
6. 开启"开发者模式"
7. 点击"加载已解压的扩展程序"
8. 选择项目中的 `.output/chrome-mv3/` 目录

## 使用方法

1. 安装扩展后，点击工具栏中的扩展图标
2. 输入您的 API 密钥（OpenRouter 或 OpenAI）
3. 选择 API 提供商和模型
4. 保存设置
5. 现在，当您在任何网页的输入框中输入文字时，扩展将自动提供补全建议
6. 按 Tab 键或点击建议接受补全

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建扩展
npm run build

# 打包为zip文件
npm run zip
```

## 技术栈

- [WXT](https://wxt.dev/) - 浏览器扩展开发框架
- [React](https://react.dev/) - 用户界面库
- [AI SDK](https://sdk.vercel.ai/docs) - AI 模型集成

## 许可证

MIT
