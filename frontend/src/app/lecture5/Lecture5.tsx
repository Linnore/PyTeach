"use client";
import { useState, useEffect } from "react";

const notebooks = [
  "chapter5/chapter5-1.ipynb",
  "chapter5/chapter5-2.ipynb",
  // 添加更多的 Notebook 路径
];

export default function Lecture5Page() {
  const [currentNotebookIndex, setCurrentNotebookIndex] = useState(0);

  const handleNextNotebook = () => {
    setCurrentNotebookIndex((prevIndex) => (prevIndex + 1) % notebooks.length);
  };

  const handlePreviousNotebook = () => {
    setCurrentNotebookIndex(
      (prevIndex) => (prevIndex - 1 + notebooks.length) % notebooks.length
    );
  };

  return (
    <div className="flex h-full w-full gap-10"> {/* 添加 w-full 确保其填满父容器 */}
      {/* 中间部分 */}
      <div className="w-full">
        {/* 翻页按钮 */}
        <div className="flex justify-between mb-2">
          <button
            onClick={handlePreviousNotebook}
            className="p-2 bg-blue-500 text-white rounded"
          >
            Previous Notebook
          </button>
          <button
            onClick={handleNextNotebook}
            className="p-2 bg-blue-500 text-white rounded"
          >
            Next Notebook
          </button>
        </div>

        {/* Jupyter iframe */}
        <iframe
          name="jupyterlab"
          src={`http://127.0.0.1:8081/notebooks/index.html?path=${notebooks[currentNotebookIndex]}&kernel=python3}`}
          className="w-full h-full rounded-lg shadow-lg"
        ></iframe>
      </div>
    </div>
  );
}