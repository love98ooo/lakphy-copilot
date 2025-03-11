import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

/**
 * 用户输入内容智能联想
 * @param text 用户输入内容
 * @returns 联想内容（一段文字，包含用户输入，在用户输入的基础上，联想出更多内容，最多联想15个字）
 */
export async function inputCopilot(props: {
  text: string;
  role?: string;
  model?: string;
  provider?: "openrouter" | "openai";
  apiKey: string;
  maxChars?: number;
  includeOriginal?: boolean;
  pageContext?: string;
}) {
  const {
    text,
    role = "Assistant",
    model = "qwen/qwq-32b:free",
    provider = "openrouter",
    apiKey,
    maxChars = 15,
    includeOriginal = true,
    pageContext,
  } = props;
  const providerInstance = (() => {
    switch (provider) {
      case "openrouter":
        return createOpenRouter({ apiKey });
      case "openai":
        return createOpenAI({ apiKey });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  })();
  const { text: responseText } = await generateText({
    // @ts-ignore
    model: providerInstance(model),
    prompt: `<role>You are a professional ${role} helping users with intelligent text completion for any input field.</role>

<task>
Generate a natural and fluent completion suggestion based on the user's input: "${text}".
</task>

<input>
${text}
</input>
${
  pageContext
    ? `
<page_context>
${pageContext}
</page_context>`
    : ""
}

<requirements>
1. ${
      includeOriginal
        ? `Your output MUST include the user's original input: "${text}"`
        : "Your output should NOT include the user's original input"
    }
2. Naturally extend or complete what the user might be trying to express
3. The suggestion should be concise, practical, and reflect the professional perspective of a ${role}
4. Keep the additional content within ${maxChars} characters ${
      includeOriginal ? "(excluding the original user input)" : ""
    }
5. Format as a single complete phrase without explanations, punctuation, or extra formatting
6. Return ONLY the completion result with no prefixes or additional text
7. Do not add quotation marks or other punctuation unless they are a natural part of the input
8. If no meaningful suggestion can be provided, return an empty string
9. Your output will be completed directly after the user inputs it without any modification, so please pay attention to the syntax of spaces in your output
10. Do not output line breaks, tabs, etc. that affect typography
${
  pageContext
    ? "11. Consider the page context provided when generating suggestions to make them more relevant to the user's current environment"
    : ""
}
</requirements>

<examples>

Input: "我想要"
Output: ${
      includeOriginal ? '"我想要一个简单易用的工具"' : '"一个简单易用的工具"'
    }

Input: "如何提高"
Output: ${includeOriginal ? '"如何提高工作效率和生产力"' : '"工作效率和生产力"'}

Input: "今天天气"
Output: ${includeOriginal ? '"今天天气怎么样？"' : '"怎么样？"'}

</examples>

<output_format>
Return ONLY the ${
      includeOriginal
        ? "complete text (with original input)"
        : "completion result (without the original input)"
    }, with no additional explanation.
</output_format>`,
  });
  return responseText;
}

// 为了向后兼容，保留原来的函数名
export const textCopilot = inputCopilot;
