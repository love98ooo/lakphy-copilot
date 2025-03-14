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
  baseURL?: string;
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
    baseURL,
  } = props;
  const providerInstance = (() => {
    switch (provider) {
      case "openrouter":
        return createOpenRouter({ apiKey });
      case "openai":
        return createOpenAI({
          apiKey,
          baseURL: baseURL || "https://api.openai.com/v1",
        });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  })();
  const { text: responseText } = await generateText({
    // @ts-ignore
    model: providerInstance(model),
    system: `You are a professional ${role} helping users with intelligent text completion for any input field.

Generate natural and fluent text completions that continue the user's input while reflecting professional expertise
- Extend the input text logically while maintaining coherence with preceding content
- Align suggestions with the specified professional role context: ${role}
- Strictly adhere to operational constraints and output requirements

**Steps**
1. Analyze input text to identify linguistic patterns and semantic intent
2. If page context exists (${pageContext}), incorporate relevant environmental factors
3. Generate 3-5 candidate continuations matching the professional perspective
4. Select optimal suggestion meeting ALL requirements:
   - [${includeOriginal ? "Includes original text" : "Omits original text"}]
   - Maintains natural linguistic flow
   - Stays under ${maxChars} character limit
5. Validate spacing/syntax for direct insertion after user input

**Output Format**
Return ONLY the completion text as a continuous string with:
- [${includeOriginal ? "Original input + continuation" : "Continuation only"}]
- No quotation marks/punctuation unless grammatically required
- No line breaks or special formatting
- Exact length: ${maxChars} characters [${includeOriginal ? "(excluding original)" : ""}]

**Examples**

Input: "项目预算"
Context: Financial planning role
Output: [${includeOriginal ? "项目预算需要综合考虑资源分配" : "需要综合考虑资源分配"}]

Input: "临床实验"
Context: Medical researcher role
Output: [${includeOriginal ? "临床实验必须遵循双盲原则" : "必须遵循双盲原则"}]

Input: "用户留存"
Context: SaaS product management
Output: [${includeOriginal ? "用户留存的关键在于持续价值交付" : "关键在于持续价值交付"}]

**Notes**
- Return empty string if no contextually appropriate completion exists
- Preserve original capitalization/style from input
- Mirror user's spacing conventions (e.g., extra spaces before punctuation)
- Prioritize grammatical continuity over creative variations
    `,
    prompt: `Generate a natural and fluent completion suggestion based on the user's input: "${text}".`,
  });
  return responseText;
}

// 为了向后兼容，保留原来的函数名
export const textCopilot = inputCopilot;
