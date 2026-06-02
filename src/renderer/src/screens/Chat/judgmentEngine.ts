import type { ApprovalRequest } from "./types";

export type JudgmentDecision = "approve" | "deny" | "manual";
export type JudgmentRisk = "low" | "medium" | "high";
export type JudgmentKind = "approval";

export interface JudgmentSettings {
  enabled: boolean;
  model: string;
  confidenceThreshold: number;
  allowAutoDecision: boolean;
}

export interface JudgmentAdvice {
  kind: JudgmentKind;
  decision: JudgmentDecision;
  confidence: number;
  risk: JudgmentRisk;
  reason: string;
  suggestedAction: "auto_approve" | "auto_deny" | "ask_user";
}

export interface ApprovalJudgmentInput {
  request: ApprovalRequest;
  settings: JudgmentSettings;
}

export interface JudgmentEngine {
  judgeApproval(input: ApprovalJudgmentInput): Promise<JudgmentAdvice>;
}

export const DEFAULT_JUDGMENT_SETTINGS: JudgmentSettings = {
  enabled: false,
  model: "",
  confidenceThreshold: 0.85,
  allowAutoDecision: false,
};

export function normalizeJudgmentSettings(value: unknown): JudgmentSettings {
  const input = (
    value && typeof value === "object" ? value : {}
  ) as Partial<JudgmentSettings>;
  const confidenceThreshold = Number.isFinite(input.confidenceThreshold)
    ? Math.max(0, Math.min(1, Number(input.confidenceThreshold)))
    : DEFAULT_JUDGMENT_SETTINGS.confidenceThreshold;

  return {
    enabled: input.enabled === true,
    model:
      typeof input.model === "string"
        ? input.model
        : DEFAULT_JUDGMENT_SETTINGS.model,
    confidenceThreshold,
    allowAutoDecision: input.allowAutoDecision === true,
  };
}

function disabledAdvice(
  reason = "Judgment engine is disabled.",
): JudgmentAdvice {
  return {
    kind: "approval",
    decision: "manual",
    confidence: 0,
    risk: "medium",
    reason,
    suggestedAction: "ask_user",
  };
}

function classifyApprovalRisk(request: ApprovalRequest): JudgmentAdvice {
  const text =
    `${request.command}\n${request.description}\n${request.patternKeys.join(" ")}`.toLowerCase();
  const destructive =
    /\brm\s+-rf\b|\bsudo\b|\bchmod\b|\bchown\b|\bdd\b|--force|destructive|delete|remove/.test(
      text,
    );
  if (destructive) {
    return {
      kind: "approval",
      decision: "deny",
      confidence: 0.9,
      risk: "high",
      reason: "Command appears destructive or privilege-sensitive.",
      suggestedAction: "ask_user",
    };
  }

  // Explicitly safe: reads, queries, non-destructive inspections
  const safe =
    /\bcat\b|\bread_file\b|\bhead\b|\btail\b|\bgrep\b|\bfind\b|\bls\b|\bwc\b|\bfile\b|\bstat\b|\bdu\b|\bwhich\b|\btype\b|\becho\b|\benv\b|\bprintenv\b|\bgit\s+(status|log|diff|branch|show|remote|tag|stash\s+list)|\bcurl\s+-(?:head|I)\b|\bpython3?\s+-c\s+["']import\s+ast/.test(text);
  if (safe) {
    return {
      kind: "approval",
      decision: "approve",
      confidence: 0.92,
      risk: "low",
      reason: "Read-only or inspection command, no side effects.",
      suggestedAction: "auto_approve",
    };
  }

  const testLike =
    /\btest\b|typecheck|lint|vitest|tsc --noemit|cargo test|pytest|npm\s+(test|run\s+test)|pnpm\s+(test|run\s+test)|yarn\s+test/.test(text);
  if (testLike) {
    return {
      kind: "approval",
      decision: "approve",
      confidence: 0.88,
      risk: "low",
      reason: "Command looks like a local test or validation command.",
      suggestedAction: "auto_approve",
    };
  }

  // Build / install commands: medium risk (may change fs but usually safe)
  const buildLike =
    /\bnpm\s+install\b|\bpnpm\s+install\b|\byarn\s+install\b|\bpip\s+install\b|\bcargo\s+build\b|\bmake\b|\bnpm\s+run\s+build\b|\bpnpm\s+run\s+build\b|\btsc\b/.test(text);
  if (buildLike) {
    return {
      kind: "approval",
      decision: "approve",
      confidence: 0.75,
      risk: "medium",
      reason: "Build or install command, low risk but modifies node_modules or target.",
      suggestedAction: "auto_approve",
    };
  }

  // Git operations: medium risk (safe ops already matched above)
  const gitOps =
    /\bgit\s+(add|commit|push|pull|checkout|merge|rebase|fetch|stash)/.test(text);
  if (gitOps) {
    return {
      kind: "approval",
      decision: "approve",
      confidence: 0.78,
      risk: "medium",
      reason: "Git version control operation.",
      suggestedAction: "auto_approve",
    };
  }

  return {
    kind: "approval",
    decision: "manual",
    confidence: 0.55,
    risk: "medium",
    reason: "No strong local rule matched; ask the user.",
    suggestedAction: "ask_user",
  };
}

export function createRuleBasedJudgmentEngine(): JudgmentEngine {
  return {
    async judgeApproval({
      request,
      settings,
    }: ApprovalJudgmentInput): Promise<JudgmentAdvice> {
      const normalized = normalizeJudgmentSettings(settings);
      if (!normalized.enabled) return disabledAdvice();
      const advice = classifyApprovalRisk(request);
      if (advice.confidence < normalized.confidenceThreshold) {
        return {
          ...advice,
          decision: "manual",
          suggestedAction: "ask_user",
          reason: `${advice.reason} Confidence is below the configured threshold.`,
        };
      }
      if (!normalized.allowAutoDecision) {
        return {
          ...advice,
          suggestedAction: "ask_user",
        };
      }
      return {
        ...advice,
        suggestedAction:
          advice.decision === "approve"
            ? "auto_approve"
            : advice.decision === "deny"
              ? "auto_deny"
              : "ask_user",
      };
    },
  };
}
