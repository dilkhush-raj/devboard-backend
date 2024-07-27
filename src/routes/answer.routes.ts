// Answer routes
import {Router} from "express";
import {
  createAnswer,
  getAllAnswers,
  searchAnswers,
  deleteAnswer,
  updateAnswer,
  getAnswerById,
  getAnswerByQuestionId,
  upvoteAnswer,
  downvoteAnswer,
  getAnswerByUserId,
} from "../controllers/answer.controller";
import verifyJWT from "../middlewares/auth.middleware";

const answerRouter = Router();

answerRouter.route("/create/:id").post(verifyJWT, createAnswer);
answerRouter.route("/question/:id").get(getAnswerByQuestionId);
answerRouter.route("/upvote/:id").post(verifyJWT, upvoteAnswer);
answerRouter.route("/downvote/:id").post(verifyJWT, downvoteAnswer);
answerRouter.get("/", getAllAnswers);
answerRouter.get("/search", searchAnswers);
answerRouter.route("/delete/:id").delete(verifyJWT, deleteAnswer);
answerRouter.put("/update/:id", verifyJWT, updateAnswer);
answerRouter.get("/:id", getAnswerById);
answerRouter.route("/user/:id").get(getAnswerByUserId);

export default answerRouter;
