import re
from .search import search_relevant_text
RAG_template = '''Please refer to the following materials to answer the user's question:
#materials#\n'''
# 文本清洗函数


def clean_text(text):
    text = re.sub(r'[^\w\s]', '', text)
    text = text.lower()
    return text

# N-gram 提取函数


def get_ngrams(text, N=2):
    tokens = text.split()
    ngrams = set(zip(*[tokens[i:] for i in range(N)]))
    return ngrams

# 改进的 Jaccard 系数


def improved_jaccard(query_ngrams, doc_ngrams):
    intersection = query_ngrams.intersection(doc_ngrams)
    min_size = min(len(query_ngrams), len(doc_ngrams))
    if min_size == 0:
        return 0
    return len(intersection) / min_size


# 检索和重排序函数
def retrieve_and_rerank(query, top_k=2):
    cleaned_query = clean_text(query)
    query_ngrams = get_ngrams(cleaned_query, N=2)
    # 初步检索，扩大检索范围以便后续过滤
    indices = search_relevant_text(question=cleaned_query, k=top_k*2).output
    candidates = []
    for idx in indices:
        doc = idx.fields['raw']
        cleaned_doc = clean_text(doc)  # 对文档进行文本清洗
        doc_ngrams = get_ngrams(cleaned_doc, N=2)  # 提取文档的 N-grams

        # 计算改进的 Jaccard 系数
        jaccard_score = improved_jaccard(query_ngrams, doc_ngrams)
        if jaccard_score > 0:
            candidates.append((jaccard_score, doc))

    # 根据 Jaccard 系数进行重排序
    candidates.sort(key=lambda x: x[0], reverse=True)

    # 选取前 top_k 个文档
    reranked_docs = [doc for score, doc in candidates[:top_k]]
    return reranked_docs


# 定义自定义检索器
class CustomRetriever:
    def __init__(self, retrieve_fn):
        self.retrieve_fn = retrieve_fn

    def get_relevant_documents(self, query):
        # 调用检索函数并获取文档
        docs = self.retrieve_fn(query)

        # 打印检索到的文档内容
        # for doc in docs:
        # print(f"Retrieved Document: {doc}")

        # 转换为 LangChain 使用的 Document 类型
        return docs


def rag_function(query):
    retriever = CustomRetriever(retrieve_and_rerank)
    user_query = query
    relevant_docs = retriever.get_relevant_documents(user_query)
    organized_docs = "\n".join(
        [f"{i+1}. {doc}" for i, doc in enumerate(relevant_docs)])
    print(RAG_template+organized_docs+'\n'+'#user_query#'+'\n'+query)
    return RAG_template+organized_docs+'\n'+'#user_query#'+'\n'+query
