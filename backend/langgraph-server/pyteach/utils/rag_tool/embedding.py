import os
import logging
import configparser
import dashscope
from dashscope import TextEmbedding
from dashvector import Client, Doc

# 设置日志记录
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def prepare_data(path):
    """读取指定路径下的所有txt文件，并返回文件内容列表。"""
    docs = []
    for file in os.listdir(path):
        if file.endswith('.txt'):
            with open(os.path.join(path, file), 'r', encoding='utf-8') as f:
                docs.append(f.read())
    return docs


def generate_embeddings(news):
    """生成文本嵌入向量。"""
    rsp = TextEmbedding.call(
        model=TextEmbedding.Models.text_embedding_v1,
        input=news
    )
    embeddings = [record['embedding'] for record in rsp.output['embeddings']]
    return embeddings if isinstance(news, list) else embeddings[0]


def split_into_chunks(text, chunk_size=512):
    """将文本分割成固定大小的块。"""
    words = text.split()
    chunks = [' '.join(words[i:i + chunk_size])
              for i in range(0, len(words), chunk_size)]
    return chunks


# if __name__ == '__main__':
#     # 设置 DashScope API Key
#     dashscope.api_key = os.getenv('DASHSCOPE_API_KEY')
#     # config = configparser.ConfigParser()
#     # config.read('config.ini')
#     # dashscope.api_key = config['dashscope']['api_key']

#     # 初始化 dashvector client
#     # client = Client(
#     #     api_key=config['dashvector']['api_key'],
#     #     endpoint=config['dashvector']['endpoint']
#     # )
#     client = Client(
#         api_key=os.getenv('DASHVECTOR_API_KEY'),
#         endpoint=os.getenv('DASHVECTOR_ENDPOINT')
# )

#     # 创建集合：指定集合名称和向量维度, text_embedding_v1 模型产生的向量统一为 1536 维
#     rsp = client.create('tutorial_embedings', 1536)
#     assert rsp, "Failed to create collection"

#     # 加载语料
#     id = 0
#     collection = client.get('tutorial_embedings')

#     # 读取所有文件内容
#     news_list = prepare_data('./material')

#     # 分割文本成块并生成嵌入向量
#     all_chunks = []
#     for news in news_list:
#         chunks = split_into_chunks(news)
#         all_chunks.extend(chunks)

#     # 生成嵌入向量
#     vectors = generate_embeddings(all_chunks)

#     # 写入 dashvector 构建索引
#     docs_to_upsert = [
#         Doc(id=str(id + i), vector=vector, fields={"raw": chunk})
#         for i, (vector, chunk) in enumerate(zip(vectors, all_chunks))
#     ]

#     rsp = collection.upsert(docs_to_upsert)
#     assert rsp, "Failed to upsert documents"

#     logger.info(f"Successfully upserted {len(docs_to_upsert)} chunks.")
