import { getPluginMetrics } from "@renderer/lib/hermes-tauri";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Database, Brain, Shield, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────── */

interface MetricCounter {
  name: string;
  label: string;
  value: number;
}

interface MetricGauge {
  name: string;
  label: string;
  value: number;
}

interface MetricDistribution {
  name: string;
  label: string;
  entries: { key: string; count: number }[];
}

interface PluginMetricData {
  plugin: string;
  error?: string;
  counters?: MetricCounter[];
  gauges?: MetricGauge[];
  distributions?: MetricDistribution[];
  snapshot?: Record<string, unknown>;
}

/* ── Shared components ─────────────────────────────────────────── */

function MiniBar({ value, max, color = "#6366f1" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 4, borderRadius: 2, background: "var(--bg-tertiary, #2a2a2e)", flex: 1 }}>
      <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}

function MetricRow({ label, value, unit, bar, barMax, barColor }: {
  label: string; value: number | string; unit?: string;
  bar?: boolean; barMax?: number; barColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <span style={{ flex: "0 0 120px", fontSize: 12, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {bar && <MiniBar value={typeof value === "number" ? value : 0} max={barMax || 100} color={barColor} />}
      <span style={{ flex: "0 0 48px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{value}{unit || ""}</span>
    </div>
  );
}

function DistBar({ entries, color }: { entries: { key: string; count: number }[]; color?: string }) {
  const total = entries.reduce((s, e) => s + e.count, 0) || 1;
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--bg-tertiary, #2a2a2e)" }}>
      {entries.map((e) => (
        <div key={e.key} title={`${e.key}: ${e.count}`} style={{ width: `${(e.count / total) * 100}%`, background: color || "#6366f1", opacity: 0.8, transition: "width 0.3s" }} />
      ))}
    </div>
  );
}

/* ── Plugin-specific cards ─────────────────────────────────────── */

function TideMemoryCard({ data }: { data: PluginMetricData }) {
  const counters = data.counters || [];
  const gauges = data.gauges || [];
  const dists = data.distributions || [];

  const counterMap = Object.fromEntries(counters.map((c) => [c.name, c]));
  const gaugeMap = Object.fromEntries(gauges.map((g) => [g.name, g]));

  const totalEntries = counterMap.total_entries?.value ?? 0;
  const totalChars = gaugeMap.total_chars?.value ?? 0;
  const charLimit = 10000;
  const factsTotal = counterMap.facts_total?.value ?? 0;
  const l1Ratio = gaugeMap.l1_ratio_pct?.value ?? 0;
  const orphanRatio = gaugeMap.orphan_ratio_pct?.value ?? 0;
  const avgTrust = gaugeMap.avg_trust_pct?.value ?? 0;
  const zeroExposure = gaugeMap.exposure_zero_pct?.value ?? 0;

  const tierDist = dists.find((d) => d.name === "by_tier");
  const categoryDist = dists.find((d) => d.name === "fact_by_category");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* Left: capacity */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Capacity</div>
        <MetricRow label="Hot Entries" value={totalEntries} />
        <MetricRow label="Hot Chars" value={`${totalChars}`} bar barMax={charLimit} barColor={totalChars > charLimit * 0.8 ? "#f59e0b" : "#6366f1"} />
        <MetricRow label="Fact Store" value={factsTotal} />
        <MetricRow label="L1 Ratio" value={l1Ratio} unit="%" bar barMax={100} barColor="#22c55e" />
        <MetricRow label="Orphan Ratio" value={orphanRatio} unit="%" bar barMax={100} barColor={orphanRatio > 50 ? "#ef4444" : "#f59e0b"} />
        <MetricRow label="Avg Trust" value={avgTrust} unit="%" bar barMax={100} barColor={avgTrust < 30 ? "#f59e0b" : "#22c55e"} />
        <MetricRow label="Zero Exposure" value={zeroExposure} unit="%" bar barMax={100} barColor="#6366f1" />
      </div>

      {/* Right: distributions */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Distribution</div>
        {tierDist && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>By Tier</div>
            <DistBar entries={tierDist.entries} color="#6366f1" />
            <div style={{ display: "flex", gap: 8, fontSize: 11, opacity: 0.6 }}>
              {tierDist.entries.map((e) => <span key={e.key}>{e.key}: {e.count}</span>)}
            </div>
          </div>
        )}
        {categoryDist && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>By Category</div>
            <DistBar entries={categoryDist.entries} color="#8b5cf6" />
            <div style={{ display: "flex", gap: 8, fontSize: 11, opacity: 0.6, flexWrap: "wrap" }}>
              {categoryDist.entries.map((e) => <span key={e.key}>{e.key}: {e.count}</span>)}
            </div>
          </div>
        )}
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Corrections: {counterMap.signal_corrections?.value ?? 0} · Low-value: {counterMap.signal_lowvalue?.value ?? 0} · Metabolism: {counterMap.signal_metabolism?.value ?? 0}
        </div>
      </div>
    </div>
  );
}

function GenericPluginCard({ data }: { data: PluginMetricData }) {
  const counters = data.counters || [];
  const gauges = data.gauges || [];
  return (
    <div>
      {counters.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Counters</div>
          {counters.slice(0, 8).map((c) => <MetricRow key={c.name} label={c.label} value={c.value} />)}
          {counters.length > 8 && <div style={{ fontSize: 11, opacity: 0.5 }}>+{counters.length - 8} more</div>}
        </div>
      )}
      {gauges.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Gauges</div>
          {gauges.slice(0, 6).map((g) => <MetricRow key={g.name} label={g.label} value={g.value} bar barMax={100} />)}
        </div>
      )}
      {!counters.length && !gauges.length && <div style={{ fontSize: 12, opacity: 0.5 }}>No metrics available</div>}
    </div>
  );
}

