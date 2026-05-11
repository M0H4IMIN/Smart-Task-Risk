import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { createTask } from "../api/client";

const CATEGORIES = ["coding", "studying", "editing", "writing", "design", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];

const PRIORITY_COLORS = {
  low: "#3b82f6", medium: "#22c55e", high: "#f97316", critical: "#ef4444",
};

export default function CreateTaskScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "",
    category: "other", priority: "medium",
    estimated_hours: "", deadline: "",
  });

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function submit() {
    if (!form.title.trim()) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }

    const data = { ...form };
    if (data.estimated_hours) data.estimated_hours = parseFloat(data.estimated_hours);
    else delete data.estimated_hours;
    if (!data.description) delete data.description;
    if (!data.deadline) delete data.deadline;

    setLoading(true);
    try {
      await createTask(data);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.form}>

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you need to do?"
            placeholderTextColor="#64748b"
            value={form.title}
            onChangeText={v => update("title", v)}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional details..."
            placeholderTextColor="#64748b"
            value={form.description}
            onChangeText={v => update("description", v)}
            multiline
            numberOfLines={3}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.category === c && styles.chipActive]}
                onPress={() => update("category", c)}
              >
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  form.priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }
                ]}
                onPress={() => update("priority", p)}
              >
                <Text style={[styles.chipText, form.priority === p && styles.chipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estimated hours */}
          <Text style={styles.label}>Estimated Hours</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3"
            placeholderTextColor="#64748b"
            value={form.estimated_hours}
            onChangeText={v => update("estimated_hours", v)}
            keyboardType="decimal-pad"
          />

          {/* Deadline */}
          <Text style={styles.label}>Deadline (YYYY-MM-DDTHH:MM:SS)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-05-01T23:59:00"
            placeholderTextColor="#64748b"
            value={form.deadline}
            onChangeText={v => update("deadline", v)}
          />

          {/* Submit */}
          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Task</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: "#0f172a" },
  container:       { flex: 1, backgroundColor: "#0f172a" },
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 },
  backBtn:         { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  headerTitle:     { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  form:            { padding: 20, gap: 12 },
  label:           { color: "#94a3b8", fontSize: 12, fontWeight: "600", marginBottom: -4 },
  input:           { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, color: "#f1f5f9", fontSize: 15, borderWidth: 1, borderColor: "#334155" },
  textArea:        { height: 80, textAlignVertical: "top" },
  chipRow:         { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:            { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1e293b", borderRadius: 20, borderWidth: 1, borderColor: "#334155" },
  chipActive:      { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  chipText:        { color: "#94a3b8", fontSize: 13, fontWeight: "500" },
  chipTextActive:  { color: "#fff" },
  btn:             { backgroundColor: "#6366f1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  btnText:         { color: "#fff", fontWeight: "700", fontSize: 16 },
});
