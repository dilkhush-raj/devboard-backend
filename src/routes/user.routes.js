import {Router} from "express";
import {
  loginUser,
  registerUser,
  getUser,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/user").get(getUser);

export default router;
