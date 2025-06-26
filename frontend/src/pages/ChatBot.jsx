import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

export default function ChatBot() {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [language, setLanguage] = useState('en-IN');
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const messagesEndRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      setVoices(allVoices);
      const preferred = allVoices.find((v) => v.lang === language);
      if (preferred) setSelectedVoiceURI(preferred.voiceURI);
      else if (!selectedVoiceURI && allVoices.length) setSelectedVoiceURI(allVoices[0].voiceURI);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;
    utterance.lang = language;
    speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setChatLog((prev) => [...prev, { user: trimmed, bot: '...' }]);
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/chat', { message: trimmed, language });
      const botReply = res.data.reply;

      setChatLog((prev) => {
        const newLog = [...prev];
        newLog[newLog.length - 1].bot = botReply;
        return newLog;
      });
      speak(botReply);
    } catch (err) {
      const fail = 'Sorry, something went wrong.';
      setChatLog((prev) => {
        const newLog = [...prev];
        newLog[newLog.length - 1].bot = fail;
        return newLog;
      });
      speak(fail);
    }
  };

  const handleMicInput = () => {
    recognition.lang = language;
    recognition.start();
    recognition.onresult = (e) => setMessage(e.results[0][0].transcript);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="text-center p-5 border-b border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-slate-800/60">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">🛡️ Forts of Bharath Chat Assistant</h2>
        </div>

        {/* Chat display */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gradient-to-b from-transparent to-indigo-50 dark:to-slate-900">
          {chatLog.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 italic mt-10">Ask about any fort in India...</p>
          )}
          {chatLog.map((entry, index) => (
            <div key={index} className="space-y-2">
              <div className="text-right">
                <span className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-tl-3xl rounded-bl-3xl rounded-tr-xl shadow">
                  {entry.user}
                </span>
              </div>
              <div className="text-left">
                <span className="inline-block bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white px-4 py-2 rounded-tr-3xl rounded-br-3xl rounded-tl-xl shadow">
                  {entry.bot}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input section */}
        <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white outline-none text-sm"
            >
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
              <option value="te-IN">Telugu</option>
            </select>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask something about Indian forts..."
              className="flex-1 px-4 py-2 rounded-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={sendMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-semibold transition-all shadow-lg"
              title="Send"
            >
              Send
            </button>

            <button
              onClick={handleMicInput}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-all shadow-md"
              title="Speak"
            >
              🎙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
