"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sql?: string;
  results?: Array<Record<string, any>>;
  error?: string;
  timestamp: Date;
}

interface VannaChatHandle {
  clearChat: () => void;
  getMessageCount: () => number;
}

interface VannaChatProps {
  onMessageCountChange?: (count: number) => void;
}

export const VannaChat = forwardRef<VannaChatHandle, VannaChatProps>(
  ({ onMessageCountChange }, ref) => {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      clearChat: () => {
        setMessages([]);
        setError(null);
      },
      getMessageCount: () => messages.length,
    }));

    // Notify parent of message count changes
    useEffect(() => {
      onMessageCountChange?.(messages.length);
    }, [messages.length, onMessageCountChange]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input.trim(),
          max_results: 100,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process question");
        setLoading(false);
        return;
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.error || (data.results && data.results.length > 0 ? `✅ Results found (${data.results.length} rows)` : "Processing..."),
        sql: data.sql,
        results: data.results,
        error: data.error,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden">
      {/* Messages Container - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">
                Welcome to Data Chat! 👋
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Ask questions like:
              </p>
              <ul className="text-sm mt-4 space-y-1 text-left inline-block bg-gray-100 p-4 rounded-lg">
                <li>💼 "List all departments"</li>
                <li>👥 "Show active interns"</li>
                <li>📢 "Recent announcements"</li>
                <li>📊 "Count interns by college"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* User Message */}
            {message.type === "user" && (
              <div className="max-w-2xl bg-violet-600 text-white rounded-lg rounded-tr-none px-4 py-3 shadow">
                <p className="text-sm font-medium">Your question:</p>
                <p className="text-sm mt-1">{message.content}</p>
                <p className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Assistant Message */}
            {message.type === "assistant" && (
              <div className="max-w-4xl w-full">
                {/* Error Response */}
                {message.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">❌</div>
                      <div className="flex-1">
                        <p className="font-semibold text-red-800">No Results</p>
                        <p className="text-sm text-red-700 mt-1">
                          {message.error.replace(/^[❌ℹ️]+\s*/, "")}
                        </p>
                      </div>
                    </div>
                    {message.sql && (
                      // SQL Display - DEVELOPMENT ONLY (UNCOMMENT TO VIEW)
                      <div className="mt-3 pt-3 border-t border-red-200" style={{display: 'none'}}>
                        <p className="text-xs font-semibold text-red-600 mb-2">
                          Generated SQL:
                        </p>
                        <code className="text-xs bg-gray-900 text-gray-100 px-3 py-2 rounded block overflow-x-auto font-mono">
                          {message.sql}
                        </code>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                )}

                {/* Success Response */}
                {!message.error && message.results && message.results.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 shadow space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">✅</div>
                      <div>
                        <p className="font-semibold text-green-800">Results Found</p>
                        <p className="text-sm text-green-700">
                          {message.results.length} row{message.results.length !== 1 ? "s" : ""} returned
                        </p>
                      </div>
                    </div>

                    {/* SQL Display - DEVELOPMENT ONLY (UNCOMMENT TO VIEW)
                    <div className="bg-white rounded border border-green-200 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        📝 Generated SQL:
                      </p>
                      <code className="text-xs bg-gray-900 text-green-400 px-3 py-2 rounded block overflow-x-auto font-mono break-words">
                        {message.sql}
                      </code>
                    </div>
                    */}

                    {/* Results Table */}
                    <div className="bg-white rounded border border-green-200 overflow-hidden">
                      <div className="text-xs font-semibold text-gray-600 p-3 bg-gray-50 border-b border-green-200">
                        📊 Results ({message.results.length} rows):
                      </div>
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-gray-100 border-b border-green-200">
                            <tr>
                              {Object.keys(message.results[0]).map((key) => (
                                <th
                                  key={key}
                                  className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {message.results.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-b border-gray-200 ${
                                  idx % 2 === 0
                                    ? "bg-white hover:bg-green-50"
                                    : "bg-gray-50 hover:bg-green-50"
                                } transition`}
                              >
                                {Object.values(row).map((value, valueIdx) => (
                                  <td
                                    key={valueIdx}
                                    className="px-4 py-2 text-gray-700 break-words max-w-xs"
                                  >
                                    {value === null || value === undefined ? (
                                      <span className="text-gray-400 italic">null</span>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-violet-50 border-2 border-violet-200 text-violet-800 px-4 py-3 rounded-lg rounded-tl-none shadow">
              <div className="flex space-x-2 mb-2">
                <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="text-sm font-medium">🔄 Processing your question...</p>
              <p className="text-xs text-violet-600 mt-1">Generating SQL and fetching data</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg shadow">
            <p className="font-semibold text-lg">⚠️ Connection Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold shadow"
          >
            {loading ? "🔄" : "Ask"}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2 flex gap-2">
          <span>💡</span>
          <span>
            Try: "List all departments" | "Show active interns" | "Count users" | "Recent announcements"
          </span>
        </p>
      </div>
    </div>
  );
});

VannaChat.displayName = "VannaChat";
