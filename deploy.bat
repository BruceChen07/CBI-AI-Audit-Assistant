@echo off
echo 正在设置Python环境...
python -m venv .venv
call .venv\Scripts\activate.bat

echo 安装Python依赖...
pip install -r requirements.txt

echo 设置前端环境...
cd frontend
npm install
npm run build
cd ..

echo 部署完成！
echo 运行 start_services.bat 启动服务
pause