/* ── Main panel ────────────────────────────────────────────────── */

const PLUGIN_ICONS: Record<string, LucideIcon> = {
  "hermes-tide-memory": Database,
  "hermes-task-tree": Activity,
  "hermes-cognitive-guardrails": Shield,
  "hermes-self-governance": Brain,
};

const PLUGIN_FRIENDLY: Record<string, string> = {
  "hermes-tide-memory": "Memory",
  "hermes-task-tree": "Task Tree",
  "hermes-cognitive-guardrails": "Guardrails",
  "hermes-self-governance": "Self-Gov",
  "hermes-hce": "HCE",
  "hermes-enhanced-session-search": "Session Search",
  "hermes-enhanced-council": "Council",
};

export default function PluginMetricsPanel({ profile }: { profile?: string }) {
  const [metrics, setMetrics] = useState<PluginMetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getPluginMetrics(undefined, profile);
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (error && !metrics.length) return null;

  const activeMetrics = metrics.filter((m) => !m.error);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Activity size={14} style={{ opacity: 0.6 }} />
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7 }}>Plugin Metrics</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: "auto", padding: "2px 6px" }}
        >
          <RefreshCw size={12} />
        </button>
      </div>
      {loading && !metrics.length && <div style={{ fontSize: 12, opacity: 0.4 }}>Loading metrics…</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {activeMetrics.map((m) => {
          const Icon = PLUGIN_ICONS[m.plugin] || Activity;
          const friendly = PLUGIN_FRIENDLY[m.plugin] || m.plugin.replace("hermes-", "");
          return (
            <div key={m.plugin} style={{ background: "var(--bg-secondary, #1e1e22)", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Icon size={13} style={{ opacity: 0.6 }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{friendly}</span>
                <span style={{ fontSize: 10, opacity: 0.3, marginLeft: "auto" }}>{m.plugin}</span>
              </div>
              {m.plugin === "hermes-tide-memory"
                ? <TideMemoryCard data={m} />
                : <GenericPluginCard data={m} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
