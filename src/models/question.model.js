import mongoose from "mongoose";
import slugify from "slugify";
import shortid from "shortid";

const questionSchema = new mongoose.Schema({
  title: {type: String, required: true},
  slug: {type: String, unique: true},
  content: {type: String, required: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  created_at: {type: Date, default: Date.now},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: "Tag"}],
});

questionSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("title")) {
    let baseSlug = slugify(this.title, {lower: true, strict: true});
    let slug = baseSlug;
    let count = 0;

    // Check for existing slugs and ensure uniqueness
    while (await mongoose.models.Question.findOne({slug})) {
      count++;
      slug = `${baseSlug}-${shortid.generate()}`;
    }

    this.slug = slug;
  }
  next();
});

export const Question = mongoose.model("Question", questionSchema);
