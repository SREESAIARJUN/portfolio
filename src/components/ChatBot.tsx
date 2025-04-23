
import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";

const API_KEY_PLACEHOLDER = "AIzaSyAZn35XN5nxjiW0COUFJqG5HjNhnnnO79M";
interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: inputMessage };
    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      if (!API_KEY_PLACEHOLDER) {
        throw new Error("AI API key not set. Please add your Gemini API key to a .env file.");
      }

      const ai = new GoogleGenAI({ apiKey: API_KEY_PLACEHOLDER });

      const contents = [
        ...messages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        })),
        {
          role: "user",
          parts: [{ text: inputMessage }]
        }
      ];

      const config = {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'text/plain',
        systemInstruction: [
          {
            text: `You are a helpful and professional AI portfolio assistant also an AI twin of Kosinepalli Arjun Sai, an AI/ML engineer, GenAI researcher, and tech startup founder from Tirupati, India. Your role is to guide visitors through Arjun's portfolio, projects, research, and experience. Always be concise yet informative, engaging but technical when required.
Arjun is a final-year B.Tech student at Mohan Babu University (CGPA: 9.82/10), pursuing a minor in AI at IIT Ropar (CGPA: 9.0/10). He’s skilled in Python (expert), ML frameworks (TensorFlow, PyTorch, Scikit-learn), and has hands-on experience with NLP, LLM fine-tuning, anomaly detection, time-series forecasting, and deploying ML apps using Streamlit, FastAPI, and cloud platforms (GCP, AWS).
He has developed impactful projects like:
T+1 Sentinel: A trade risk engine for DTCC using Isolation Forest and LSTM.
FIR LegalMate: A GenAI-based legal drafting tool using LLMs and LangChain.
He’s also authored two conference papers and is filing a patent on AI-based lip sync and dubbing.
Arjun is an incoming intern at DTCC and works as a freelance LLM engineer at Outlier AI, having improved domain-specific LLM performance by 15%. He has attended Amazon ML Summer School and led the IEEE AI/ML student chapter at MBU.
He’s won 1st place at national hackathons (IBM CodeVerse, Xhorizon) and has certifications from DeepLearning.AI and Coding Ninjas.
When answering, offer to show GitHub repositories, live app demos, explain technologies used, or walk through a project/research paper. If the user seems interested in startup work, mention his stealth-mode GenAI drone startup GarudaOne, focused on content creators.
Always reflect Arjun's curiosity, passion for building, and technical depth in your tone.`,
          }
        ],
      };

      const model = "gemini-2.0-flash-lite";

      const response = await ai.models.generateContentStream({ model, config, contents });

      let text = "";
      for await (const chunk of response) {
        if (chunk && typeof chunk.text === "string") {
          text += chunk.text;
        }
      }

      if (text) {
        const aiMessage = {
          role: "assistant" as const,
          content: text
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast.error("Received an empty response from the AI");
      }
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      toast.error(error?.message || "Failed to connect to Gemini API. Please check the API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageWithLinks = (message: string) => {
    const sectionMap: Record<string, string> = {
      "about": "about",
      "experience": "experience",
      "projects": "projects",
      "publications": "publications",
      "skills": "skills",
      "achievements": "achievements",
      "certifications": "certifications"
    };

    let processedMessage = message;

    Object.entries(sectionMap).forEach(([keyword, sectionId]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      processedMessage = processedMessage.replace(regex, (match) => {
        return `<span class="text-blue-400 cursor-pointer hover:underline" data-section="${sectionId}">${match}</span>`;
      });
    });

    return (
      <div
        dangerouslySetInnerHTML={{ __html: processedMessage }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.dataset.section) {
            handleScrollToSection(target.dataset.section);
          }
        }}
      />
    );
  };

  const handleScrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `I've navigated you to the ${sectionId} section.`
      }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button
          onClick={toggleChat}
          size="icon"
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-portfolio-purple to-blue-600 animate-pulse-glow border-4 border-white/70 relative overflow-visible"
          style={{ boxShadow: "0 0 18px 4px #8B5CF688, 0 8px 32px 0 #8B5CF633" }}
          aria-label="Open Arjun's AI Twin"
          title="Open Arjun's AI Twin"
        >
          <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-portfolio-purple opacity-30 left-0 top-0 blur-md"></span>
          <span className="absolute animate-pulse inline-flex h-full w-full rounded-full bg-blue-500 opacity-20 left-0 top-0"></span>
          <Bot className="relative h-8 w-8 text-white drop-shadow-lg" />
        </Button>
      )}
      {isOpen && (
        <div className="animate-scale origin-bottom-right shadow-2xl rounded-3xl overflow-hidden w-80 max-w-[90vw] bg-gradient-to-br from-portfolio-purple/90 via-blue-600/90 to-portfolio-dark/90 border border-portfolio-purple/60">
          <Card className="bg-white/10 backdrop-blur-lg border-0 shadow-none rounded-3xl relative">
            {/* Highlight border gradient animation behind the card */}
            <span className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-portfolio-purple via-blue-600 to-portfolio-dark opacity-50 animate-gradient-x blur-[30px] -z-10"></span>
            <CardHeader className="p-3 border-b border-portfolio-purple/40 flex justify-between items-center backdrop-blur-md bg-portfolio-dark/40 dark:bg-dark/30 shadow-lg rounded-t-3xl select-none">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-white drop-shadow-lg" />
                <span className="font-semibold text-white tracking-wide drop-shadow-md text-lg select-text">Arjun's AI Twin</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:text-portfolio-purple focus-visible:ring-2 focus-visible:ring-portfolio-purple/60"
                  onClick={toggleMinimize}
                  aria-label={isMinimized ? "Maximize Chatbot" : "Minimize Chatbot"}
                  title={isMinimized ? "Maximize Chatbot" : "Minimize Chatbot"}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:text-portfolio-purple focus-visible:ring-2 focus-visible:ring-portfolio-purple/60"
                  onClick={toggleChat}
                  aria-label="Close Chatbot"
                  title="Close Chatbot"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {!isMinimized && (
              <>
                <CardContent className="p-3 h-72 overflow-y-auto bg-white/10 dark:bg-dark/20 rounded-b-none rounded-t-none scrollbar-thin scrollbar-thumb-portfolio-purple scrollbar-track-transparent transition-all duration-500 animate-fade-in">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center text-white animate-fade-in-up">
                      <Bot className="h-12 w-12 mb-3 text-portfolio-purple opacity-70 animate-float drop-shadow-lg" />
                      <p className="text-base font-medium drop-shadow-md leading-snug select-text">
                        Hi there! I'm Arjun's AI Twin.
                      </p>
                      <p className="text-xs mt-1 text-white/90 max-w-[85%] select-text">
                        Ask me anything about Arjun's skills, projects or experience.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-lg px-4 py-2 text-sm backdrop-blur-sm shadow-lg
                              ${
                                message.role === "user"
                                  ? "bg-gradient-to-br from-portfolio-purple to-blue-600 text-white font-semibold animate-fade-in-up shadow-portfolio-purple/60"
                                  : "bg-white/10 text-white shadow-white/20"
                              }`}
                            style={{
                              border: message.role === "user" ? "1.8px solid #8B5CF6" : "1px solid rgba(255,255,255,0.15)",
                            }}
                          >
                            {message.role === "assistant"
                              ? renderMessageWithLinks(message.content)
                              : message.content}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm bg-white/20 backdrop-blur-sm animate-pulse shadow-inner shadow-portfolio-purple/30">
                            <div className="flex space-x-2 items-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-3 pt-2 border-t border-portfolio-purple/40 flex gap-2 bg-portfolio-dark/40 backdrop-blur-md rounded-b-3xl">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="text-sm bg-white/10 text-white placeholder-white/50 border border-portfolio-purple/50 focus:border-portfolio-purple focus:ring-portfolio-purple shadow-md"
                    disabled={isLoading}
                    aria-label="Chat input"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-br from-portfolio-purple to-blue-600 hover:brightness-110 shadow-lg"
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5 text-white drop-shadow-md" />
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      )}
      <style>
        {`
          @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 #8B5CF670, 0 8px 32px 0 #8B5CF644; }
            70% { box-shadow: 0 0 0 24px #8B5CF600, 0 8px 32px 0 #8B5CF61A; }
            100% { box-shadow: 0 0 0 0 #8B5CF670, 0 8px 32px 0 #8B5CF644; }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 300% 300%;
            animation: gradient-x 6s ease-in-out infinite;
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-scale {
            animation: fade-in 0.3s ease forwards;
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.25s ease forwards;
          }
          .scrollbar-thin {
            scrollbar-width: thin;
          }
          .scrollbar-thumb-portfolio-purple::-webkit-scrollbar-thumb {
            background-color: #8B5CF6;
            border-radius: 9999px;
          }
          .scrollbar-thumb-portfolio-purple {
            background-color: #8B5CF6;
            scrollbar-color: #8B5CF6 transparent;
            border-radius: 9999px;
          }
        `}
      </style>
    </div>
  );
};

export default ChatBot;
