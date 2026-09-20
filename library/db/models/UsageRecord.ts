import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IUsageRecord extends Document {
  userId: string;
  /** "YYYY-MM-DD" for daily partitioning */
  date: string;
  /** "YYYY-MM" for monthly partitioning */
  month: string;
  aiCallsToday: number;
  aiCallsThisMonth: number;
  lastRequestAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    month: { type: String, required: true },
    aiCallsToday: { type: Number, default: 0, min: 0 },
    aiCallsThisMonth: { type: Number, default: 0, min: 0 },
    lastRequestAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, versionKey: false },
);

// Unique daily record per user
UsageRecordSchema.index({ userId: 1, date: 1 }, { unique: true });
// Monthly aggregation queries
UsageRecordSchema.index({ userId: 1, month: 1 });

const UsageRecord: Model<IUsageRecord> =
  mongoose.models.UsageRecord ||
  mongoose.model<IUsageRecord>("UsageRecord", UsageRecordSchema);

export default UsageRecord;
