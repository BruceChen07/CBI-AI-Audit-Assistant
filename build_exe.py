import PyInstaller.__main__
import os
import shutil

# 清理之前的构建
if os.path.exists('dist'):
    shutil.rmtree('dist')
if os.path.exists('build'):
    shutil.rmtree('build')

# PyInstaller 参数
args = [
    '--onedir',  # 目录模式
    '--windowed',
    '--name=hackathon-app',
    '--distpath=dist',
    '--workpath=build',
    '--specpath=.',
    '--clean',
    '--noconfirm',
    '--noupx',  # 禁用UPX压缩，提高兼容性
    
    # 数据文件
    '--add-data=frontend/build;frontend/build',
    '--add-data=mapping;mapping',
    '--add-data=src/chroma_db;chroma_db',
    '--add-data=src/token;token',
    
    # 基础科学计算库隐藏导入
    '--hidden-import=numpy',
    '--hidden-import=numpy.core._multiarray_umath',
    '--hidden-import=numpy.linalg._umath_linalg',
    '--hidden-import=numpy.random._common',
    '--hidden-import=numpy.random._mt19937',
    
    # SciPy 完整隐藏导入
    '--hidden-import=scipy',
    '--hidden-import=scipy._lib._ccallback_c',
    '--hidden-import=scipy.sparse.csgraph._validation',
    '--hidden-import=scipy.special.cython_special',
    '--hidden-import=scipy.linalg.cython_blas',
    '--hidden-import=scipy.linalg.cython_lapack',
    '--hidden-import=scipy.stats',
    '--hidden-import=scipy.stats._stats',
    '--hidden-import=scipy.stats.distributions',
    '--hidden-import=scipy.stats._distn_infrastructure',
    '--hidden-import=scipy.stats._continuous_distns',
    '--hidden-import=scipy.stats._discrete_distns',
    
    # Scikit-learn 隐藏导入
    '--hidden-import=sklearn',
    '--hidden-import=sklearn.ensemble',
    '--hidden-import=sklearn.tree',
    '--hidden-import=sklearn.utils._cython_blas',
    '--hidden-import=sklearn.neighbors.typedefs',
    '--hidden-import=sklearn.neighbors.quad_tree',
    '--hidden-import=sklearn.tree._utils',
    '--hidden-import=sklearn.utils.fixes',
    '--hidden-import=sklearn.utils.validation',
    '--hidden-import=sklearn.utils._array_api',
    '--hidden-import=sklearn.utils._param_validation',
    
    # 其他依赖
    '--hidden-import=chromadb',
    '--hidden-import=chromadb.config',
    '--hidden-import=openai',
    '--hidden-import=fastapi',
    '--hidden-import=uvicorn',
    '--hidden-import=pydantic',
    '--hidden-import=sqlalchemy',
    '--hidden-import=passlib',
    '--hidden-import=jose',
    '--hidden-import=python_multipart',
    '--hidden-import=pandas',
    '--hidden-import=tiktoken',
    '--hidden-import=sentence_transformers',
    
    # 收集所有相关包
    '--collect-all=numpy',
    '--collect-all=scipy',
    '--collect-all=sklearn',
    '--collect-all=chromadb',
    '--collect-all=sentence_transformers',
    '--collect-all=pandas',
    
    'src/main.py'
]

PyInstaller.__main__.run(args)