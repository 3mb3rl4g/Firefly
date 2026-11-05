import type { MascotConfig } from "../types/mascotConfig";

// 网页桌宠配置
// 资源位于 public/mascot/，来源与许可证见 public/mascot/NOTICE.txt
export const mascotConfig: MascotConfig = {
	// 是否启用桌宠
	enable: true,

	// 静态资源目录
	basePath: "/mascot",

	// 要出现的宠物（可只留一只以减少流量）
	packs: ["Neuron", "Eviling"],

	// 鼠标穿透：false = 可以点击/拖动宠物互动
	clickThrough: false,

	// 滚动时是否跟随页面一起移动（关掉=宠物钉在视口上完全不受滚动影响）
	followScroll: true,

	// 滚动时的贴地形变
	scrollSquash: true,

	// 移动端是否跳过（两只宠物合计约 3.1MB 精灵图）
	skipOnMobile: true,

	// 首屏空闲后再加载
	idleDelayMs: 1200,

	// 宠物层级：高于壁纸(10~20)与文章卡片，低于导航栏(80)与搜索/菜单浮层(1100+)
	zIndex: 60,
};
