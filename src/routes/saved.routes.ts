import {Router} from "express";
import {
  createSaved,
  getSaved,
  deleteSaved,
} from "../controllers/saved.controller";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

// router.post("/create", createSaved);
router.route("/create").post(verifyJWT, createSaved);
router.route("/list").get(verifyJWT, getSaved);
router.delete("/delete/:id", deleteSaved);

export default router;
