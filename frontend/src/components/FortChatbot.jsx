import React, { useState } from "react";

const FortChatbot = ({ fortName }) => {
  const [messages, setMessages] = useState([
    { text: `Hello! Ask me anything about ${fortName}.`, sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    try {
      const prompt = `You are a historical expert guiding users about the Indian fort named ${fortName}. Be friendly, informative, and specific.\n\nUser: ${input}`;

      const response = await fetch("http://localhost:5500/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...newMessages, { text: data.text, sender: "bot" }]);
      } else {
        throw new Error(data.error || "Failed to generate response");
      }
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages([...newMessages, { text: "Sorry, I couldn't process that request.", sender: "bot" }]);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-3 text-indigo-600 dark:text-indigo-300">Chat with Fort Guide</h2>
      <div className="h-64 overflow-y-auto bg-white dark:bg-gray-900 p-3 rounded mb-3 border border-gray-300 dark:border-gray-700">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-200 dark:bg-blue-600 text-black dark:text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder="Ask something about the fort..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-l bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-black dark:text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default FortChatbot;
