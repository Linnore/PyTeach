"use client";
import LLMPanel from "@/app/ui/llm-panel";
import ChatBot from "@/app/ui/chatbot";
import Lecture12Page from "./Lecture12";
import { io } from "socket.io-client";
const sourceFile = 'chapter12/chapter12-1.ipynb';
export default function Page() {
  var socket: any;
  socket = io("http://localhost:3001");

  var host_info = {source_type:"HOST", source_id:"Lecture_12"};
  socket.emit("register", host_info);
  return (
    <div className="flex h-full gap-10">
      <div className="w-3/5 h-full grid-rows-2">
        <Lecture12Page />
      </div>

      <div className="w-2/5 h-full grid-rows-2">
        <LLMPanel socket={socket} host_info={host_info} sourceFile={sourceFile}/>
        <ChatBot />
      </div>
    </div>
  );
}