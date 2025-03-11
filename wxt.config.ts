import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Lakphy Copilot",
    description: "为所有输入框添加AI自动补全功能",
    version: "1.0.0",
    permissions: ["storage"],
    host_permissions: ["<all_urls>"],
    icons: {
      "48": "./icon/tab.png",
    },
  },
});
