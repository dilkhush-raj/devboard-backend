import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  created_at: {type: Date, default: Date.now},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: "Tag"}],
});

export const Question = mongoose.model("Question", questionSchema);
