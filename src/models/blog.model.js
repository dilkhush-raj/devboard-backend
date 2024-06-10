import mongoose from "mongoose";
import slugify from "slugify";
import shortid from "shortid";

const blogSchema = new mongoose.Schema({
  slug: {type: String, unique: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  title: {type: String, required: true},
  published_at: {type: Date, default: Date.now},
  content: {type: String, required: true},
  like: {type: Number, default: 0},
  dislike: {type: Number, default: 0},
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: "Tag"}],
  comment: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
});

blogSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("title")) {
    let baseSlug = slugify(this.title, {lower: true, strict: true});
    let slug = baseSlug;
    let count = 0;

    // Check for existing slugs and ensure uniqueness
    while (await mongoose.models.Blog.findOne({slug})) {
      count++;
      slug = `${baseSlug}-${shortid.generate()}`;
    }

    this.slug = slug;
  }
  next();
});

export const Blog = mongoose.model("Blog", blogSchema);
