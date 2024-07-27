import {Router} from "express";
import {
  loginUser,
  registerUser,
  getUser,
  getUsersList,
  logoutUser,
  checkUsernameAvailability,
  updateUser,
} from "../controllers/user.controller";
import verifyJWT from "src/middlewares/auth.middleware";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/user").get(getUser);
router.route("/list").get(getUsersList);
router.route("/logout").post(logoutUser);
router.route("/checkUsernameAvailability").get(checkUsernameAvailability);
router.route("/update").put(verifyJWT, updateUser);

export default router;
