"use client";
import LLMPanel from "@/app/ui/llm-panel";
import ChatBot from "@/app/ui/chatbot";
import LecturePage from "@/app/ui/lecture_page";
import { io } from "socket.io-client";

const sourceFile = 'chapter2/chapter2.ipynb';

const notebooks = [
  "chapter2/chapter2-1.ipynb",
  "chapter2/chapter2-2.ipynb",
  // 添加更多的 Notebook 路径
];
const indexArray=[[0,1],[2,3,4],[5,6],[7,8],[9,10,11],[12,13],[14,15]];

const learning_notebook = "chapter2/chapter2-learning.ipynb";

export default function Page() {
  var socket: any;
  socket = io("http://localhost:3001");

  var host_info = { source_type: "HOST", source_id: "Lecture_2" };
  socket.emit("register", host_info);
  return (
    <div className="flex h-full gap-10">
      <div className="w-3/5 h-full grid-rows-2">
      <LecturePage learning_notebook={learning_notebook} notebooks={notebooks}/>
      </div>

      <div className="w-2/5 h-full grid-rows-2">
        <LLMPanel socket={socket} host_info={host_info} sourceFile={sourceFile} indexArray = {indexArray}/>
        <ChatBot />
      </div>
    </div>
  );
}