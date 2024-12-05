from dashvector import Client
from .embedding import generate_embeddings
import dashscope
import os


def search_relevant_text(question, k):
    dashscope.api_key = os.getenv("RAG_DASHSCOPE_API")
    client = Client(api_key=os.getenv("RAG_DASHVECTOR_API"),
                    endpoint=os.getenv("RAG_DASHVECTOR_ENDPOINT"))

    collection = client.get('tutorial_embedings')
    assert collection

    rsp = collection.query(generate_embeddings(question),
                           output_fields=['raw'],
                           topk=k)
    assert rsp
    return rsp
