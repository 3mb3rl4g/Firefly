import type { BooknavGroup, BooknavPageConfig } from "../types/booknavConfig";

// 书签导航页面配置
export const booknavPageConfig: BooknavPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// favicon 自动获取配置
	favicon: {
		// 书签未填写 icon 时，是否自动获取目标站点的 favicon 图标
		enabled: true,

		// favicon 接口地址，{domain} 为占位符，会被替换成目标站点域名
		// 更换接口只需保证地址里含有 {domain}，例如：
		//   https://a.favicon.im/{domain}
		//   https://favicon.im/{domain}
		api: "https://a.favicon.im/{domain}",
	},
};

// 书签导航配置
// 每个数组项是一个分类组，分类组内的 items 是该分类下的书签
export const booknavConfig: BooknavGroup[] = [
	{
		id: "tools",
		name: "实用工具",
		enabled: true,
		icon: "material-symbols:handyman-rounded",
		desc: "装机必留的 Windows 小工具",
		weight: 90,
		items: [
			{
				title: "Everything",
				url: "https://www.voidtools.com/zh-cn/",
				desc: "本地文件秒搜，比系统自带搜索快一个数量级",
				weight: 100,
			},
			{
				title: "PotPlayer",
				url: "https://potplayer.tv/",
				desc: "轻量强大的本地视频播放器",
				weight: 90,
			},
			{
				title: "HiBit Uninstaller",
				url: "https://www.hibitsoft.ir/Uninstaller.html",
				desc: "卸载干净，还能清残留注册表",
				weight: 80,
			},
			{
				title: "Double Commander",
				url: "https://doublecmd.sourceforge.io/",
				desc: "双栏文件管理器，替代资源管理器",
				weight: 70,
			},
			{
				title: "酷呆桌面",
				url: "https://www.coodesker.com/",
				desc: "把桌面图标自动归类到栅格里",
				weight: 60,
			},
			{
				title: "Windows 11 轻松设置",
				url: "https://www.bilibili.com/opus/904672369138729017",
				desc: "300KB 免安装的系统优化小工具",
				weight: 50,
			},
			{
				title: "ZyperWin++",
				url: "https://github.com/ZyperWave/ZyperWinOptimize",
				desc: "开源的系统优化 / 清理 / 激活工具箱",
				icon: "fa7-brands:github",
				weight: 40,
			},
		],
	},
	{
		id: "notes",
		name: "笔记软件",
		enabled: true,
		icon: "material-symbols:edit-note-rounded",
		desc: "写东西用的工具",
		weight: 80,
		items: [
			{
				title: "Obsidian",
				url: "https://obsidian.md/zh",
				desc: "本地优先的 Markdown 笔记，插件生态强大",
				icon: "simple-icons:obsidian",
				weight: 100,
			},
			{
				title: "语雀",
				url: "https://www.yuque.com/",
				desc: "国内在线文档与知识库",
				weight: 90,
			},
			{
				title: "Typora",
				url: "https://typora.io/",
				desc: "所见即所得的 Markdown 编辑器",
				weight: 80,
			},
		],
	},
	{
		id: "ai",
		name: "AI 工具",
		enabled: true,
		icon: "material-symbols:neurology-rounded",
		desc: "日常在用的 AI 相关工具",
		weight: 70,
		items: [
			{
				title: "CC Switch",
				url: "https://ccswitch.io/",
				desc: "一键切换 Claude Code / Codex 的供应商",
				weight: 100,
			},
			{
				title: "pi agent",
				url: "https://github.com/earendil-works/pi",
				desc: "开源的 AI Agent 工具箱与编码 CLI",
				icon: "fa7-brands:github",
				weight: 90,
			},
		],
	},
];
