import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  /** Safe metadata — must never contain passwords, tokens, or secrets */
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  {
    // No automatic timestamps — we manage `timestamp` ourselves for clarity
    timestamps: false,
    versionKey: false,
  },
);

// Queries sorted by recency
AuditLogSchema.index({ timestamp: -1 });
// Per-user audit trail
AuditLogSchema.index({ actorUserId: 1, timestamp: -1 });
// Action type filtering
AuditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
