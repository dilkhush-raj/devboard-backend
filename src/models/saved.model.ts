import mongoose from "mongoose";

const savedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "contentType",
    required: true,
  },
  contentType: {
    type: String,
    required: true,
    enum: ["Blog", "Question", "Answer"],
  },
});

const Saved = mongoose.model("Saved", savedSchema);

export default Saved;
