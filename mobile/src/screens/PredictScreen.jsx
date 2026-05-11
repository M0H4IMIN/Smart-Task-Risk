import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { getPrediction } from "../api/client";

const RISK_COLORS = {
  Low:      "#22c55e",
  Medium:   "#f97316",
  High:     "#ef4444",
  Critical: "#dc2626",
  None:     "#64748b",
};

const RISK_BG = {
  Low:      "#14532d",
  Medium:   "#431407",
  High:     "#3b1111",
  Critical: "#2d0a0a",
  None:     "#1e293b",
};

export default function PredictScreen({ route, navigation }) {
  const { taskId }              = route.params;
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getPrediction(taskId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.loadingText}>Analyzing your task...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>⚠ {error}</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!data) return null;

  const riskColor = RISK_COLORS[data.risk_label] || RISK_COLORS.None;
  const riskBg    = RISK_BG[data.risk_label]    || RISK_BG.None;

  // Draw a simple arc-style risk meter using blocks
  const filled = Math.round((data.risk_score_percent || 0) / 10);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Task name */}
      <Text style={styles.taskName}>{data.task_title}</Text>

      {/* Risk score hero */}
      <View style={[styles.heroCard, { backgroundColor: riskBg, borderColor: riskColor }]}>
        <Text style={[styles.riskScore, { color: riskColor }]}>
          {data.risk_score_percent}%
        </Text>
        <Text style={[styles.riskLabel, { color: riskColor }]}>
          {data.risk_label} Risk
        </Text>

        {/* Simple block meter */}
        <View style={styles.meter}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.meterBlock,
                {
                  backgroundColor: i < filled ? riskColor : "#1e293b",
                  opacity: i < filled ? 1 : 0.3,
                }
              ]}
            />
          ))}
        </View>

        <Text style={styles.quote}>"{data.motivational_quote}"</Text>
      </View>

      {/* Warnings */}
      {data.warnings?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠ Warnings</Text>
          {data.warnings.map((w, i) => (
            <View key={i} style={styles.warningRow}>
              <Text style={styles.warningDot}>●</Text>
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action plan */}
      {data.action_plan?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Action Plan</Text>
          {data.action_plan.map(step => (
            <View key={step.step} style={styles.stepCard}>
              <View style={styles.stepNumWrap}>
                <Text style={styles.stepNum}>{step.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepAction}>{step.action}</Text>
                <Text style={styles.stepReason}>{step.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Features used */}
      {data.features_used && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data Used</Text>
          <View style={styles.featuresGrid}>
            {Object.entries(data.features_used).map(([key, val]) => (
              <View key={key} style={styles.featureItem}>
                <Text style={styles.featureVal}>{typeof val === "number" ? val.toFixed(2) : val}</Text>
                <Text style={styles.featureKey}>{key.replace(/_/g, " ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#0f172a" },
  center:       { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText:  { color: "#94a3b8", fontSize: 14, marginTop: 12 },
  errorText:    { color: "#f87171", fontSize: 14, textAlign: "center", padding: 20 },
  backBtn:      { backgroundColor: "#6366f1", padding: 12, borderRadius: 10 },
  backBtnText:  { color: "#fff", fontWeight: "600" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56 },
  back:         { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  headerTitle:  { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  taskName:     { color: "#94a3b8", fontSize: 14, paddingHorizontal: 20, marginBottom: 16, fontStyle: "italic" },
  heroCard:     { marginHorizontal: 20, borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, marginBottom: 20 },
  riskScore:    { fontSize: 64, fontWeight: "800", lineHeight: 72 },
  riskLabel:    { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  meter:        { flexDirection: "row", gap: 6, marginBottom: 20 },
  meterBlock:   { width: 22, height: 10, borderRadius: 5 },
  quote:        { color: "#94a3b8", fontSize: 13, fontStyle: "italic", textAlign: "center", lineHeight: 20 },
  section:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: "#1e293b", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155" },
  sectionTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "700", marginBottom: 14 },
  warningRow:   { flexDirection: "row", gap: 10, marginBottom: 8, alignItems: "flex-start" },
  warningDot:   { color: "#fbbf24", fontSize: 10, marginTop: 4 },
  warningText:  { color: "#fbbf24", fontSize: 13, flex: 1, lineHeight: 18 },
  stepCard:     { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  stepNumWrap:  { width: 26, height: 26, borderRadius: 13, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  stepNum:      { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepContent:  { flex: 1 },
  stepAction:   { color: "#e2e8f0", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  stepReason:   { color: "#64748b", fontSize: 12, lineHeight: 18 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  featureItem:  { width: "47%", backgroundColor: "#0f172a", borderRadius: 10, padding: 10 },
  featureVal:   { color: "#6366f1", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  featureKey:   { color: "#64748b", fontSize: 11 },
});
