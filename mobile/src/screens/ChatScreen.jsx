import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";

const BASE_URL = "http://192.168.0.103:8000";

const SUGGESTIONS = [
  "What should I focus on today?",
  "Why do I keep abandoning tasks?",
  "How do I improve my completion rate?",
  "Give me a plan for my highest risk task",
];

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm your AI productivity coach. I know your task history and behavioral patterns. Ask me anything!",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef             = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function getToken() {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem("token");
      }
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem("token");
    } catch {
      return null;
    }
  }

  async function send(text) {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const token = await getToken();

      const payload = {
        messages: updated.map(m => ({ role: m.role, content: m.content })),
      };

      const res = await fetch(`${BASE_URL}/api/v1/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
      }]);

    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${e.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>🤖 AI Coach</Text>
          <Text style={styles.subtitle}>Powered by your task data</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[
            styles.bubble,
            msg.role === "user" ? styles.userBubble : styles.aiBubble,
          ]}>
            {msg.role === "assistant" && (
              <Text style={styles.aiLabel}>Coach</Text>
            )}
            <Text style={styles.bubbleText}>{msg.content}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={styles.aiLabel}>Coach</Text>
            <ActivityIndicator size="small" color="#6366f1" />
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {messages.length === 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestions}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your coach anything..."
          placeholderTextColor="#64748b"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: "#0f172a" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  back:             { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  headerCenter:     { alignItems: "center" },
  title:            { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  subtitle:         { color: "#64748b", fontSize: 11 },
  messages:         { flex: 1 },
  messagesContent:  { padding: 16, gap: 12, paddingBottom: 20 },
  bubble:           { maxWidth: "85%", borderRadius: 16, padding: 12, marginBottom: 8 },
  aiBubble:         { backgroundColor: "#1e293b", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  userBubble:       { backgroundColor: "#6366f1", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  aiLabel:          { color: "#6366f1", fontSize: 10, fontWeight: "700", marginBottom: 4 },
  bubbleText:       { color: "#e2e8f0", fontSize: 14, lineHeight: 20 },
  suggestions:      { borderTopWidth: 1, borderTopColor: "#1e293b", maxHeight: 50 },
  suggestionsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  suggestion:       { backgroundColor: "#1e293b", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#334155" },
  suggestionText:   { color: "#94a3b8", fontSize: 12 },
  inputRow:         { flexDirection: "row", padding: 16, gap: 10, alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "#1e293b" },
  input:            { flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 12, color: "#f1f5f9", fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: "#334155" },
  sendBtn:          { backgroundColor: "#6366f1", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  sendBtnDisabled:  { opacity: 0.5 },
  sendBtnText:      { color: "#fff", fontWeight: "700", fontSize: 14 },
});
