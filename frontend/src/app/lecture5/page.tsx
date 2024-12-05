import LLMPanel from "@/app/ui/llm-panel";
import ChatBot from "@/app/ui/chatbot";
import Lecture5Page from "./Lecture5";

export default function Page() {

  return (
    <div className="flex h-full gap-10">
      <div className="w-3/5 h-full grid-rows-2">
        <Lecture5Page />
      </div>

      <div className="w-2/5 h-full grid-rows-2">
        <LLMPanel />
        <ChatBot />
      </div>
    </div>
  );
}