export type RepairStatus =
  | "detected"
  | "analyzing"
  | "testing"
  | "approved"
  | "rejected"
  | "failed";

export interface RepairCandidate {
  id: string;
  selector: string;
  confidence: number;
  recordsFound: number;
  schemaValidity: number;
  completeness: number;
  score: number;
}

export interface Repair {
  id: string;
  scraperId: string;
  runId: string;
  status: RepairStatus;
  failureType: string;
  oldSelector: string;
  newSelector?: string;
  confidence?: number;
  reason?: string;
  createdAt: string;
  completedAt?: string;
}