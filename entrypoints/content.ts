import { textCopilot } from "../utils/copilot";
import { extractPageContext } from "../utils/context";

export default defineContentScript({
  matches: ["<all_urls>"], // 匹配所有URL
  main() {
    console.log("Lakphy Copilot 已激活");

    // 创建存储API密钥的变量
    let apiKey = "";
    let provider: "openrouter" | "openai" = "openrouter";
    let model = "qwen/qwq-32b:free";
    let enableContext = true; // 默认启用上下文提取
    let baseURL = ""; // 添加 baseURL 变量

    // 从存储中获取API密钥和设置
    browser.storage.sync
      .get(["apiKey", "provider", "model", "enableContext", "baseURL"])  // 添加 baseURL
      .then((result) => {
        apiKey = result.apiKey || "";
        provider = (result.provider as "openrouter" | "openai") || "openrouter";
        model = result.model || "qwen/qwq-32b:free";
        baseURL = result.baseURL || "";  // 设置 baseURL
        // 如果enableContext设置存在，使用它；否则默认为true
        enableContext =
          result.enableContext !== undefined ? result.enableContext : true;

        if (!apiKey) {
          console.warn("Lakphy Copilot: API密钥未设置，请在插件设置中配置");
        }
      });

    // 创建建议框元素
    const suggestionBox = document.createElement("div");
    // Vercel风格的建议框样式
    suggestionBox.style.position = "absolute";
    suggestionBox.style.display = "none";
    suggestionBox.style.padding = "8px 12px";
    suggestionBox.style.background = "rgba(0, 0, 0, 0.8)";
    suggestionBox.style.backdropFilter = "blur(8px)";
    suggestionBox.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    suggestionBox.style.borderRadius = "8px";
    suggestionBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    suggestionBox.style.zIndex = "10000";
    suggestionBox.style.color = "#fff";
    suggestionBox.style.fontSize = "14px";
    suggestionBox.style.fontFamily =
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    suggestionBox.style.maxWidth = "400px";
    suggestionBox.style.overflow = "hidden";
    suggestionBox.style.textOverflow = "ellipsis";
    suggestionBox.style.whiteSpace = "normal";
    suggestionBox.style.maxHeight = "200px";
    suggestionBox.style.overflowY = "auto";
    suggestionBox.style.transition = "opacity 0.15s ease";
    suggestionBox.style.opacity = "0.95";

    // 创建加载动画元素
    const loadingSpinner = document.createElement("div");
    loadingSpinner.style.display = "none";
    loadingSpinner.style.position = "absolute";
    loadingSpinner.style.width = "20px";
    loadingSpinner.style.height = "20px";
    loadingSpinner.style.borderRadius = "50%";
    loadingSpinner.style.border = "3px solid rgba(0, 0, 0, 0.1)";
    loadingSpinner.style.borderTopColor = "#3498db";
    loadingSpinner.style.zIndex = "10000";
    loadingSpinner.style.animation = "lakphySpinner 0.8s linear infinite";
    loadingSpinner.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
    loadingSpinner.style.background = "white";
    loadingSpinner.style.pointerEvents = "none"; // 确保不会干扰用户点击

    // 添加动画样式
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes lakphySpinner {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);
    document.body.appendChild(loadingSpinner);

    // 添加小图标和标签
    const suggestionContent = document.createElement("div");
    suggestionContent.style.display = "flex";
    suggestionContent.style.alignItems = "center";
    suggestionContent.style.gap = "8px";

    // 添加小图标
    const iconSpan = document.createElement("span");
    iconSpan.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    iconSpan.style.display = "flex";
    iconSpan.style.alignItems = "center";
    iconSpan.style.justifyContent = "center";
    iconSpan.style.color = "#999";
    iconSpan.style.flexShrink = "0";
    iconSpan.style.marginTop = "0";
    iconSpan.style.lineHeight = "1";

    // 添加文本容器
    const textContainer = document.createElement("div");
    textContainer.style.flexGrow = "1";
    // 添加样式以处理长文本
    textContainer.style.wordBreak = "break-word";
    textContainer.style.overflowWrap = "break-word";
    textContainer.style.lineHeight = "1.4";

    // 添加快捷键提示
    const shortcutSpan = document.createElement("span");
    shortcutSpan.textContent = "Tab";
    shortcutSpan.style.display = "inline-flex";
    shortcutSpan.style.alignItems = "center";
    shortcutSpan.style.justifyContent = "center";
    shortcutSpan.style.padding = "2px 6px";
    shortcutSpan.style.background = "rgba(255, 255, 255, 0.1)";
    shortcutSpan.style.borderRadius = "4px";
    shortcutSpan.style.fontSize = "10px";
    shortcutSpan.style.color = "#ccc";
    shortcutSpan.style.marginLeft = "8px";
    shortcutSpan.style.flexShrink = "0";
    shortcutSpan.style.height = "18px";
    shortcutSpan.style.lineHeight = "1";

    // 组装建议框
    suggestionContent.appendChild(iconSpan);
    suggestionContent.appendChild(textContainer);
    suggestionContent.appendChild(shortcutSpan);
    suggestionBox.appendChild(suggestionContent);

    document.body.appendChild(suggestionBox);

    // 当前活动的输入元素
    let activeElement: HTMLInputElement | HTMLTextAreaElement | null = null;
    // 当前的建议文本
    let currentSuggestion = "";
    // 防抖定时器
    let debounceTimer: NodeJS.Timeout | null = null;
    // 是否正在加载建议
    let isLoadingSuggestion = false;
    // 用户最后一次输入的时间戳
    let lastInputTimestamp = 0;

    // 处理输入事件的函数
    const handleInput = async (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const text = target.value.trim();

      // 更新最后输入时间戳
      lastInputTimestamp = Date.now();
      const currentTimestamp = lastInputTimestamp;

      // 如果文本为空，隐藏建议框和加载动画
      if (!text) {
        suggestionBox.style.display = "none";
        loadingSpinner.style.display = "none";
        isLoadingSuggestion = false;
        return;
      }

      // 如果API密钥未设置，不提供建议
      if (!apiKey) {
        return;
      }

      // 防抖处理
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        try {
          // 显示加载动画
          isLoadingSuggestion = true;

          // 获取输入框位置并设置加载动画位置
          const inputRect = target.getBoundingClientRect();
          // 将加载动画放在输入框右侧，更加明显
          loadingSpinner.style.top = `${
            inputRect.top + (inputRect.height - 20) / 2 + window.scrollY
          }px`;
          loadingSpinner.style.left = `${
            inputRect.right - 30 + window.scrollX
          }px`;
          loadingSpinner.style.display = "block";

          // 根据设置决定是否提取页面上下文
          const pageContext = enableContext ? extractPageContext(target) : "";

          // 调用copilot API获取建议
          const suggestion = await textCopilot({
            text,
            provider,
            model,
            apiKey,
            pageContext, // 传递页面上下文
            baseURL,    // 添加 baseURL
          });

          // 如果在等待响应期间用户又输入了新内容，则放弃这次结果
          if (currentTimestamp !== lastInputTimestamp) {
            loadingSpinner.style.display = "none";
            return;
          }

          // 隐藏加载动画
          loadingSpinner.style.display = "none";
          isLoadingSuggestion = false;

          // 如果有建议且不等于当前文本
          if (suggestion && suggestion !== text) {
            currentSuggestion = suggestion;

            // 更新建议框内容
            const commonPart = text;
            const additionalPart = suggestion.substring(text.length);

            // 更新文本容器内容
            textContainer.innerHTML = `<span style="font-weight: 500;">${commonPart}</span><span style="color: rgba(255, 255, 255, 0.6); font-weight: 400;">${additionalPart}</span>`;

            // 先显示建议框但设为不可见，以便获取其尺寸
            suggestionBox.style.display = "block";
            suggestionBox.style.visibility = "hidden";

            // 获取输入框和建议框的尺寸和位置
            const inputRect = target.getBoundingClientRect();

            // 确保DOM已更新，然后获取建议框尺寸
            setTimeout(() => {
              const boxHeight = suggestionBox.offsetHeight;
              const viewportHeight = window.innerHeight;
              const spaceAbove = inputRect.top;
              const spaceBelow = viewportHeight - inputRect.bottom;

              // 计算建议框的位置
              let topPosition;

              // 默认尝试放在输入框上方，保持足够间距
              if (spaceAbove >= boxHeight + 12) {
                // 上方空间足够
                topPosition = inputRect.top - boxHeight - 12 + window.scrollY;
              } else if (spaceBelow >= boxHeight + 12) {
                // 上方空间不足，但下方空间足够
                topPosition = inputRect.bottom + 12 + window.scrollY;
              } else {
                // 上下空间都不足，选择空间较大的一侧
                topPosition =
                  spaceAbove > spaceBelow
                    ? Math.max(
                        5 + window.scrollY,
                        inputRect.top - boxHeight - 5 + window.scrollY
                      )
                    : inputRect.bottom + 5 + window.scrollY;
              }

              // 设置建议框位置
              suggestionBox.style.top = `${topPosition}px`;
              suggestionBox.style.left = `${inputRect.left + window.scrollX}px`;
              suggestionBox.style.width = `${Math.min(
                inputRect.width,
                window.innerWidth - inputRect.left - 20
              )}px`;

              // 使建议框可见
              suggestionBox.style.visibility = "visible";
            }, 0);
          } else {
            suggestionBox.style.display = "none";
          }
        } catch (error) {
          console.error("Lakphy Copilot 错误:", error);
          suggestionBox.style.display = "none";
          loadingSpinner.style.display = "none";
          isLoadingSuggestion = false;
        }
      }, 300); // 300ms防抖
    };

    // 处理Tab键接受建议
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果按下Tab键且建议框可见，接受建议
      if (event.key === "Tab" && suggestionBox.style.display === "block") {
        event.preventDefault();
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        target.value = currentSuggestion;
        suggestionBox.style.display = "none";

        // 触发input事件，确保其他监听器知道值已更改
        target.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // 如果按下其他键且不是修饰键，隐藏建议框
      else if (
        suggestionBox.style.display === "block" &&
        !["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(
          event.key
        ) &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey
      ) {
        suggestionBox.style.display = "none";
      }
    };

    // 处理焦点事件
    const handleFocus = (event: FocusEvent) => {
      activeElement = event.target as HTMLInputElement | HTMLTextAreaElement;
      // 如果输入框有值，触发输入事件以显示建议
      if (activeElement.value.trim()) {
        handleInput(event);
      }
    };

    const handleBlur = () => {
      // 延迟隐藏建议框，以便用户可以点击建议
      setTimeout(() => {
        suggestionBox.style.display = "none";
      }, 200);
      activeElement = null;
    };

    // 点击建议框接受建议
    suggestionBox.addEventListener("click", () => {
      if (activeElement && currentSuggestion) {
        activeElement.value = currentSuggestion;
        suggestionBox.style.display = "none";

        // 触发input事件
        activeElement.dispatchEvent(new Event("input", { bubbles: true }));
        // 保持焦点在输入框
        activeElement.focus();
      }
    });

    // 鼠标悬停效果
    suggestionBox.addEventListener("mouseenter", () => {
      suggestionBox.style.opacity = "1";
      suggestionBox.style.boxShadow = "0 6px 24px rgba(0, 0, 0, 0.3)";
    });

    suggestionBox.addEventListener("mouseleave", () => {
      suggestionBox.style.opacity = "0.95";
      suggestionBox.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    });

    // 使用事件委托监听所有输入框
    document.addEventListener("input", (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        handleInput(event);
      }
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        handleKeyDown(event as KeyboardEvent);
      }
    });

    // 监听点击事件，如果点击了输入框外部且不是建议框，则隐藏建议框
    document.addEventListener("click", (event) => {
      if (
        suggestionBox.style.display === "block" &&
        !suggestionBox.contains(event.target as Node) &&
        activeElement !== event.target
      ) {
        suggestionBox.style.display = "none";
      }
    });

    document.addEventListener(
      "focus",
      (event) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          handleFocus(event as FocusEvent);
        }
      },
      true
    );

    document.addEventListener(
      "blur",
      (event) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          handleBlur();
        }
      },
      true
    );

    // 监听来自后台脚本的消息
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "settingsUpdated") {
        apiKey = message.apiKey || "";
        provider = message.provider || "openrouter";
        model = message.model || "qwen/qwq-32b:free";
        baseURL = message.baseURL || "";  // 更新 baseURL
        enableContext =
          message.enableContext !== undefined ? message.enableContext : true;
      }
    });
  },
});
