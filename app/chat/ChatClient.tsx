"use client";

import { useRef, useState, useEffect } from "react";
import { VannaChat } from "@/components/VannaChat";

interface ChatClientHandle {
  clearChat: () => void;
  getMessageCount: () => number;
}

export function ChatClient() {
  const chatRef = useRef<ChatClientHandle>(null);
  const [messageCount, setMessageCount] = useState(0);

  const handleClearChat = () => {
    chatRef.current?.clearChat();
    setMessageCount(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Page Header with Clear Chat Button */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Data Chat</h1>
            <p className="text-gray-600 text-sm mt-1">Ask questions about your data naturally</p>
          </div>
          {messageCount > 0 && (
            <button
              onClick={handleClearChat}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition font-medium"
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Chat Interface - Takes remaining space */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <VannaChat ref={chatRef} onMessageCountChange={setMessageCount} />
      </div>
    </div>
  );
}
