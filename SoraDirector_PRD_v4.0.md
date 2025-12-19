# SoraDirector 新版创作流程 PRD（v4.0）

## 1. 目标与背景
- 目标：将创作流程重构为 A→H 的分阶段闭环，提升可控性、用户参与度与脚本质量，并降低“一键生成”带来的偏差。
- 背景：当前系统支持“上传→表单→一次性生成脚本→生成视频”和对话式引导，计划引入阶段化管线，以结构化沉淀每步产出。

## 2. 范围与不在范围
- 在范围：新增阶段状态机、B 阶段“AI 产品理解并可编辑确认”、C/D/E/F 阶段的结构化输出与 UI、三脚本选择、生成视频的 Prompt 组装。
- 不在范围：账号系统、计费与额度策略、作品库数据持久化（保持现状）。

## 3. 用户旅程（A→H）
- A 产品图片上传：用户拖拽或选择图片，系统并发上传到 TOS 并转 base64，进入 B。
- B AI 产品理解（可编辑）：AI 输出“产品名称/类型/关键属性/尺寸建议”，用户编辑与确认。
- C 市场定位分析：AI 给出目标市场、人群细分、persona 建议，用户确认。
- D 创意策略生成：AI 输出核心信息、痛点-解决、情绪曲线与叙事策略，用户确认或微调。
- E 视觉风格匹配：AI 输出风格候选（chips 或卡片），用户选择 1 个风格。
- F 三个脚本自动创作：AI 根据上下文生成 3 套 10s 脚本，分镜、动作、台词、情绪。
- G 用户手动选择脚本：对比预览三套脚本，选择其一作为最终脚本。
- H 确认点击视频生成：组装最终 Prompt 调用视频生成模型，展示状态与结果。

## 4. 成功度量
- 生成成功率：F→H 全链路成功率 ≥ 90%
- 用户参与度：B/C/D/E/G 阶段至少 3 次有效交互
- 脚本质量：用户选择脚本的平均停留时间与满意度（后续埋点）
- 失败恢复：各阶段失败后“重试/跳过/回退”可用率 ≥ 99%

## 5. 信息架构与数据模型（前端状态）
- `pipelineStage`: `'image_uploaded' | 'product_understanding' | 'market_analysis' | 'creative_strategy' | 'style_matching' | 'scripts_generated' | 'script_selected' | 'ready_to_render'`
- `productUnderstanding`: `{ productName, productType, attributes?: {material?, color?, shape?}, sizeOptions: {label, value, description}[] }`
- `marketAnalysis`: `{ market, segments?: string[], persona?: {age, gender, traits[]} }`
- `creativeStrategy`: `{ keyMessage, painReliefArc: string[], tone, narrative }`
- `visualStyle`: `{ id, label, pros?: string[], cons?: string[] }`
- `scriptOptions`: `ScriptItem[][]`（三套脚本）
- `selectedScript`: `ScriptItem[]`

## 6. 后端 API 设计
- 通用返回结构：
  - `success: boolean`
  - `projectUpdate?: { productUnderstanding?, marketAnalysis?, creativeStrategy?, visualStyle?, scriptOptions?, selectedScript? }`
  - `error?: string`
- 新增路由：
  - `POST /understand-product`
    - 入参：`{ imageUrl?: string, imageBase64?: string }`
    - 出参示例：
      ```json
      {
        "success": true,
        "projectUpdate": {
          "productUnderstanding": {
            "productName": "玫瑰精华口红",
            "productType": "lipstick",
            "attributes": { "material": "metal", "color": "rose", "shape": "stick" },
            "sizeOptions": [
              { "label": "💄 口红级 (10cm)", "value": "mini", "description": "约10cm" },
              { "label": "🥤 矿泉水瓶级 (30cm)", "value": "normal", "description": "约30cm" },
              { "label": "🍾 大酒瓶级 (50cm+)", "value": "large", "description": "约50cm+" }
            ]
          }
        }
      }
      ```
  - `POST /analyze-market` 入参：`{ productUnderstanding, overrides? }`；出参：`marketAnalysis`
  - `POST /generate-strategy` 入参：`{ productUnderstanding, marketAnalysis }`；出参：`creativeStrategy`
  - `POST /match-style` 入参：`{ productUnderstanding, marketAnalysis, creativeStrategy }`；出参：`visualStyle 或 styleCandidates`
  - `POST /generate-scripts` 入参：`{ productUnderstanding, marketAnalysis, creativeStrategy, visualStyle }`；出参：`scriptOptions`（三套）
