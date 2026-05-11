import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from "react-native";
import { login, register } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { handleLogin }         = useAuth();
  const [isRegister, setIsReg]  = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({
    email: "", username: "", password: ""
  });

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function submit() {
    if (!form.email || !form.password) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }
    if (isRegister && !form.username) {
      Alert.alert("Missing fields", "Username is required.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({ email: form.email, username: form.username, password: form.password });
      }
      const { access_token } = await login({ email: form.email, password: form.password });
      await handleLogin(access_token);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.title}>Smart Task Risk</Text>
          <Text style={styles.subtitle}>Predict your deadline completion risk</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, !isRegister && styles.tabActive]}
            onPress={() => setIsReg(false)}
          >
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isRegister && styles.tabActive]}
            onPress={() => setIsReg(true)}
          >
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#64748b"
              value={form.username}
              onChangeText={v => update("username", v)}
              autoCapitalize="none"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={form.email}
            onChangeText={v => update("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={form.password}
            onChangeText={v => update("password", v)}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{isRegister ? "Create Account" : "Login"}</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: "#0f172a" },
  container:       { flexGrow: 1, justifyContent: "center", padding: 28 },
  logoArea:        { alignItems: "center", marginBottom: 40 },
  logo:            { fontSize: 48, marginBottom: 12 },
  title:           { color: "#f8fafc", fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle:        { color: "#94a3b8", fontSize: 13, textAlign: "center" },
  tabs:            { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, padding: 4, marginBottom: 24 },
  tab:             { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  tabActive:       { backgroundColor: "#6366f1" },
  tabText:         { color: "#94a3b8", fontWeight: "600", fontSize: 14 },
  tabTextActive:   { color: "#fff" },
  form:            { gap: 14 },
  input:           { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, color: "#f1f5f9", fontSize: 15, borderWidth: 1, borderColor: "#334155" },
  btn:             { backgroundColor: "#6366f1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 4 },
  btnText:         { color: "#fff", fontWeight: "700", fontSize: 16 },
});
