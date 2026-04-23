/**
 * 使用 Agent
 * Agent 内部帮你做了工具调用循环、参数验证、错误处理、事件发射。你只需要定义工具的 execute 和订阅事件
 */

import { stream, Type, validateToolCall } from "@mariozechner/pi-ai";
import type { Model } from "@mariozechner/pi-ai";
import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentTool } from "@mariozechner/pi-agent-core";

// 定义带执行逻辑的工具
const calculatorTool: AgentTool = {
  name: "calculate",
  label: "计算器",
  description: "计算数学表达式",
  parameters: Type.Object({
    expression: Type.String({ description: "数学表达式" }),
  }),
  execute: async (toolCallId, params: any, signal, onUpdate) => {
    const result = new Function(`return ${params.expression}`)();
    return {
      content: [{ type: "text" as const, text: `${params.expression} = ${result}` }],  // LLM看到的
      details: { expression: params.expression, result },  // UI看到的
    };
  },
};

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

// 创建 Agent
const agent = new Agent({
  initialState: {
    systemPrompt: "你是一个数学助手。用 calculate 工具来计算。",
    model,
    tools: [calculatorTool],
  },
  getApiKey: () => process.env.API_KEY
});

// 订阅事件 — 一个 subscribe 搞定所有 UI 更新
agent.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      if (event.assistantMessageEvent.type === "text_delta") {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
      break;
    case "tool_execution_start":
      console.log(`\n[工具] ${event.toolName}(${JSON.stringify(event.args)})`);
      break;
    case "tool_execution_end":
      // console.log(event)
      console.log(`[结果] ${event.result.content[0].text}`);
      break;
    case "agent_end":
      console.log(`\n--- 完成，共 ${event.messages.length} 条新消息 ---`);
      break;
  }
});
// 发送消息 — Agent 自动处理工具调用循环！
await agent.prompt("计算 (123 + 456) * 789");