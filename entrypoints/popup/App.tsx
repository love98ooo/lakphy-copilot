import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<"openrouter" | "openai">(
    "openrouter"
  );
  const [model, setModel] = useState("qwen/qwq-32b:free");
  const [enableContext, setEnableContext] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );

  // 加载保存的设置
  useEffect(() => {
    browser.storage.sync
      .get(["apiKey", "provider", "model", "enableContext"])
      .then((result) => {
        if (result.apiKey) setApiKey(result.apiKey);
        if (result.provider)
          setProvider(result.provider as "openrouter" | "openai");
        if (result.model) setModel(result.model);
        setEnableContext(
          result.enableContext !== undefined ? result.enableContext : true
        );
      });
  }, []);

  // 保存设置
  const saveSettings = async () => {
    setStatus("saving");
    try {
      await browser.storage.sync.set({
        apiKey,
        provider,
        model,
        enableContext,
      });

      // 通知内容脚本设置已更新
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs
            .sendMessage(tab.id, {
              type: "settingsUpdated",
              apiKey,
              provider,
              model,
              enableContext,
            })
            .catch(() => {
              // 忽略无法发送消息的错误（例如，未加载内容脚本的标签页）
            });
        }
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("保存设置时出错:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="settings-container">
      <div className="header">
        <h1>Lakphy Copilot</h1>
        <p className="subtitle">配置您的AI副驾驶</p>
      </div>

      <div className="form-group">
        <label htmlFor="apiKey">API 密钥</label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="输入您的 API 密钥"
        />
        <small>
          {provider === "openrouter" ? (
            <>
              从{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
              >
                OpenRouter
              </a>{" "}
              获取 API 密钥
            </>
          ) : (
            <>
              从{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                OpenAI
              </a>{" "}
              获取 API 密钥
            </>
          )}
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="provider">API 提供商</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) =>
            setProvider(e.target.value as "openrouter" | "openai")
          }
        >
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="model">模型</label>
        <input
          type="text"
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="输入模型名称"
        />
        <small>
          {provider === "openrouter" ? (
            <>推荐: qwen/qwq-32b:free (免费), anthropic/claude-3-opus:beta</>
          ) : (
            <>推荐: gpt-4-turbo, gpt-3.5-turbo</>
          )}
        </small>
      </div>

      <div className="form-group checkbox-group">
        <label htmlFor="enableContext" className="checkbox-label">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="enableContext"
              checked={enableContext}
              onChange={(e) => setEnableContext(e.target.checked)}
            />
            <span className="checkmark"></span>
          </div>
          启用页面上下文提取
        </label>
        <small>
          提取页面元素信息作为上下文，提高联想质量。可能会略微增加API调用成本。
        </small>
      </div>

      <button
        className={`save-button ${status}`}
        onClick={saveSettings}
        disabled={status === "saving"}
      >
        {status === "idle" && "保存设置"}
        {status === "saving" && "保存中..."}
        {status === "success" && "保存成功!"}
        {status === "error" && "保存失败!"}
      </button>

      <div className="divider"></div>

      <div className="info">
        <p>使用说明</p>
        <ul>
          <li>在任何输入框中输入文字，将自动显示建议</li>
          <li>
            按 <kbd>Tab</kbd> 键或点击建议接受补全
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
