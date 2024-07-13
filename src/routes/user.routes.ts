import {Router} from "express";
import {
  loginUser,
  registerUser,
  getUser,
  getUsersList,
  logoutUser,
  checkUsernameAvailability,
} from "../controllers/user.controller";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/user").get(getUser);
router.route("/list").get(getUsersList);
router.route("/logout").post(logoutUser);
router.route("/checkUsernameAvailability").get(checkUsernameAvailability);

export default router;
