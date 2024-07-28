import {Router} from "express";

const router = Router();

// imort controllers
import {
  createQuestion,
  getAllQuestions,
  searchQuestions,
  deleteQuestion,
  updateQuestion,
  getQuestionById,
  getQuestionsByAuthorId,
  getQuestionBySlug,
} from "../controllers/question.controller";
import verifyJWT from "src/middlewares/auth.middleware";

router.route("/create").post(verifyJWT, createQuestion);
router.route("/list").get(getAllQuestions);
router.route("/search").get(searchQuestions);
router.route("/question/:id").get(getQuestionById);
router.route("/delete/:id").delete(deleteQuestion);
router.route("/update/:id").put(updateQuestion);
router.route("/author").get(getQuestionsByAuthorId);
router.route("/slug/:slug").get(getQuestionBySlug);

export default router;
