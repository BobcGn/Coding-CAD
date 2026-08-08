# Architecture Agent / 架构 Agent

`@coding-cad/architecture-agent` is the Architecture Reasoning Layer for Coding CAD.

`@coding-cad/architecture-agent` 是 Coding CAD 的 Architecture Reasoning Layer。

It helps humans turn requirements into explainable Architecture IR, validates the proposed architecture, and improves the design from validator feedback.

它帮助人类将需求转换为可解释的 Architecture IR，验证生成的架构，并根据 Validator 反馈改进设计。

## What It Is / 它是什么

Architecture Agent is an AI architecture assistant.

Architecture Agent 是一个 AI 架构设计助手。

It answers architecture questions:

它回答架构问题：

- How should this system be decomposed?
- Which components should exist?
- What component types fit the requirement?
- Why is a decision acceptable?
- What risks should be addressed before implementation?
- How should the architecture evolve?

- 系统应该如何拆分？
- 应该有哪些组件？
- 哪些组件类型适合需求？
- 为什么某个决策是合理的？
- 实现前需要处理哪些风险？
- 架构未来应该如何演进？

## What It Is Not / 它不是什么

Architecture Agent is not a Coding Agent.

Architecture Agent 不是 Coding Agent。

It does not write business code, mutate files, generate projects, or deploy systems. Its output is Architecture IR. YAML is only a later exchange format produced by the DSL layer.

它不写业务代码、不修改文件、不生成项目、不部署系统。它的输出是 Architecture IR。YAML 只是后续由 DSL 层生成的交换格式。

## Flow / 流程

```text
User Requirement
  -> Requirement Analysis
  -> Architecture Planning
  -> Architecture IR
  -> Validator
  -> Architecture Improvement
  -> Final ArchitectureProject
```

## Module Boundaries / 模块边界

- `architecture-ir`: owns the central `ArchitectureProject` model.
- `component-registry`: provides available component knowledge and tradeoffs.
- `architecture-validator`: analyzes generated Architecture IR and reports explainable issues.
- `architecture-dsl`: remains the YAML exchange layer; the Agent does not design by emitting YAML directly.

- `architecture-ir`：拥有中心模型 `ArchitectureProject`。
- `component-registry`：提供可用组件知识和工程取舍。
- `architecture-validator`：分析生成的 Architecture IR，并输出可解释问题。
- `architecture-dsl`：仍然是 YAML 交换层；Agent 不通过直接输出 YAML 来完成设计。

## Usage / 使用

```ts
import { ArchitectureAgent } from "@coding-cad/architecture-agent";

const agent = new ArchitectureAgent();
const project = await agent.design("设计一个积分系统，100万用户，积分不能丢失，未来支持活动兑换。");
```

The returned value is an `ArchitectureProject`, not source code and not YAML.

返回值是 `ArchitectureProject`，不是源码，也不是 YAML。

## Current LLM Strategy / 当前 LLM 策略

The first implementation uses `MockLLMProvider`. This keeps the reasoning pipeline deterministic while the architecture contract is still being proven.

第一阶段使用 `MockLLMProvider`。这样在验证架构契约时，推理流程保持确定性。

Future providers can implement:

未来 provider 可以实现：

- OpenAI
- Claude
- Gemini
- Local LLM

## Design Principles / 设计原则

1. Architecture IR is always the center.

   Architecture IR 永远是中心。

2. Decisions must be explainable.

   所有决策必须可解释。

3. The Agent must accept Validator feedback.

   Agent 必须接受 Validator 反馈。

4. The model provider must remain replaceable.

   模型 provider 必须保持可替换。
