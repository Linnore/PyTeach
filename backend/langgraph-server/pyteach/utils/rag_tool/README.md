# README for RAG part

## Overview

- **embedding.py**: Script used to create a collection on the cloud for the first time.
- **search.py**: Implements the function to retrieve embeddings from the cloud.
- **RAG.py**: Main script that handles the retrieval and reranking of embeddings.

## Dependencies

Ensure you have the following dependencies installed:

```bash
pip install dashvector==1.0.1
pip install dashscope==1.20.11
```

## Usage

1. **Create Collection**: Run `embedding.py` to initialize the collection on the cloud.(No need to run again)
2. **Retrieve Embeddings**: Use `search.py` to fetch embeddings from the cloud.
3. **Retrieval and Reranking**: Execute `RAG.py` for the main retrieval and reranking process.(for agent)
---
