import mongoose, {Document, Schema} from "mongoose";
import slugify from "slugify";
import shortid from "shortid";

// Interface for the Blog document
export interface IBlog extends Document {
  slug: string;
  banner: string;
  author: mongoose.Types.ObjectId;
  title: string;
  created_at: Date;
  content: string;
  like: number;
  dislike: number;
  tags: mongoose.Types.ObjectId[];
  comment: mongoose.Types.ObjectId[];
  type: "blog";
  savedByUser: mongoose.Types.ObjectId[];
}

const blogSchema = new Schema<IBlog>(
  {
    slug: {type: String, unique: true},
    banner: {type: String, default: ""},
    author: {type: Schema.Types.ObjectId, ref: "User", required: true},
    title: {type: String, required: true},
    created_at: {type: Date, default: Date.now},
    content: {type: String, required: true},
    like: {type: Number, default: 0},
    dislike: {type: Number, default: 0},
    tags: [{type: Schema.Types.ObjectId, ref: "Tag"}],
    comment: [{type: Schema.Types.ObjectId, ref: "Comment"}],
    type: {type: String, enum: ["blog"], default: "blog"},
    savedByUser: [{type: Schema.Types.ObjectId, ref: "User"}],
  },
  {timestamps: true}
);

blogSchema.pre<IBlog>("save", async function (next) {
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

export const Blog = mongoose.model<IBlog>("Blog", blogSchema);
