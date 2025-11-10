from sentence_transformers import SentenceTransformer
m = SentenceTransformer(r"d:\Workspace\hackathon\models\AI-ModelScope\bge-small-en-v1___5")
print(m.encode(["hello", "world"]).shape)