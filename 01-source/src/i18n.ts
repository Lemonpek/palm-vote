import type { AppErrorCode, ExperienceStatus, OrientationLabel } from './types';

export type Language = 'zh' | 'en';
export const LANGUAGE_STORAGE_KEY = 'palm-vote-language';

const zh = {
  pageTitle: '掌上表态',
  brand: '掌上表态',
  switchLanguage: 'Switch to English',
  status: {
    idle: '等待启动', requesting: '正在选择视频来源', 'loading-model': '正在加载识别模型',
    running: '识别中', stopped: '已停止', error: '需要处理',
  },
  handUnit: '只手', handUnitOne: '只手',
  stage: {
    aria: '实时视频识别预览', headline: '伸出手掌，翻转即可切换',
    description: '绿色 ✓ 或红色 ✕ 手举牌会自动贴合到每只张开的手掌附近。',
    requestingScreen: '请选择 Teams 窗口', requestingCamera: '正在请求摄像头权限',
    preparing: '正在准备本地手部识别', firstLoad: '首次启动可能需要几秒钟。',
    retry: '重新尝试', localOnly: '仅在本机处理',
  },
  controls: {
    aria: '视频输入控制', source: '视频来源', screen: 'Teams 屏幕/窗口', camera: '本机摄像头',
    cameraDevice: '摄像头设备', defaultCamera: '默认摄像头',
    startScreen: '选择 Teams 窗口', startCamera: '启动摄像头', stop: '停止识别',
    mirror: '镜像', debug: '调试', instructions: '使用说明', fullscreen: '全屏',
  },
  instruction: {
    headline: '伸出手掌并翻转手掌切换表态', palm: '手掌正面朝向画面显示', back: '手背朝向画面显示', separator: '，',
    privacy: '画面仅在本机处理，不上传、不保存、不录制',
    footer: '不进行人脸识别、身份识别或用户身份存储',
    dialogLabel: 'Palm Vote 使用说明', close: '关闭使用说明',
    imageAlt: '英文图示说明：在 Teams 中打开摄像头，手掌正面显示对勾，翻转手背显示叉号。',
  },
  help: {
    title: '帮助与设置', parameters: '识别参数', maxHands: '最多手掌', confidence: '检测置信度',
    orientation: '方向切换', occlusion: '遮挡保留', smoothing: '位置平滑', frames: '帧',
    teamsTitle: '在 Teams 中使用',
    teams1: '打开工具并选择“Teams 屏幕/窗口”，在系统共享选择器中选中 Teams 窗口。',
    teams2: '不要选择本工具窗口；保持 Teams 窗口可见且不要最小化。',
    teams3: '要让所有参会者看到结果，请在 Teams 中共享处理后的“掌上表态”浏览器窗口。',
    tipsTitle: '获得更稳定的效果',
    tip1: '让手掌完整张开，并与背景保持明显对比。',
    tip2: '翻转后稍作停留；手掌侧对画面时会保持最近一次可信结果。',
    tip3: '大画廊或会议室画面中，手掌接近边缘也可识别；尽量让至少两根手指清晰可见。',
    tip4: 'Teams 重新排列视频格或手部长时间完全重叠后，追踪 ID 可能重新分配。',
  },
  debug: {
    inference: '推理', left: '左手', right: '右手', unknown: '未知',
    palm: '手掌', back: '手背', side: '侧面', region: '当前扫描区',
  },
  errors: {
    'permission-denied': { title: '摄像头权限未开启', detail: '浏览器没有获得摄像头访问权限。', recovery: '请点击地址栏旁的摄像头图标，允许访问后重新启动。' },
    'not-found': { title: '未检测到摄像头', detail: '当前没有可用的视频输入设备。', recovery: '请连接摄像头，或检查系统隐私设置后重试。' },
    'not-readable': { title: '摄像头正被占用', detail: '其他应用可能正在使用这个摄像头。', recovery: '请关闭占用摄像头的应用，然后重试。' },
    overconstrained: { title: '摄像头参数不受支持', detail: '所选设备无法提供请求的画面规格。', recovery: '请选择其他摄像头，或断开后重新连接设备。' },
    unsupported: { title: '浏览器不支持摄像头访问', detail: '当前环境缺少必要的媒体设备接口。', recovery: '请使用最新版 Chrome 或 Microsoft Edge，并通过 localhost 或 HTTPS 打开。' },
    'model-load': { title: '手部识别模型加载失败', detail: '本地识别组件未能完成初始化。', recovery: '请检查连接或重新启动页面。' },
    disconnected: { title: '摄像头已断开', detail: '当前摄像头输入已停止。', recovery: '请重新连接设备并再次启动。' },
    'screen-unsupported': { title: '浏览器不支持屏幕捕获', detail: '当前环境无法读取共享的窗口或屏幕。', recovery: '请使用最新版 Chrome 或 Microsoft Edge，并通过 localhost 或 HTTPS 打开。' },
    'share-not-granted': { title: '未开始屏幕共享', detail: '共享选择器已关闭，或没有授予窗口读取权限。', recovery: '重新点击“选择 Teams 窗口”，并在系统窗口中选择 Teams。' },
    'share-ended': { title: '屏幕共享已结束', detail: 'Teams 窗口的视频输入已经停止。', recovery: '请重新选择 Teams 窗口以继续识别。' },
    'start-failed': { title: '无法启动视频识别', detail: '启动视频输入时发生了未知错误。', recovery: '请确认页面通过 localhost 或 HTTPS 打开，然后刷新重试。' },
  },
} as const;

