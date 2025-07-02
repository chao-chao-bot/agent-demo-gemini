# 向量数据库技术指南

## 概述

向量数据库是专门为存储、索引和查询高维向量数据而设计的数据库系统。它们是现代AI应用，特别是RAG系统的核心组件。

## 核心概念

### 向量嵌入
```
文本 → 嵌入模型 → 向量
"人工智能" → [0.1, 0.3, -0.2, 0.8, ...]
```

- **维度**：通常是128、384、768、1536等
- **语义相似性**：相似内容的向量在空间中距离较近
- **数值表示**：将非结构化数据转换为数值向量

### 相似性搜索
- **余弦相似度**：计算向量夹角
- **欧几里得距离**：计算空间距离
- **点积**：向量内积运算

## 主流向量数据库

### ChromaDB
```python
import chromadb

# 创建客户端
client = chromadb.Client()

# 创建集合
collection = client.create_collection(name="documents")

# 添加文档
collection.add(
    documents=["这是一个示例文档"],
    ids=["doc1"]
)

# 查询
results = collection.query(
    query_texts=["示例"],
    n_results=5
)
```

**特点**：
- 开源免费
- 简单易用
- 内置嵌入模型
- 支持元数据过滤

### Pinecone
```python
import pinecone

# 初始化
pinecone.init(api_key="your-api-key")

# 创建索引
index = pinecone.Index("example-index")

# 插入向量
index.upsert([(
    "doc1", 
    [0.1, 0.2, 0.3, ...],
    {"text": "文档内容"}
)])

# 查询
results = index.query(
    vector=[0.1, 0.2, 0.3, ...],
    top_k=5
)
```

**特点**：
- 托管服务
- 高性能
- 自动扩缩容
- 企业级安全

### Milvus
```python
from pymilvus import connections, Collection

# 连接
connections.connect("default", host="localhost", port="19530")

# 创建集合
collection = Collection("documents")

# 插入数据
collection.insert([
    [1, 2, 3],  # ids
    [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]  # vectors
])

# 搜索
results = collection.search(
    data=[[0.1, 0.2]], 
    anns_field="embeddings",
    param={"metric_type": "L2"},
    limit=5
)
```

**特点**：
- 分布式架构
- 支持多种索引算法
- GPU加速
- 大规模部署

## 技术架构

### 索引算法

#### HNSW (Hierarchical Navigable Small World)
- **层次结构**：多层图结构
- **快速查询**：O(log n) 复杂度
- **高精度**：接近暴力搜索的准确性

#### IVF (Inverted File)
- **聚类索引**：将向量聚类分组
- **内存效率**：减少内存占用
- **查询速度**：通过聚类中心加速搜索

#### LSH (Locality Sensitive Hashing)
- **哈希映射**：相似向量映射到同一桶
- **概率搜索**：牺牲精度换取速度
- **适用场景**：超大规模数据

### 存储优化

#### 向量压缩
```python
# 量化压缩
original_vector = [0.123456789, 0.987654321, ...]
quantized_vector = [0.12, 0.99, ...]  # 8位量化

# PCA降维
from sklearn.decomposition import PCA
pca = PCA(n_components=256)
compressed_vectors = pca.fit_transform(original_vectors)
```

#### 分片策略
- **水平分片**：按数据量分割
- **垂直分片**：按维度分割
- **混合分片**：结合多种策略

## RAG集成实践

### LangChain + ChromaDB
```python
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(
    texts=["文档1", "文档2", "文档3"],
    embedding=embeddings
)

# RAG检索
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
relevant_docs = retriever.get_relevant_documents("用户查询")
```

### 文档预处理
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 文本分块
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", "！", "？"]
)

chunks = splitter.split_text(long_document)
```

## 性能优化

### 查询优化
- **预过滤**：使用元数据过滤
- **批量查询**：减少网络往返
- **缓存策略**：缓存常用查询结果

### 索引优化
```yaml
# ChromaDB配置示例
chroma_settings:
  anonymized_telemetry: false
  persist_directory: "./chromadb"
  
index_params:
  metric: "cosine"
  index_type: "HNSW"
  M: 16
  efConstruction: 200
```

### 硬件优化
- **内存配置**：确保足够内存存储索引
- **SSD存储**：使用高速存储设备
- **GPU加速**：利用GPU并行计算

## 监控和维护

### 性能指标
- **查询延迟**：P95、P99延迟
- **吞吐量**：QPS (Queries Per Second)
- **准确率**：Recall@K, Precision@K

### 数据管理
```python
# 数据备份
collection.export("backup.json")

# 数据清理
collection.delete(ids=["old_doc_1", "old_doc_2"])

# 索引重建
collection.rebuild_index()
```

## 最佳实践

### 选型建议
- **原型开发**：ChromaDB (免费、简单)
- **生产环境**：Pinecone (托管、稳定)
- **大规模部署**：Milvus (分布式、高性能)

### 数据策略
- **嵌入模型选择**：根据语言和领域选择
- **向量维度**：平衡精度和性能
- **更新策略**：增量更新vs全量重建

### 安全考虑
- **访问控制**：API密钥管理
- **数据加密**：传输和存储加密
- **审计日志**：记录访问和操作

向量数据库是AI应用的基础设施，选择合适的方案对系统性能和成本至关重要。 