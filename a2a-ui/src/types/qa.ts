// Schema of generation settings, served by the backend (GET /api/modes) and mirrored
// by a local fallback config. The UI renders the settings screen dynamically from this.

export type ControlType = "single" | "multi";

export interface OptionSchema {
  id: string;
  label: string;
}

export interface ControlSchema {
  id: string;
  label: string;
  type: ControlType;
  defaults: string[];
  options: OptionSchema[];
}

export interface ModeSchema {
  id: string;
  label: string;
  controls: ControlSchema[];
}

// Selections keyed by control id → chosen option ids. Single-selects hold one element.
export type QaSelections = Record<string, string[]>;

export interface QaSettings {
  mode: string;
  selections: QaSelections;
}

// Shape placed into the A2A message metadata: { qa: QaSettings, riskAnalysis }.
// riskAnalysis is opt-in (off by default); when true the orchestrator also runs the analyst agent.
export interface QaMetadata {
  qa: QaSettings;
  riskAnalysis: boolean;
}