type StringTree<T> = { [K in keyof T]: T[K] extends string ? string : StringTree<T[K]> };
export type AppCopy = StringTree<typeof zh> & {
  status: Record<ExperienceStatus, string>;
  errors: Record<AppErrorCode, { title: string; detail: string; recovery: string }>;
  debug: Record<'inference' | 'left' | 'right' | 'unknown' | OrientationLabel | 'region', string>;
};

const en: AppCopy = {
  pageTitle: 'Palm Vote',
  brand: 'Palm Vote',
  switchLanguage: '切换到中文',
  status: {
    idle: 'Ready to start', requesting: 'Selecting video source', 'loading-model': 'Loading hand model',
    running: 'Detecting', stopped: 'Stopped', error: 'Action needed',
  },
  handUnit: 'hands', handUnitOne: 'hand',
  stage: {
    aria: 'Live video recognition preview', headline: 'Raise your palm. Flip to switch.',
    description: 'A green ✓ or red ✕ paddle follows each open palm.',
    requestingScreen: 'Choose the Teams window', requestingCamera: 'Requesting camera permission',
    preparing: 'Preparing on-device hand detection', firstLoad: 'The first start may take a few seconds.',
    retry: 'Try again', localOnly: 'Processed on this device',
  },
  controls: {
    aria: 'Video input controls', source: 'Video source', screen: 'Teams screen/window', camera: 'Local camera',
    cameraDevice: 'Camera device', defaultCamera: 'Default camera',
    startScreen: 'Choose Teams window', startCamera: 'Start camera', stop: 'Stop recognition',
    mirror: 'Mirror', debug: 'Debug', instructions: 'Instructions', fullscreen: 'Fullscreen',
  },
  instruction: {
    headline: 'Raise your palm and flip it to vote', palm: 'Palm facing the video shows', back: 'Back of hand shows', separator: ',',
    privacy: 'Processed only on this device — never uploaded, saved, or recorded',
    footer: 'No face recognition, identity detection, or identity storage',
    dialogLabel: 'Palm Vote instructions', close: 'Close instructions',
    imageAlt: 'Visual instructions: turn on your camera in Teams, show your palm for a check, then flip your hand for an X.',
  },
  help: {
    title: 'Help & settings', parameters: 'Detection settings', maxHands: 'Maximum hands', confidence: 'Detection confidence',
    orientation: 'Orientation switch', occlusion: 'Occlusion hold', smoothing: 'Position smoothing', frames: 'frames',
    teamsTitle: 'Using with Teams',
    teams1: 'Select “Teams screen/window”, then choose the Teams window in the system share picker.',
    teams2: 'Do not select this tool window. Keep the Teams window visible and not minimized.',
    teams3: 'To show everyone the result, share the processed “Palm Vote” browser window from Teams.',
    tipsTitle: 'For more stable results',
    tip1: 'Keep the full palm open and use a background with visible contrast.',
    tip2: 'Pause briefly after flipping; a side-on palm keeps the last trusted result.',
    tip3: 'Cropped palms can still work when at least two fingers and their knuckles stay clearly visible.',
    tip4: 'Tracking IDs may change when Teams rearranges tiles or hands remain fully overlapped.',
  },
  debug: {
    inference: 'Inference', left: 'Left', right: 'Right', unknown: 'Unknown',
    palm: 'Palm', back: 'Back', side: 'Side', region: 'Active scan region',
  },
  errors: {
    'permission-denied': { title: 'Camera permission is off', detail: 'The browser was not allowed to access the camera.', recovery: 'Allow camera access beside the address bar, then start again.' },
    'not-found': { title: 'No camera detected', detail: 'No video input device is currently available.', recovery: 'Connect a camera or check system privacy settings, then try again.' },
    'not-readable': { title: 'Camera is in use', detail: 'Another application may be using this camera.', recovery: 'Close the application using it, then try again.' },
    overconstrained: { title: 'Camera settings are unsupported', detail: 'The selected device cannot provide the requested video settings.', recovery: 'Choose another camera or reconnect the device.' },
    unsupported: { title: 'Camera access is unsupported', detail: 'This browser does not provide the required media device API.', recovery: 'Use the latest Chrome or Microsoft Edge over localhost or HTTPS.' },
    'model-load': { title: 'Hand model failed to load', detail: 'The on-device detector could not be initialized.', recovery: 'Check the connection or reload the page.' },
    disconnected: { title: 'Camera disconnected', detail: 'The current camera input has stopped.', recovery: 'Reconnect the device and start again.' },
    'screen-unsupported': { title: 'Screen capture is unsupported', detail: 'This environment cannot read a shared window or display.', recovery: 'Use the latest Chrome or Microsoft Edge over localhost or HTTPS.' },
    'share-not-granted': { title: 'Screen sharing did not start', detail: 'The picker was closed or window access was not granted.', recovery: 'Choose “Teams window” again and select Teams in the system picker.' },
    'share-ended': { title: 'Screen sharing ended', detail: 'The Teams window video input has stopped.', recovery: 'Select the Teams window again to continue.' },
    'start-failed': { title: 'Unable to start recognition', detail: 'An unexpected error occurred while starting the video input.', recovery: 'Open the page over localhost or HTTPS, then reload and try again.' },
  },
};

export const COPY: Record<Language, AppCopy> = { zh, en };

export function resolveInitialLanguage(saved: string | null, browserLanguage: string): Language {
  if (saved === 'zh' || saved === 'en') return saved;
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
