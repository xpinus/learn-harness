/**
 * 带工具的手动循环
 */

import { stream, Type, validateToolCall } from "@mariozechner/pi-ai";
import type { Model } from "@mariozechner/pi-ai";

// 获取预设模型
// 需要设置对应的设置环境变量: ANTHROPIC_API_KEY=sk-ant-...
// const model = getModel("anthropic", "claude-sonnet-4-20250514"); 

// 自定义模型
const model: Model<"openai-completions"> = {
	id: "qwen3-coder-next",
	name: "qwen3",
	api: "openai-completions",
	provider: "cx",
	baseUrl: "http://apidev-llm.ai.chaoxing.com/coderdev/v1",
	reasoning: false,
	input: ["text"],
	cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
	contextWindow: 128000,
	maxTokens: 32000,
};

const calculatorTool = {
  name: "calculate",
  description: "计算数学表达式",
  parameters: Type.Object({
    expression: Type.String({ description: "要计算的表达式" }),
    precision: Type.Optional(Type.Number({ description: "小数位数", default: 2 })),
  }),
};

const context = {
  systemPrompt: "你是一个数学助手。用 calculate 工具来计算。",
  messages: [
    { role: "user" as const, content: "123 * 456 等于多少？", timestamp: Date.now() }
  ],
  tools: [calculatorTool],
};


// 手动实现工具调用循环
while (true) {
	const s = stream(model, context, {
		apiKey: process.env.API_KEY, 
	});
	const message = await s.result();
  context.messages.push(message as any);
  // 没有工具调用 → 完成
  if (message.stopReason !== "toolUse") {
    const text = message.content.find(c => c.type === "text");
    console.log(text?.text);
    break;
  }
  // 执行每个工具调用
  for (const block of message.content) {
		if (block.type !== "toolCall") continue;
		
    const args = validateToolCall(context.tools, block);
    let resultText: string;
    try {
      resultText = String(new Function(`return ${args.expression}`)());
    } catch (e) {
      resultText = `错误: ${e}`;
		}
		
    context.messages.push({
      role: "toolResult",
      toolCallId: block.id,
      toolName: block.name,
      content: [{ type: "text", text: resultText }],
      isError: false,
      timestamp: Date.now(),
    }  as any);
  }
}