// Feed controller
import {Blog} from "../models/blog.model.js";
import {Question} from "../models/question.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";

/**
 * @typedef {Object} Tag
 * @property {string} _id - The unique identifier of the tag.
 * @property {string} name - The name of the tag.
 */

/**
 * @typedef {Object} Author
 * @property {string} _id - The unique identifier of the author.
 * @property {string} username - The username of the author.
 * @property {string} fullname - The full name of the author.
 * @property {string} avatar - The URL of the author's avatar image.
 */

/**
 * @typedef {Object} Post
 * @property {string} _id - The unique identifier of the post.
 * @property {string} title - The title of the post.
 * @property {string} content - The content of the post.
 * @property {Author} author - The author of the post.
 * @property {Tag[]} tags - An array of tags associated with the post.
 * @property {string} type - The type of the post (e.g., 'question' or 'blog').
 * @property {string} created_at - The creation date of the post in ISO 8601 format.
 * @property {string} slug - The slug (URL-friendly identifier) of the post.
 * @property {number} __v - The version key for the post document.
 * @property {number} [like] - The number of likes (applicable for blog type).
 * @property {number} [dislike] - The number of dislikes (applicable for blog type).
 * @property {Array} [comment] - An array of comments (applicable for blog type).
 */

const getFeed = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, author} = req.query;

  const authorQuery = author ? {author} : {};

  try {
    let [blogs, questions] = [[], []];
    let totalBlogs = 0,
      totalQuestions = 0;
    const skip = (page - 1) * limit;

    [blogs, questions, totalBlogs, totalQuestions] = await Promise.all([
      Blog.find(authorQuery)
        .sort("-published_at")
        .skip(skip)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-description -createdAt -__v "}),
      Question.find(authorQuery)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-description -createdAt -__v"}),
      Blog.countDocuments(authorQuery),
      Question.countDocuments(authorQuery),
    ]);

    /**
     * An array of posts.
     * @type {Post[]}
     */
    const data = [...blogs, ...questions];

    // sort feedData by created_at
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalItems = totalBlogs + totalQuestions;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      currentPage: parseInt(page, 10),
      totalPages,
      totalItems,
      totalBlogs,
      totalQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching feed data");
  }
});

const getBlogFeed = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, author} = req.query;

  const authorQuery = author ? {author} : {};

  try {
    let [blogs] = [[], [], []];
    let totalBlogs = 0;
    const skip = (page - 1) * limit;

    [blogs, totalBlogs] = await Promise.all([
      Blog.find(authorQuery)
        .sort("-published_at")
        .skip(skip)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-description -createdAt -__v "}),
      Blog.countDocuments(authorQuery),
    ]);

    // sort feedData by created_at
    const data = blogs.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      data,
      currentPage: parseInt(page, 10),
      totalPages,
      totalBlogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching feed data");
  }
});

const getQuestionFeed = asyncHandler(async (req, res) => {
  const {page = 1, limit = 10, author} = req.query;

  const authorQuery = author ? {author} : {};

  try {
    let [questions] = [[], [], []];
    let totalQuestions = 0;
    const skip = (page - 1) * limit;

    [questions, totalQuestions] = await Promise.all([
      Question.find(authorQuery)
        .sort("-published_at")
        .skip(skip)
        .limit(limit)
        .populate({path: "author", select: "_id fullname username avatar"})
        .populate({path: "tags", select: "-description -createdAt -__v "}),
      Question.countDocuments(authorQuery),
    ]);

    // sort feedData by created_at
    const data = questions.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const totalPages = Math.ceil(totalQuestions / limit);

    res.json({
      data,
      currentPage: parseInt(page, 10),
      totalPages,
      totalQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching feed data");
  }
});

// search feed
const searchFeed = asyncHandler(async (req, res) => {
  const {page = 1, limit = 5, q} = req.query;

  const regex = new RegExp(`.*${q}.*`, "i");
  const qQuery = q
    ? {
        $or: [{title: regex}],
      }
    : {};

  try {
    let [blogs, questions] = [[], []];
    let totalBlogs = 0,
      totalQuestions = 0;
    const skip = (page - 1) * limit;

    [blogs, questions, totalBlogs, totalQuestions] = await Promise.all([
      Blog.find(qQuery).sort("-published_at").skip(skip).limit(limit),
      Question.find(qQuery).sort("-created_at").skip(skip).limit(limit),
      Blog.countDocuments(qQuery),
      Question.countDocuments(qQuery),
    ]);

    /**
     * An array of posts.
     * @type {Post[]}
     */
    const data = [...blogs, ...questions];

    // sort feedData by created_at
    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalItems = totalBlogs + totalQuestions;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data,
      currentPage: parseInt(page, 5),
      totalPages,
      totalItems,
      totalBlogs,
      totalQuestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching feed data");
  }
});

export {getFeed, getBlogFeed, getQuestionFeed, searchFeed};
