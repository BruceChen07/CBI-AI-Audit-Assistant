# 创建虚拟环境
python -m venv .venv
.venv\Scripts\activate

# 安装Python依赖
pip install -r requirements.txt

# 安装前端依赖
cd frontend
npm install