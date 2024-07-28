import {Router} from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  deleteBlogById,
  searchBlog,
  getBlogByAuthor,
  getBlogByTag,
  updateBlog,
  getBlogBySlug,
  getBlogByLikes,
  getBlogByDislikes,
} from "../controllers/blog.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

router.route("/create").post(verifyJWT, createBlog);
router.get("/list", getAllBlogs);
router.get("/search", searchBlog);
router.get("/blog/:id", getBlogById);
router.get("/tag/:tag", getBlogByTag);
router.put("/update/:id", updateBlog);
router.get("/author/:author", getBlogByAuthor);
router.delete("/delete/:id", verifyJWT, deleteBlogById);
router.get("/slug/:slug", getBlogBySlug);
router.get("/likes", getBlogByLikes);
router.get("/dislikes", getBlogByDislikes);

export default router;
