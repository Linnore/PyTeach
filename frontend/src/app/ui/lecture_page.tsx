"use-client"
import { useState, useEffect } from "react";

export default function LecturePage({ learning_notebook, notebooks }: any) {
    const [currentNotebookIndex, setCurrentNotebookIndex] = useState(0);
    const [currentNotebookPath, setCurrentNotebookPath] = useState(learning_notebook);

    const handleSwitchToLearningNotebook = () => {
        setCurrentNotebookPath(learning_notebook);
    }

    const handleSwitchToReviewNotebook = () => {
        setCurrentNotebookPath(notebooks[0]);
    }

    const handleNextNotebook = () => {
        if (currentNotebookPath != learning_notebook) {
            setCurrentNotebookIndex((prevIndex) => {
                var resultIndex = Math.min(prevIndex + 1, notebooks.length - 1);
                setCurrentNotebookPath(notebooks[resultIndex]);
                return resultIndex;
            });
        };
    };

    const handlePreviousNotebook = () => {
        if (currentNotebookPath != learning_notebook) {
            setCurrentNotebookIndex((prevIndex) => {
                var resultIndex = Math.max(prevIndex - 1, 0);
                setCurrentNotebookPath(notebooks[resultIndex]);
                return resultIndex;
            });
        };
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
                        onClick={handleSwitchToLearningNotebook}
                        className="p-2 bg-blue-500 text-white rounded">
                        Learning Mode
                    </button>
                    <button
                        onClick={handleSwitchToReviewNotebook}
                        className="p-2 bg-blue-500 text-white rounded">
                        Review Mode
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
                    src={`http://127.0.0.1:8081/notebooks/index.html?path=${currentNotebookPath}&kernel=python3}`}
                    className="w-full h-full rounded-lg shadow-lg"
                ></iframe>
            </div>
        </div>
    );
}