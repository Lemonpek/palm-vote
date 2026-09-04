# 掌上表态 / Palm Vote

一个在桌面浏览器中运行的本地实时互动应用。用户张开手掌后，手掌正面朝向画面显示绿色 **✓**，翻转到手背显示红色 **✕**。视频帧只在当前设备内存中处理。

界面支持中文和英文。首次访问跟随浏览器语言，之后在本机记住用户选择。控制栏中的“使用说明 / Instructions”按钮可打开英文图示说明。

## 版本与回退

- 当前升级版：`outputs/palm-vote`
- 摄像头旧版完整副本：`outputs/palm-vote-v1-camera-2026-09-03`

旧版可独立运行：

```bash
cd outputs/palm-vote-v1-camera-2026-09-03
pnpm dev -- --port 4174
```

## 本地运行

需要 Node.js 20 或更高版本及 pnpm。

```bash
pnpm install
pnpm dev
```

打开 `http://127.0.0.1:4173`。生产检查：

```bash
pnpm test
pnpm build
```

目标浏览器为最新版 Chrome 和 Microsoft Edge；页面必须通过 localhost、127.0.0.1 或 HTTPS 打开。

## 在 Teams 中使用

1. 在工具中选择“Teams 屏幕/窗口”，点击“选择 Teams 窗口”。
2. 在浏览器系统共享选择器中选择 Teams 窗口，不要选择本工具窗口。
3. 保持 Teams 窗口可见且不要最小化。
4. 如需所有参会者看到处理结果，在 Teams 中共享“掌上表态 / Palm Vote”浏览器窗口。

推荐双屏或分离窗口：一个窗口保持 Teams 画廊，另一个显示并共享处理结果。浏览器安全规则要求每次重新启动屏幕识别时手动选择共享来源，应用不能代替用户授权。

## 目录结构

```text
src/
├─ capture/CaptureManager.ts       # 屏幕与摄像头流、权限及资源释放
├─ vision/HandDetector.ts          # MediaPipe 检测、Teams 分区扫描及坐标映射
├─ orientation/PalmOrientation.ts # 开放手掌置信度和正反判断
├─ tracking/HandTracker.ts         # 24 手 ID、状态隔离、平滑与遮挡恢复
├─ render/PaddleRenderer.ts        # 视频、握持式手举牌和调试层
├─ hooks/useHandExperience.ts      # 实时识别循环与界面状态
├─ components/                     # 双语界面组件
├─ config.ts                       # 集中可调参数
└─ *.test.ts                       # 姿态、追踪、分区和语言测试
```

模型和 WebAssembly 位于 `public/`，不依赖远程 CDN。

## 技术与隐私

- React 19、Vite 8：界面和构建，MIT。
- MediaPipe Tasks Vision 1.0.1 与 Hand Landmarker：21 点手部关键点，Apache-2.0。
- Screen Capture API / Camera API：读取用户主动选择的 Teams 窗口或摄像头。
- Canvas 2D：绘制视频、虚拟牌、动画及可选调试信息。

应用不上传、保存、截图或录制视频，不采集共享音频，也不进行人脸、身份或参会者识别。停止识别、停止共享或关闭网页后会立即释放视频轨道。

## 手掌正反与翻转判断

算法使用腕点、食指 MCP 和小指 MCP 形成的二维有向掌平面，并以 MediaPipe 左右手结果归一化绕向。完整画面时检查四根手指；手掌被边缘截断时，只要至少两根手指和对应 MCP/PIP 关键点清晰可见即可尝试判断，证据不足时不猜测。

正反面分数由两部分组成：

- 归一化绕向为正且手掌充分张开：手掌正面，显示 ✓
- 归一化绕向为负且手掌充分张开：手背，显示 ✕

朝向置信度至少为 0.42，连续 3 帧且持续 100 ms 才切换。侧面、未张开或低置信度期间保持最近可信状态，持续超过 900 ms 后隐藏。

## Teams 多人和会议室画面

摄像头模式处理完整画面。Teams 模式将画面分成带 12% 重叠的 2×2 区域，每约 25 ms 轮询一个区域，使小视频格中的手获得约两倍有效尺寸。区域结果映射回全画面坐标，并由一个最多 24 轨迹的追踪器统一去重。

只把当前扫描区中的未匹配轨迹标记为缺失，因此扫描其他区域时不会让已有手势闪烁。每条轨迹分别保存手掌朝向、防抖和 ✓/✕ 状态；某位同事翻转手掌不会改变其他人的结果。

## 手持牌渲染

手举牌以腕点和掌指关节计算手掌中心与方向，显示在手掌附近并随手部移动、旋转和缩放。牌面半径按手掌宽度自动调整，并保留完整手柄、翻转动画和遮挡渐隐。

样式位于 `src/render/PaddleRenderer.ts` 的 `drawPaddle()`；可调整主色、外沿、手柄、圆形牌面和 ✓/✕ 路径，也可替换为透明 PNG/SVG。

## 关键参数

| 参数 | 默认值 | 作用 |
|---|---:|---|
| `maxHands` | 24 | 全局最大手部轨迹 |
| `inferenceIntervalMs` | 25 ms | 推理轮询间隔；Teams 四区约 100 ms 完成一轮 |
| `minDetectionConfidence` | 0.46 | 首次检测阈值（边缘/小画面优先召回） |
| `orientationConfidence` | 0.42 | 正反面可信阈值 |
| `orientationStableFrames` | 3 | 切换所需连续帧数 |
| `orientationStableMs` | 100 ms | 切换所需持续时间 |
| `lowConfidenceHideMs` | 900 ms | 方向不可信后的隐藏时间 |
| `occlusionHoldMs` | 650 ms | 短暂遮挡保留 |
| `trackMaxAgeMs` | 1400 ms | 轨迹删除时间 |
| `screenRegionOverlap` | 0.12 | Teams 分区重叠比例 |

## 已知限制

- Teams 的网络压缩、运动模糊、暗光和很小的视频格会直接影响关键点质量；边缘截断时至少保留两根清晰伸展的手指和掌指关节。
- Teams 重排视频格、切换主讲人或手部长时间完全重叠后，追踪 ID 可能重新分配。
- 浏览器不能后台读取 Teams、绕过系统共享选择器或保证最小化窗口继续出帧。
- 本地同时检测 24 只手取决于电脑 GPU/CPU；帧率不足时优先降低 `maxHands` 或提高 `inferenceIntervalMs`。
- 自动测试覆盖算法和页面状态；真实 Teams 压缩画质及超过 24 人现场效果仍需在目标会议环境中校准。
