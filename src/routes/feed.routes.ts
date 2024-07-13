import {Router} from "express";
import {
  getBlogFeed,
  getFeed,
  getQuestionFeed,
  searchFeed,
} from "../controllers/feed.controller";

const router = Router();

router.get("/", getFeed);
router.get("/blog", getBlogFeed);
router.get("/question", getQuestionFeed);
router.get("/search", searchFeed);

export default router;
