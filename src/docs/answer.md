%%{init: {'theme':'neutral','sequence': {'mirrorActors': false}} }%%
sequenceDiagram
    autonumber
    actor User as 业务用户
    participant Browser as 浏览器(前端UI)
    box rgba(222,245,230,0.6) 后端
      participant API as 应用服务(API)
      participant Auth as 鉴权/用户态
      participant RAG as RAG服务(检索+组装提示)
      participant VecDB as 向量库(ChromaDB)
      participant TokenMon as Token&费用监控
      participant Files as 映射/配置(mapping/*.csv)
    end
    participant LLM as 大语言模型(云端/本地)

    User->>Browser: 输入问题，点击“发送”
    Browser->>API: POST /api/ask {问题文本}
    API->>Auth: 校验登录/权限
    Auth-->>API: 通过
    API->>RAG: 触发检索流程(含埋点)
    RAG->>VecDB: 相似检索(找到最相关的资料)
    VecDB-->>RAG: 返回候选文档片段
    RAG->>Files: 读取定价/映射等辅助信息(若需要)
    RAG-->>API: 生成提示词(问题+上下文片段)

    Note over API,TokenMon: 统计“输入Token”大小(提示词长度)
    API->>TokenMon: record(input_tokens, model, 单价配置)
    API->>LLM: 调用模型，开始流式生成回答
    LLM-->>API: 流式返回“输出Token”
    API->>TokenMon: record(output_tokens, model, 单价配置)

    TokenMon-->>API: 计算本次费用 = 输入单价*输入Token + 输出单价*输出Token
    API-->>Browser: 流式推送回答 + 元信息(可选：费用/Token统计)
    Browser-->>User: 前端逐字显示回答内容
    API->>TokenMon: 持久化本次会话统计(可导出/报表)