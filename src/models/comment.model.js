import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  data: {type: String, required: true},
  created_at: {type: Date, default: Date.now},
});

export const Comment = mongoose.model("Comment", commentSchema);
