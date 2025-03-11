export default defineBackground(() => {
  console.log("Lakphy Copilot 后台服务已启动", { id: browser.runtime.id });

  // 监听插件安装或更新事件
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      console.log("Lakphy Copilot 已安装");

      // 初始化默认设置
      const defaultSettings = {
        apiKey: "",
        provider: "openrouter",
        model: "qwen/qwq-32b:free",
      };

      // 保存默认设置
      await browser.storage.sync.set(defaultSettings);

      // 打开设置页面
      browser.runtime.openOptionsPage().catch(() => {
        // 如果没有选项页，则打开弹出窗口
        browser.action.openPopup();
      });
    } else if (details.reason === "update") {
      console.log("Lakphy Copilot 已更新");
    }
  });
});
