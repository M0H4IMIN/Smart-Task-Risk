import { useState, useRef, useEffect } from "react";

const BASE_URL = "http://localhost:8000";

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm your productivity coach. I know your task history and behavioral patterns. Ask me anything!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Only send role + content, nothing else
      const payload = {
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      };

      const res = await fetch(`${BASE_URL}/api/v1/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Request failed");
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${e.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const SUGGESTIONS = [
    "What should I focus on today?",
    "Why do I keep abandoning tasks?",
    "How do I improve my completion rate?",
    "Give me a plan for my highest risk task",
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <p style={styles.title}>🤖 AI Productivity Coach</p>
            <p style={styles.subtitle}>Powered by your real task data</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              ...styles.bubble,
              ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
            }}>
              {msg.role === "assistant" && (
                <span style={styles.aiLabel}>Coach</span>
              )}
              <p style={styles.bubbleText}>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.aiBubble }}>
              <span style={styles.aiLabel}>Coach</span>
              <p style={styles.typingDots}>● ● ●</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts — only show at start */}
        {messages.length === 1 && (
          <div style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <button key={s} style={styles.suggestion} onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your coach anything... (Enter to send)"
            rows={2}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
            onClick={send}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", zIndex: 200, padding: 24 },
  panel:      { background: "#1e293b", borderRadius: 16, width: 420, height: "80vh", display: "flex", flexDirection: "column", border: "1px solid #334155", overflow: "hidden" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #334155", background: "#0f172a" },
  title:      { color: "#f8fafc", fontWeight: 700, fontSize: 15, margin: 0 },
  subtitle:   { color: "#64748b", fontSize: 11, margin: "2px 0 0" },
  closeBtn:   { background: "transparent", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" },
  messages:   { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 },
  bubble:     { maxWidth: "85%", borderRadius: 12, padding: "10px 14px" },
  aiBubble:   { background: "#0f172a", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  userBubble: { background: "#6366f1", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiLabel:    { color: "#6366f1", fontSize: 10, fontWeight: 700, display: "block", marginBottom: 4 },
  bubbleText: { color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" },
  typingDots: { color: "#6366f1", fontSize: 18, letterSpacing: 4, margin: 0 },
  suggestions:{ padding: "0 20px 12px", display: "flex", flexDirection: "column", gap: 6 },
  suggestion: { background: "#0f172a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer", textAlign: "left" },
  inputRow:   { padding: "12px 20px", borderTop: "1px solid #334155", display: "flex", gap: 10, alignItems: "flex-end" },
  input:      { flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 13, padding: "10px 12px", resize: "none", outline: "none", fontFamily: "inherit" },
  sendBtn:    { padding: "10px 18px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" },
};
