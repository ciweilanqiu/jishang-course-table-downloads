# 吉商课程表下载入口

本仓库仅用于公开下载页和版本清单，不存放 Android 应用源码、个人课表、认证信息或签名密钥。

主下载站使用现有 Cloudflare Pages `kechengbiao` 项目： https://kechengbiao-68f.pages.dev/ 。App 更新清单仍为 https://kechengbiao-68f.pages.dev/update.json ，不因增加备用网页而改变。主站与备用站独立部署，不互相覆盖发布配置。

GitHub 备用下载页使用本仓库根目录，目标地址为 https://ciweilanqiu.github.io/jishang-course-table-downloads/ 。页面采用与主站一致的「轻盈紫云」风格，独立加载本站 `app.js`、`manifest.mjs` 和 `update.json`，安装包来自本仓库的 GitHub Release；无需通过 Cloudflare 获取资源。页面仅在用户点击下载按钮后下载，不自动下载或跳转到主站。目标网址与本地测试通过不等于已发布，仍须完成 Pages 部署和匿名访问验证。

当前正式包：V1.2.1 / versionCode=5，9,079,168 字节，使用原正式证书签名，包含更新地址。线上安装包已经匿名下载并核对大小、签名和 SHA-256。网页展示 QQ 群 549013926，不展示 SHA-256；真实校验值仍保留在更新清单中。旧版 App 更新地址为空，已有用户需要先通过链接手动覆盖安装一次。

本次仅使用现有 GitHub 仓库的 Pages 和 Release 功能，不增加付费托管服务。公开仓库只同步经过审查的下载网页、清单、说明和网页测试；安装包作为 Release 资产单独上传，不上传整个本地工作目录。

## GitHub 备用站发布与维护

1. 使用已经验收的同一个正式签名 APK，不重新构建或更换证书。先上传至固定版本 Release，再更新根目录 `update.json`。V1.2.1 / code5 的 tag 为 `v1.2.1-code5`，资产名为 `CourseTable-v1.2.1-code5-release.apk`。
2. 清单仅更换对应 GitHub Release 的 `downloadUrl`，其余 APK 元数据、校验值、更新说明和发布时间与实际发布包保持一致。APK 不进入 Git 源码历史。
3. 下载地址必须严格匹配 `https://github.com/ciweilanqiu/jishang-course-table-downloads/releases/download/v{versionName}-code{versionCode}/CourseTable-v{versionName}-code{versionCode}-release.apk`；校验器拒绝 debug、外部仓库、不匹配版本、查询参数及未版本化地址。校验失败时不显示下载按钮。
4. 根页使用相对资源路径，适配 `/jishang-course-table-downloads/` 项目子路径。QQ群 549013926 可复制，网页不展示 SHA-256；校验值仍保留在清单中。
5. 运行 `node --test github/test/download-page.test.mjs`。上线后另行核验 Pages 页面、清单及 Release APK 的匿名 HTTPS 访问、大小和校验值，并确认首次打开及刷新均不会自动下载。
6. 保留历史 Release 资产及原生产提交；需要回滚时恢复此前根页面/清单并重新部署。备用网站不会自动更改 App 内更新源，后续新版需分别维护两个站点的对应发布清单。
