import mongoose, {Schema} from "mongoose";

const blogSchema = new mongoose.Schema({
  slug: {type: String, required: true, unique: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  title: {type: String, required: true},
  published_at: {type: Date, default: Date.now},
  content: {type: String, required: true},
  like: {type: Number, default: 0},
  dislike: {type: Number, default: 0},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: "Tag"}],
  comment: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
});

export const Blog = mongoose.model("Blog", blogSchema);
