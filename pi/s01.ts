/**
 * 单次 LLM 调用
 */

import { getModel, stream, complete } from "@mariozechner/pi-ai";
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

const context = {
	systemPrompt: "你是一个简洁的助手。",
	messages: [
		{
			role: "user" as const,
			content: "什么是 TypeScript？",
			timestamp: Date.now(),
		},
	],
};

// 流式调用
for await (const event of stream(model, context, {
	apiKey: process.env.API_KEY, // Ollama doesn't need a real key
})) {
	if (event.type === "text_delta") {
		process.stdout.write(event.delta);
	}
}

/*
// 或者只要结果
const result = await complete(model, context, {
  apiKey: process.env.API_KEY 
});
// @ts-ignore
console.log(result.content[0].text);
// console.log(`花费: $${result.usage.cost.total}`);
*/