- 复用现有端点：
  - 上传图片：`POST /upload-image`
  - 生成视频：`POST /generate-video`
  - 查询任务：`POST /query-video-task`
  - 辅助对话：`POST /chat`

## 7. Prompt 规则（阶段化）
- 通用系统角色：中文、导演助理、分阶段、结构化输出、少广告语。
- 分阶段模板要点：
  - `/understand-product`：输出 `productName/productType/attributes/sizeOptions`（固定三枚 chips）；失败兜底返回默认三尺寸。
  - `/analyze-market`：输出 `market/segments/persona`
  - `/generate-strategy`：输出 `keyMessage/painReliefArc/tone/narrative`
  - `/match-style`：输出风格候选或最终风格
  - `/generate-scripts`：输出三套脚本，每套包含 `time/scene/action/audio/emotion`

## 8. 前端交互设计
- 上传与进入 B：上传后调用 `/understand-product`，显示“产品理解面板”（AI 预填，用户可编辑），尺寸 chips 可覆盖选择。
- 阶段控制与回退：A→H 进度条；每阶段提供“返回上一步/重新生成/跳过”。
- 三脚本选择：三卡对比概览 + 详情预览；选择后写入 `selectedScript` 进入 H。
- 视频生成：组装最终 Prompt（`[CONSTRAINTS][CHARACTER][STRATEGY][STYLE][SCRIPT][SCENE]`）并调用现有生成接口。

## 9. 后端实现要点
- 位置：新增阶段路由置于脚本生成路由附近，复用 `chat_with_ai`。
- 解析：统一 `re + json.loads`；异常时返回 `success=false` 与安全兜底。
- 日志：打印 `model/payload/raw_response/parsed_result`；保留 `request_id`。
- 安全：不落盘用户图片；不返回敏感环境变量；不记录完整 base64（只统计长度）。

## 10. 错误处理与降级
- 网络失败：提示“重试”，支持跳过当前阶段使用默认值继续。
- JSON 解析失败：展示 AI 原文与“使用默认建议”按钮。
- 模型不可用：进入“模拟模式”，返回静态模板（三尺寸、通用 persona、三脚本模板）。
- 回退：任意阶段支持回到 B 重置产品理解，后续阶段自动失效并重新计算。

## 11. 埋点与指标
- 阶段停留时长：B/C/D/E/F/G 单步停留时间与操作次数。
- 选择偏好：E 的风格倾向、G 的脚本选择分布。
- 生成成功：H 的状态分布与错误码类别。

## 12. 里程碑与实施计划
- M1：后端 `/understand-product` 与前端 B 面板（B 可编辑确认）。
- M2：后端 `/generate-scripts` 与前端三脚本选择（F/G 可视化）。
- M3：补齐 `/analyze-market`、`/generate-strategy`、`/match-style`，串联上下文。
- M4：统一 Prompt 组装，优化生成体验与容错。
- M5：指标与埋点，A/B 实验风格与策略模板。

## 13. 参考现有代码位
- 前端入口与内容切换：`src/main.tsx`、`src/App.tsx`
- 上传与并发处理：`src/components/layout/VisualCanvas.tsx`
- 控制台交互与芯片：`src/components/layout/DirectorConsole.tsx`
- 一键生成脚本现状：`src/components/layout/DirectorConsole.tsx`
- API 封装层：`src/lib/api.ts`
- 后端脚本生成参考：`backend/main.py`
- 多模态对话封装：`backend/main.py`
- 视频生成流程：`backend/main.py`
