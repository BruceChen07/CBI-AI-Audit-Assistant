%%{init: {'theme':'forest','sequence': {'actorFontWeight': 700, 'mirrorActors': false}} }%%
sequenceDiagram
    autonumber
    actor User as 业务用户
    participant EXE as 桌面程序(Exe)
    participant Server as 应用服务(FastAPI+Uvicorn)
    participant Frontend as 前端静态资源(frontend/build)
    participant Browser as 浏览器

    User->>EXE: 双击运行 hackathon-app.exe
    EXE->>Server: 启动服务(监听 0.0.0.0:8000)
    Note right of Server: 加载配置/日志，挂载前端静态资源

    User->>Browser: 打开浏览器
    Browser->>Server: GET http://localhost:8000
    Server-->>Browser: 返回 index.html + JS/CSS (来自 frontend/build)
    Browser->>Frontend: 加载页面/脚本(静态资源)
    Frontend-->>User: 展示可交互页面