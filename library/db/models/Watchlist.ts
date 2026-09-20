import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IWatchlist extends Document {
  userId: string;
  /** Lowercase trimmed canonical company name — used for duplicate detection */
  companyName: string;
  /** Human-readable display name */
  displayName: string;
  ticker: string | null;
  notes: string;
  targetPrice: number | null;
  /** ISO 4217 currency code, e.g. "USD" */
  currency: string;
  /** Future: enable price alert */
  alertEnabled: boolean;
  /** Future: whether alert has fired */
  alertTriggered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  {
    userId: { type: String, required: true },
    companyName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    displayName: { type: String, required: true, trim: true },
    ticker: { type: String, default: null, uppercase: true },
    notes: { type: String, default: "", maxlength: 1000 },
    targetPrice: {
      type: Number,
      default: null,
      min: [0, "Target price must be a positive number."],
    },
    currency: { type: String, default: "USD", uppercase: true, maxlength: 3 },
    alertEnabled: { type: Boolean, default: false },
    alertTriggered: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Prevent duplicate companies per user
WatchlistSchema.index({ userId: 1, companyName: 1 }, { unique: true });
// Sort by most recently added
WatchlistSchema.index({ userId: 1, createdAt: -1 });

const Watchlist: Model<IWatchlist> =
  mongoose.models.Watchlist ||
  mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);

export default Watchlist;
