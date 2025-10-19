# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('frontend/build', 'frontend/build'), ('mapping', 'mapping'), ('src/chroma_db', 'chroma_db'), ('src/token', 'token')]
binaries = []
hiddenimports = ['numpy', 'numpy.core._multiarray_umath', 'numpy.linalg._umath_linalg', 'numpy.random._common', 'numpy.random._mt19937', 'scipy', 'scipy._lib._ccallback_c', 'scipy.sparse.csgraph._validation', 'scipy.special.cython_special', 'scipy.linalg.cython_blas', 'scipy.linalg.cython_lapack', 'scipy.stats', 'scipy.stats._stats', 'scipy.stats.distributions', 'scipy.stats._distn_infrastructure', 'scipy.stats._continuous_distns', 'scipy.stats._discrete_distns', 'sklearn', 'sklearn.ensemble', 'sklearn.tree', 'sklearn.utils._cython_blas', 'sklearn.neighbors.typedefs', 'sklearn.neighbors.quad_tree', 'sklearn.tree._utils', 'sklearn.utils.fixes', 'sklearn.utils.validation', 'sklearn.utils._array_api', 'sklearn.utils._param_validation', 'chromadb', 'chromadb.config', 'openai', 'fastapi', 'uvicorn', 'pydantic', 'sqlalchemy', 'passlib', 'jose', 'python_multipart', 'pandas', 'tiktoken', 'sentence_transformers']
tmp_ret = collect_all('numpy')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('scipy')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('sklearn')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('chromadb')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('sentence_transformers')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('pandas')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['src\\main.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='hackathon-app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='hackathon-app',
)
