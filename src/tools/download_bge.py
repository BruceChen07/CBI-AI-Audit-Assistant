from modelscope.hub.snapshot_download import snapshot_download
path = snapshot_download('AI-ModelScope/bge-small-en-v1.5', cache_dir='d:\\Workspace\\hackathon\\models')
print('Downloaded to:', path)