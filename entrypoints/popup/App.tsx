import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import { ModelSelect } from "./components/ModelSelect";

interface Settings {
  apiKey: string;
  provider: "openrouter" | "openai";
  model: string;
  enableContext: boolean;
}

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
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // 使用 ref 存储初始设置
  const initialSettings = useRef<Settings | null>(null);

  // 检查设置是否发生变化
  const hasSettingsChanged = useCallback(() => {
    if (!initialSettings.current) return false;

    return (
      initialSettings.current.apiKey !== apiKey ||
      initialSettings.current.provider !== provider ||
      initialSettings.current.model !== model ||
      initialSettings.current.enableContext !== enableContext
    );
  }, [apiKey, provider, model, enableContext]);

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

        // 保存初始设置
        initialSettings.current = {
          apiKey: result.apiKey || "",
          provider: (result.provider as "openrouter" | "openai") || "openrouter",
          model: result.model || "qwen/qwq-32b:free",
          enableContext: result.enableContext !== undefined ? result.enableContext : true,
        };
      });
  }, []);

  // 自动保存功能
  const saveSettings = useCallback(async () => {
    // 如果设置没有变化，不进行保存
    if (!hasSettingsChanged()) {
      return;
    }

    setStatus("saving");
    try {
      await browser.storage.sync.set({
        apiKey,
        provider,
        model,
        enableContext,
      });

      // 更新初始设置
      initialSettings.current = {
        apiKey,
        provider,
        model,
        enableContext,
      };

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
  }, [apiKey, provider, model, enableContext, hasSettingsChanged]);

  // 监听设置变化并自动保存
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // 只有在初始设置加载完成后才开始监听变化
    if (initialSettings.current) {
      const timeout = setTimeout(() => {
        saveSettings();
      }, 1000);

      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [apiKey, provider, model, enableContext, saveSettings]);

  return (
    <div className="settings-container">
      <div className="header">
        <h1>Lakphy Copilot</h1>
        <p className="subtitle">配置您的AI副驾驶</p>
      </div>

      <div className="form-group">
        <label htmlFor="provider">API 提供商</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => {
            const newProvider = e.target.value as "openrouter" | "openai";
            setProvider(newProvider);
            // 切换提供商时设置默认模型
            if (newProvider === "openai") {
              setModel("gpt-3.5-turbo");
            } else if (newProvider === "openrouter") {
              setModel("qwen/qwq-32b:free");
            }
          }}
        >
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
        </select>
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
        <label htmlFor="model">模型</label>
        {provider === "openrouter" || provider === "openai" ? (
          <ModelSelect
            key={provider}
            value={model}
            onChange={setModel}
            apiKey={apiKey}
            provider={provider}
          />
        ) : (
          <input
            type="text"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="输入模型名称"
          />
        )}
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
      {status !== "idle" && (
        <div className="toast-container">
          <div className={`toast ${status}`}>
            {status === "saving" && "保存中..."}
            {status === "success" && "已保存"}
            {status === "error" && "保存失败"}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
