# 温氏采购 · 首页完整包

独立、可离线运行的首页（含地球、导航、行情与简报区块、本地字体）。不依赖仓库里其他页面。

## 运行

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

浏览器打开：http://127.0.0.1:8788/

若 8788 已被占用：

```powershell
$env:WENS_PORT = 8790
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

## 包含内容

- 首页文案、导航与章节（总览入口仍指向 `overview.html`，本包不含该页）
- Three.js 地球（`globe.js` 全量，含贴图）
- Three.js r186、GSAP、ScrollTrigger、OrbitControls / 线条 / CSS2D
- Geist + Noto Sans SC 本地字体（不走 Google CDN）
