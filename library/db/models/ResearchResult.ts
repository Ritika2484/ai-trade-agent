import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IResearchResult extends Document {
  userId: string;
  companyQuery: string;

  profile: {
    canonicalName: string;
    ticker: string | null;
    website: string | null;
  };

  findings: {
    growthSignals: string[];
    riskSignals: string[];
    competitivePosition: string;
    financialHealth: string;
    keyDevelopments: string[];
    sources: string[];
  };

  verdict: {
    verdict: "INVEST" | "PASS";
    confidence: number;
    reasoning: string[];
    keyRisks: string[];
    keyOpportunities: string[];
  };

  sources: Array<{
    title: string;
    url: string;
    content: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const ResearchResultSchema = new Schema<IResearchResult>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    companyQuery: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    profile: {
      canonicalName: { type: String, required: true },
      ticker: { type: String, default: null },
      website: { type: String, default: null },
    },

    findings: {
      growthSignals: [{ type: String }],
      riskSignals: [{ type: String }],
      competitivePosition: { type: String, required: true },
      financialHealth: { type: String, required: true },
      keyDevelopments: [{ type: String }],
      sources: [{ type: String }],
    },

    verdict: {
      verdict: {
        type: String,
        enum: ["INVEST", "PASS"],
        required: true,
      },
      confidence: {
        type: Number,
        required: true,
        min: 20,
        max: 85,
      },
      reasoning: [{ type: String }],
      keyRisks: [{ type: String }],
      keyOpportunities: [{ type: String }],
    },

    sources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

ResearchResultSchema.index({ userId: 1, createdAt: -1 });
ResearchResultSchema.index({ companyQuery: 1, createdAt: -1 });
ResearchResultSchema.index({ userId: 1, companyQuery: 1 });

const ResearchResult: Model<IResearchResult> =
  mongoose.models.ResearchResult ||
  mongoose.model<IResearchResult>("ResearchResult", ResearchResultSchema);

export default ResearchResult;