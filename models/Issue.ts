import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  book: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  issuedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  status: "active" | "returned";
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    status: { type: String, enum: ["active", "returned"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);
