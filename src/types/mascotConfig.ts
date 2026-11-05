/**
 * 网页桌宠配置（基于 web-mascot：Shimeji 格式桌宠引擎）
 *
 * 引擎与内置宠物包的许可证：
 * - 引擎代码 GPL-3.0-or-later，随站点发布的副本见 public/mascot/LICENSE.txt
 * - 内置宠物包 Neuron / Eviling 为 CC-BY-NC-SA-4.0（非商业 + 署名），
 *   出处与署名见 public/mascot/NOTICE.txt，商用前必须替换宠物包或取得授权
 */
export interface MascotConfig {
	/** 是否启用桌宠 */
	enable: boolean;

	/** 静态资源目录（public 下的目录，不带结尾斜杠） */
	basePath: string;

	/** 要挂载的宠物包名称，对应 basePath/mascot_pack/<pack> 目录 */
	packs: string[];

	/** 是否开启鼠标穿透：true=宠物不接收点击，false=可以点它互动 */
	clickThrough: boolean;

	/** 是否跟随页面滚动（false = 宠物钉在视口上，滚动时纹丝不动） */
	followScroll: boolean;

	/** 是否开启滚动时的贴地形变反馈 */
	scrollSquash: boolean;

	/** 窄屏（< 768px）是否跳过加载，省移动端流量 */
	skipOnMobile: boolean;

	/** 页面空闲后延迟多少毫秒再加载，避免抢首屏资源 */
	idleDelayMs: number;

	/** 宠物的 z-index：需高于内容卡片，低于搜索面板等浮层 */
	zIndex: number;
}
