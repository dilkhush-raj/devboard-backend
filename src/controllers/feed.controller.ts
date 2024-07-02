// @ts-nocheck
import tagModel from "src/models/tag.model.ts";
import {Blog} from "../models/blog.model.ts";
import {Question} from "../models/question.model.ts";
import {asyncHandler} from "../utils/asyncHandler.ts";
import {Request, Response} from "express";

// Interface for query params (consistent with Blog and Question controllers)
interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  author?: string;
}

type SortOrder = 1 | -1;

const getFeed = asyncHandler(
  async (req: Request<{}, {}, QueryParams>, res: Response) => {
    const {page = 1, limit = 10, tag} = req.query;

    let tagQuery = {};
    if (tag) {
      const findTag = await tagModel.findOne({name: tag});
      if (findTag) {
        tagQuery = {tags: {$in: [findTag._id]}};
      } else {
        // If the tag is not found, return an empty result
        return res.json({
          data: [],
          currentPage: parseInt(page, 10),
          totalPages: 0,
          totalItems: 0,
          totalBlogs: 0,
          totalQuestions: 0,
        });
      }
    }

    try {
      let [blogs, questions] = [[], []];
      let totalBlogs = 0,
        totalQuestions = 0;
      const skip = (page - 1) * limit;

      [blogs, questions, totalBlogs, totalQuestions] = await Promise.all([
        Blog.find(tagQuery)
          .sort("-published_at")
          .skip(skip)
          .limit(limit)
          .populate({path: "author", select: "_id fullname username avatar"})
          .populate({path: "tags", select: "-description -createdAt -__v "}),
        Question.find(tagQuery)
          .sort("-created_at")
          .skip(skip)
          .limit(limit)
          .populate({path: "author", select: "_id fullname username avatar"})
          .populate({path: "tags", select: "-description -createdAt -__v"}),
        Blog.countDocuments(tagQuery),
        Question.countDocuments(tagQuery),
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
  }
);

const getBlogFeed = asyncHandler(
  async (req: Request<{}, {}, QueryParams>, res: Response) => {
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
  }
);

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
