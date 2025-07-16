import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Square, MessageSquare } from 'lucide-react';

export default function ChatBot() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [language, setLanguage] = useState('en-IN');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQueries = [
    "Tell me about Golkonda Fort",
    "Plan a trip to Raigad Fort",
    "गोलकोंडा किले के बारे में बताइए",
    "గోల్కొండ కోటకు ట్రిప్ ప్లాన్ చేయండి"
  ];

useEffect(() => {
  const loadVoices = () => {
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
    const matching = availableVoices.find(v => v.lang === language);
    setSelectedVoice(matching || null); // null if not supported
  };

  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}, [language]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const cleanText = (text) => {
    return text.replace(/\*+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  const speak = (text) => {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    if (selectedVoice) utter.voice = selectedVoice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setChatLog(prev => [...prev, { user: trimmed, bot: '...' }]);
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, language })
      });

      const data = await res.json();
      const botReply = cleanText(data.reply);

      setChatLog(prev => {
        const updated = [...prev];
        updated[updated.length - 1].bot = botReply;
        return updated;
      });

      speak(botReply);
    } catch (err) {
      const fail = 'Sorry, something went wrong.';
      setChatLog(prev => {
        const updated = [...prev];
        updated[updated.length - 1].bot = fail;
        return updated;
      });
      speak(fail);
    }
  };

  const handleMicInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = language;
    recognition.start();
    recognition.onresult = (e) => setMessage(e.results[0][0].transcript);
  };

  return (
    <div className="h-screen overflow-hidden flex justify-center items-start pt-16 px-4 bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#0f172a] text-white">
      <div className="w-full max-w-4xl h-[calc(100vh-4rem)] flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-white/10 backdrop-blur-xl shadow-lg animate-fadeIn">
        <div className="text-center p-6 bg-white/10 border-b border-white/10">
          <h2 className="text-3xl font-bold text-white drop-shadow tracking-wide">🛡️ Forts of Bharath Chat Assistant</h2>
          <p className="text-sm text-slate-300 mt-1">Ask about Indian forts – history, travel tips, trip planning 🏰</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 px-6 pt-4 text-sm">
          {suggestedQueries.map((query, idx) => (
            <button
              key={idx}
              onClick={() => setMessage(query)}
              className="px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-800 text-white text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <MessageSquare size={16} />
              {query}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {chatLog.length === 0 && (
            <p className="text-center text-slate-400 italic mt-10">Start a conversation about Indian forts...</p>
          )}
          {chatLog.map((entry, index) => (
            <div key={index} className="space-y-2">
              <div className="text-right animate-fadeInUp">
                <span className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-2xl shadow-md">
                  {entry.user}
                </span>
              </div>
              <div className="text-left animate-fadeInUp">
                <span className="inline-block bg-white/20 text-white px-5 py-2 rounded-2xl shadow-inner backdrop-blur-sm">
                  {entry.bot}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg px-3 py-2 bg-white/80 text-gray-800 outline-none text-sm shadow-inner"
            >
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
              <option value="te-IN">Telugu</option>
              <option value="ta-IN">Tamil</option>
              <option value="kn-IN">Kannada</option>
              <option value="ml-IN">Malayalam</option>
              <option value="mr-IN">Marathi</option>
              <option value="gu-IN">Gujarati</option>
              <option value="bn-IN">Bengali</option>
            </select>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type or speak your question..."
              className="flex-1 px-4 py-2 rounded-full bg-white/90 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md placeholder-slate-500"
            />

            <button
              onClick={sendMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium shadow-lg transition-all"
              title="Send Message"
            >
              <Send size={18} />
              Send
            </button>

            {/* Speak Button */}
<button
  onClick={handleMicInput}
  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all"
  title="Start Voice Input"
>
  <Mic size={18} />
  Speak
</button>

{/* TTS Stop Button */}
{isSpeaking && selectedVoice && (
  <button
    onClick={() => {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }}
    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all"
    title="Stop Speaking"
  >
    <Square size={18} />
    Stop
  </button>
)}



          </div>
        </div>
      </div>
    </div>
  );
}
