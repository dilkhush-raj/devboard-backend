import {Router} from "express";
import {
  loginUser,
  registerUser,
  getUser,
  getUsersList,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/user").get(getUser);
router.route("/list").get(getUsersList);

export default router;
