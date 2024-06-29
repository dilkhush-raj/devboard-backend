import mongoose, {Schema} from "mongoose";
const answerSchema = new Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    content: {type: String, required: true},
    likes: {type: Number, default: 0},
    dislikes: {type: Number, default: 0},
    comment: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
    created_at: {type: Date, default: Date.now},
  },
  {timestamps: true}
);

export const Answer = mongoose.model("Answer", answerSchema);
