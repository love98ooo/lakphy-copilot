/**
 * 提取页面上下文
 * @param element 当前元素
 * @returns 页面上下文
 */
export function extractPageContext(element: HTMLElement): string {
  // 如果没有元素，返回空字符串
  if (!element) return "";

  try {
    // 1. 尝试获取当前输入框的标签、占位符和相关标签文本
    let context = "";

    // 获取输入框的标签文本
    const labelFor = element.id
      ? document.querySelector(`label[for="${element.id}"]`)
      : null;
    if (labelFor && labelFor.textContent) {
      context += `输入框标签: ${labelFor.textContent.trim()}\n`;
    }

    // 获取输入框的占位符
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      if (element.placeholder) {
        context += `占位符: ${element.placeholder}\n`;
      }

      // 获取输入框的名称属性
      if (element.name) {
        context += `输入框名称: ${element.name}\n`;
      }

      // 获取输入框的类型
      if (element instanceof HTMLInputElement && element.type) {
        context += `输入框类型: ${element.type}\n`;
      }

      // 获取输入框的当前值（如果有）
      if (element.value && element.value !== element.value.trim()) {
        context += `当前输入: ${element.value.trim()}\n`;
      }
    }

    // 2. 获取父元素的上下文
    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 3; // 最多向上查找3层

    while (parent && depth < maxDepth) {
      // 获取父元素中的标题元素
      const headings = parent.querySelectorAll("h1, h2, h3, h4, h5, h6");
      for (const heading of headings) {
        if (heading.textContent && heading.textContent.trim()) {
          context += `页面标题: ${heading.textContent.trim()}\n`;
        }
      }

      // 获取父元素中的段落文本（限制数量和长度）
      const paragraphs = parent.querySelectorAll("p");
      let paragraphCount = 0;
      for (const p of paragraphs) {
        if (p.textContent && p.textContent.trim() && paragraphCount < 2) {
          const text = p.textContent.trim();
          context += `相关内容: ${
            text.length > 100 ? text.substring(0, 100) + "..." : text
          }\n`;
          paragraphCount++;
        }
      }

      // 获取父元素的aria标签
      if (parent.getAttribute("aria-label")) {
        context += `区域标签: ${parent.getAttribute("aria-label")}\n`;
      }

      // 获取父元素的类名，可能包含语义信息
      if (parent.className && typeof parent.className === "string") {
        const semanticClasses = parent.className
          .split(" ")
          .filter(
            (cls) =>
              cls.includes("form") ||
              cls.includes("input") ||
              cls.includes("field") ||
              cls.includes("search") ||
              cls.includes("comment") ||
              cls.includes("post") ||
              cls.includes("content")
          );

        if (semanticClasses.length > 0) {
          context += `区域类型: ${semanticClasses.join(", ")}\n`;
        }
      }

      parent = parent.parentElement;
      depth++;
    }

    // 3. 获取页面的主要信息
    const pageTitle = document.title;
    if (pageTitle) {
      context += `页面标题: ${pageTitle}\n`;
    }

    // 获取页面的meta描述
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && metaDescription.getAttribute("content")) {
      context += `页面描述: ${metaDescription.getAttribute("content")}\n`;
    }

    // 获取页面的关键词
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && metaKeywords.getAttribute("content")) {
      context += `页面关键词: ${metaKeywords.getAttribute("content")}\n`;
    }

    // 4. 如果是表单，获取表单中其他字段的信息
    if (
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement) &&
      element.form
    ) {
      const formElements = element.form.elements;
      let formFieldsInfo = "表单字段: ";
      let fieldCount = 0;

      // 尝试获取表单的标题或名称
      if (element.form.id || element.form.name) {
        context += `表单名称: ${element.form.id || element.form.name}\n`;
      }

      // 获取表单中已填写的其他字段
      let filledFields = "";
      let filledCount = 0;

      for (let i = 0; i < formElements.length; i++) {
        const field = formElements[i] as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;

        // 收集字段名称
        if (field.name && field !== element && fieldCount < 5) {
          formFieldsInfo += `${field.name}, `;
          fieldCount++;
        }

        // 收集已填写的字段值
        if (field !== element && field.value && field.name && filledCount < 3) {
          // 排除密码字段
          if (
            !(field instanceof HTMLInputElement) ||
            field.type !== "password"
          ) {
            filledFields += `${field.name}: ${field.value}, `;
            filledCount++;
          }
        }
      }

      if (fieldCount > 0) {
        context += formFieldsInfo.slice(0, -2) + "\n";
      }

      if (filledCount > 0) {
        context += `已填写字段: ${filledFields.slice(0, -2)}\n`;
      }
    }

    // 5. 获取URL的相关信息
    const url = new URL(window.location.href);
    context += `当前URL路径: ${url.pathname}\n`;

    // 获取URL参数
    if (url.search) {
      context += `URL参数: ${url.search}\n`;
    }

    // 6. 检查是否在特定类型的页面上
    const isSearchPage =
      url.pathname.includes("search") ||
      url.search.includes("search") ||
      url.search.includes("q=") ||
      document.title.toLowerCase().includes("search");

    if (isSearchPage) {
      context += `页面类型: 搜索页面\n`;
    }

    const isCheckoutPage =
      url.pathname.includes("checkout") ||
      url.pathname.includes("cart") ||
      url.pathname.includes("payment") ||
      document.title.toLowerCase().includes("checkout") ||
      document.title.toLowerCase().includes("cart");

    if (isCheckoutPage) {
      context += `页面类型: 结账/购物车页面\n`;
    }

    // 7. 去除重复信息并限制长度
    const lines = [...new Set(context.split("\n"))].filter((line) =>
      line.trim()
    );
    const finalContext = lines.slice(0, 15).join("\n").trim(); // 增加到最多15行上下文

    // 添加调试日志
    if (finalContext) {
      console.debug("Lakphy Copilot 提取的页面上下文:", finalContext);
    }

    return finalContext;
  } catch (error) {
    console.error("提取页面上下文时出错:", error);
    return "";
  }
}
