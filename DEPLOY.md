# 部署指南 - 经典游戏合集

本文档提供了将“经典游戏合集”项目部署到 GitHub Pages 的详细步骤。

## 部署平台

- **平台**: GitHub Pages
- **触发方式**: 自动部署 (通过 GitHub Actions)
- **源分支**: `main`
- **源路径**: `/` (root)

## 自动部署 (推荐)

项目已配置好 GitHub Actions 工作流，会在每次向 `main` 分支推送提交时自动执行部署。

**工作流文件**: `.github/workflows/deploy.yml`

**流程概述**:
1.  **触发**: 当 `main` 分支有新的 `push` 事件。
2.  **检出代码**: 使用 `actions/checkout@v3` 拉取最新代码。
3.  **设置 Pages**: 使用 `actions/configure-pages@v3` 配置 GitHub Pages 环境。
4.  **上传构建物**: 使用 `actions/upload-pages-artifact@v2` 将项目文件打包为构建物。
5.  **部署**: 使用 `actions/deploy-pages@v2` 将构建物部署到 GitHub Pages。

您只需将代码推送到 `main` 分支，部署过程将自动完成。

## 手动部署

如果您需要手动部署，请按照以下步骤操作：

### 1. 配置仓库设置

- 打开您的 GitHub 仓库页面。
- 点击 **Settings** -> **Pages**。
- 在 **Build and deployment** 下，选择 **Source** 为 **Deploy from a branch**。
- 在 **Branch** 下，选择 `main` 分支和 `/ (root)` 目录。
- 点击 **Save**。

### 2. 推送代码

将您的本地代码提交并推送到 `main` 分支：

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3. 验证部署

- 推送后，返回仓库的 **Actions** 标签页，您会看到一个名为 `deploy` 的工作流正在运行。
- 等待工作流执行成功（通常需要1-2分钟）。
- 部署成功后，访问您的 GitHub Pages URL (例如: `https://<your-username>.github.io/kiloc4games/`) 即可看到最新的网站。

## 注意事项

- **缓存问题**: 由于浏览器缓存，您的最新更改可能不会立即显示。请尝试强制刷新 (`Ctrl+F5` 或 `Cmd+Shift+R`) 或清除浏览器缓存。
- **自定义域名**: 如果您配置了自定义域名，请确保相关的DNS设置是正确的。

---
**文档版本**: 1.0  
**最后更新**: 2025-07-29