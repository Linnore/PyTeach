"use client";

import { useChat } from "ai/react";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';

// Define the structure of the AI response
interface AIMessage {
  responses: string[];
}

// Update Message interface to use string for id
interface Message {
  id: string; // Change id to string
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBot() {
  const { input, handleInputChange, setInput } = useChat({
    api: "/api/chat",
    keepLastMessageOnError: true,
  });

  const [loadingState, setLoadingState] = useState(false); // Single state for loading and editability
  const [threadId, setThreadId] = useState("0");
  const [newThreadId, setNewThreadId] = useState("");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Message[]>>({"0": []});

  // Declare a reference to the textarea
  let textareaRef: HTMLTextAreaElement | null = null;

  // Fetch historical chats when the component mounts
  useEffect(() => {
    const fetchThreadIds = async () => {
      try {
        const response = await fetch("http://localhost:8080/chat/get_thread_ids");
        if (!response.ok) {
          throw new Error(`Error fetching thread IDs: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log("Fetched thread IDs:", data); // Log the raw response
  
        // Ensure that thread_ids is an array of strings
        const threads: Record<string, Message[]> = {};
        (data.thread_ids as string[]).forEach((threadId: string) => {
          threads[threadId] = []; // Initialize with an empty array of messages
        });
  
        setMessagesByThread((prev) => ({ ...prev, ...threads }));
      } catch (error) {
        console.error("[chatbot.tsx][fetchThreadIds] error fetching thread IDs:", error);
      }
    };
  
    fetchThreadIds(); // Call the function to fetch thread IDs
  }, []);

  // Effect to manage loading state based on messages
  useEffect(() => {
    const lastMessage = messagesByThread[threadId]?.[messagesByThread[threadId].length - 1];

    if (lastMessage) {
      setLoadingState(lastMessage.role === "user"); // Set loading if the last message was from the user
    }

    // Update the newThreadId input whenever the threadId changes
    setNewThreadId(threadId);
  }, [messagesByThread, threadId]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() !== "") {
      console.log("[chatbot.tsx][handleFormSubmit] thread_id:", threadId,", input:", input);
      
      // Immediately add the user message to the messages state
      const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
      
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] || []), // Spread existing messages
          userMessage // Add user message immediately
        ],
      }));

      setLoadingState(true); // Set loading state
      const originalInput = input;

      // Clear the input field immediately
      setInput(''); // Directly clear the input state

      // Construct the payload
      const payload = {
        input: {
          messages: [originalInput], // Wrap the input in the expected structure
        },
        config: {
          configurable: {
            thread_id: threadId, // Include thread_id directly
          },
        },
        kwargs: {}, // Optional parameters
      };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // Convert payload to JSON string
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log("[chatbot.tsx][handleFormSubmit][raw response:", responseText, "]")
        const cleanedResponse = responseText.replace(/^\d+:/, '').trim(); // Strip prefix
        console.log("[chatbot.tsx][handleFormSubmit][cleaned response:", cleanedResponse, "]")

        const cleanedResponseDict = JSON.parse(JSON.parse(cleanedResponse)); // Convert string to dict
        const aiMessage: string = cleanedResponseDict['responses'][cleanedResponseDict['responses'].length - 1];
        console.log("[chatbot.tsx][handleFormSubmit][aiMessage:", aiMessage, "]")


        // Update messages state for the current thread
        const aiResponseMessage: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: aiMessage
        };
        console.log("[chatbot.tsx][handleFormSubmit][aiResponseMessage.content:", aiResponseMessage.content, "]")
        setMessagesByThread((prev) => ({
          ...prev,
          [threadId]: [
            ...(prev[threadId] || []), // Ensure to spread an empty array if the thread doesn't exist
            aiResponseMessage // Add AI response after fetch
          ]
        }));

      } catch (error) {
        console.error("[chatbot.tsx][handleFormSubmit] error sending message:", error);
      } finally {
        setLoadingState(false); // Reset loading state
      }
    }
  };

  // Listen for messages from the jupyter
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'from-iframe-to-chatbot') {
        const { type, task, content } = event.data;
        console.log(task)
        if (task === "teach") {
          handleExternalMessage(content);
        }
        if (task === "comment" || task === "explain" || task === "debug") {
          handleExternalMessage_tasks(task);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleExternalMessage = async (content: string) => {
    setLoadingState(true); // Set loading state

    // Construct the payload
    const payload = {
      input: {
        messages: [content], // Include both prompt and content
      },
      config: {
        configurable: {
          thread_id: threadId, // Include thread_id directly
          task_type: 'teach',
        },
      },
      kwargs: {}, // Optional parameters
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Convert payload to JSON string
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log("[chatbot.tsx][handleExternalMessage][raw response:", responseText, "]")
      const cleanedResponse = responseText.replace(/^\d+:/, '').trim(); // Strip prefix
      console.log("[chatbot.tsx][handleExternalMessage][cleaned response:", cleanedResponse, "]")

      const cleanedResponseDict = JSON.parse(JSON.parse(cleanedResponse)); // Convert string to dict
      const aiMessage: string = cleanedResponseDict['responses'][cleanedResponseDict['responses'].length - 1];
      console.log("[chatbot.tsx][handleExternalMessage][aiMessage:", aiMessage, "]")

      // Update messages state for the current thread
      const aiResponseMessage: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: aiMessage
      };
      console.log("[chatbot.tsx][handleExternalMessage][aiResponseMessage.content:", aiResponseMessage.content, "]")
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] || []), // Ensure to spread an empty array if the thread doesn't exist
          aiResponseMessage // Add AI response after fetch
        ]
      }));

    } catch (error) {
      console.error("[chatbot.tsx][handleExternalMessage] error sending message:", error);
    } finally {
      setLoadingState(false); // Reset loading state
    }
  };
  
  const handleExternalMessage_tasks = async (task_type: string) => { 
    setLoadingState(true); // Set loading state

    // Construct the payload
    const payload = {
      input: {
        messages: [""], // Include both prompt and content
      },
      config: {
        configurable: {
          thread_id: threadId, // Include thread_id directly
          task_type: task_type,
        },
      },
      kwargs: {}, // Optional parameters
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Convert payload to JSON string
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log("[chatbot.tsx][handleExternalMessage][raw response:", responseText, "]")
      const cleanedResponse = responseText.replace(/^\d+:/, '').trim(); // Strip prefix
      console.log("[chatbot.tsx][handleExternalMessage][cleaned response:", cleanedResponse, "]")

      const cleanedResponseDict = JSON.parse(JSON.parse(cleanedResponse)); // Convert string to dict
      const aiMessage: string = cleanedResponseDict['responses'][cleanedResponseDict['responses'].length - 1];
      console.log("[chatbot.tsx][handleExternalMessage][aiMessage:", aiMessage, "]")

      // Update messages state for the current thread
      const aiResponseMessage: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: aiMessage
      };
      console.log("[chatbot.tsx][handleExternalMessage][aiResponseMessage.content:", aiResponseMessage.content, "]")
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] || []), // Ensure to spread an empty array if the thread doesn't exist
          aiResponseMessage // Add AI response after fetch
        ]
      }));
    } catch (error) {
      console.error("[chatbot.tsx][handleExternalMessage] error sending message:", error);
    } finally {
      setLoadingState(false); // Reset loading state
    }
  };
  
  // const handleExternalMessage = async (task_type: string, prompt: string, content: string) => { 
  //   setLoadingState(true); // Set loading state

  //   // Construct the payload
  //   const inputMessage = (prompt && content) ? [prompt + content] : []; 
  //   let payload;
  //   if (task_type === "teach") {
  //     const payload = {
  //       input: {
  //         messages: inputMessage // Include both prompt and content
  //       },
  //       config: {
  //         configurable: {
  //           thread_id: threadId, // Include thread_id directly
  //         },
  //       },
  //       kwargs: {}, // Optional parameters
  //     };
  //   }else{
  //     const payload = {
  //       input: {
  //         messages: inputMessage, 
  //       },
  //       config: {
  //         configurable: {
  //           thread_id: threadId,
  //           task_type: task_type,
  //         },
  //       },
  //       kwargs: {}, 
  //     };
  //   }
  //   console.log(payload)
  //   try {
  //     const response = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload), // Convert payload to JSON string
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.status} - ${response.statusText}`);
  //     }

  //     const responseText = await response.text();
  //     console.log("[chatbot.tsx][handleExternalMessage][raw response:", responseText, "]")
  //     const cleanedResponse = responseText.replace(/^\d+:/, '').trim(); // Strip prefix
  //     console.log("[chatbot.tsx][handleExternalMessage][cleaned response:", cleanedResponse, "]")

  //     const cleanedResponseDict = JSON.parse(JSON.parse(cleanedResponse)); // Convert string to dict
  //     const aiMessage: string = cleanedResponseDict['responses'][cleanedResponseDict['responses'].length - 1];
  //     console.log("[chatbot.tsx][handleExternalMessage][aiMessage:", aiMessage, "]")

  //     // Update messages state for the current thread
  //     const aiResponseMessage: Message = { 
  //         id: (Date.now() + 1).toString(), 
  //         role: 'assistant', 
  //         content: aiMessage
  //     };
  //     console.log("[chatbot.tsx][handleExternalMessage][aiResponseMessage.content:", aiResponseMessage.content, "]")
  //     setMessagesByThread((prev) => ({
  //       ...prev,
  //       [threadId]: [
  //         ...(prev[threadId] || []), // Ensure to spread an empty array if the thread doesn't exist
  //         aiResponseMessage // Add AI response after fetch
  //       ]
  //     }));

  //   } catch (error) {
  //     console.error("[chatbot.tsx][handleExternalMessage] error sending message:", error);
  //   } finally {
  //     setLoadingState(false); // Reset loading state
  //   }
  // };

  const handleThreadIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only single-digit numeric input
    if (/^[0-9]{0,1}$/.test(value)) {
      setNewThreadId(value);
      setThreadId(value); // Update threadId regardless of existence
    }
  };

  // Function to clear the chat history for the current thread
  const handleClearChat = async () => {
    try {
      const response = await fetch(`http://localhost:8080/chat/delete/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      // Clear messages from the state for the current thread
      setMessagesByThread((prev) => {
        const updatedMessages = { ...prev };
        delete updatedMessages[threadId]; // Remove the current thread from the state
        return updatedMessages;
      });

      // Optionally reset the current thread ID
      setThreadId("0");
      setNewThreadId(""); // Clear the input field for new thread ID

      console.log(`Chat history for thread ${threadId} deleted successfully.`);
    } catch (error) {
      console.error("[chatbot.tsx][handleClearChat] error deleting chat history:", error);
    }
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-200px)] h-full bg-white p-4 rounded shadow-md overflow-hidden">{/* 这里控制了chatbox的高度 目前 -200 可以根据上面按钮行数来修改减去px的多少 */}
      {/* Combined Thread ID Input */}
      <div className="mb-2 flex items-center">
        <label className="block text-sm font-medium text-gray-700 mr-2">Chat ID</label>
        <input
          type="text"
          className="w-10 rounded border border-gray-300 p-2 shadow-xl mr-2 text-center" // Adjusted width for a single digit
          value={newThreadId}
          onChange={handleThreadIdChange}
          placeholder="ID"
          inputMode="numeric" // Suggest numeric keyboard on mobile
          disabled={loadingState} // Control editability based on loading state
        />
        <select
          className="flex-1 rounded border border-gray-300 p-2 shadow-xl cursor-pointer"
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
          disabled={loadingState} // Control editability based on loading state
        >
          {Object.keys(messagesByThread).map((id) => (
            <option key={id} value={id}>
              Hist {id}
            </option>
          ))}
        </select>
        <button
          onClick={handleClearChat}
          className="ml-2 rounded border border-red-500 bg-red-200 px-2 py-1 text-red-700 hover:bg-red-300"
        >
          Clear Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messagesByThread[threadId]?.length ? (
          messagesByThread[threadId].map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`max-w-xs p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No messages in this thread.</div> // Message when no chat history exists
        )}
      </div>

      {/* Chat input */}
      {/* <div className="flex items-center mt-2">
        <input
          className="flex-1 rounded border border-gray-300 p-2 shadow-xl"
          value={input}
          placeholder={loadingState ? "Waiting for LLM..." : "Chat with LLM..."}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFormSubmit(e as any); // Ensure to call the submit function on Enter
            }
          }}
          disabled={loadingState} // Disable input when loading
        />
      </div> */}
      {/* Chat input with "Send" button */}
      <div className="flex items-center mt-2">
        <textarea
          ref={(el) => { textareaRef = el }}
          className="flex-1 rounded border border-gray-300 p-2 shadow-xl resize-none overflow-hidden" // 设置 resize 为 none 禁用手动调整
          value={input}
          placeholder={loadingState ? "Waiting for LLM..." : "Chat with LLM..."}
          onChange={(e) => {
            handleInputChange(e);
            e.target.style.height = "auto"; // 重置高度
            e.target.style.height = `${e.target.scrollHeight}px`; // 设置为内容的高度
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // 按下 Enter 键时发送（但 Shift + Enter 不会发送）
              e.preventDefault(); // 防止输入框插入新行
              handleFormSubmit(e as any);
            }
          }}
          disabled={loadingState}
        />
        <button
          onClick={(e) => {
            handleFormSubmit(e as any); // 不改动 handleFormSubmit
            // 在按钮点击后重置textarea的高度
            if (textareaRef) {
              textareaRef.style.height = "auto"; // 恢复原始高度
            }
          }}
          className="ml-2 rounded border border-blue-500 bg-blue-200 px-4 py-2 text-blue-700 hover:bg-blue-300 shadow-md"
        >
          Send
        </button>
      </div>
    </div>
  );
}