import {Router} from "express";
import {
  loginUser,
  registerUser,
  getUser,
  getUsersList,
  logoutUser,
  checkUsernameAvailability,
  updateUser,
  uploadProfileImage,
} from "../controllers/user.controller";
import {createUser} from "../controllers/user/createUser";
import verifyJWT from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";

const router = Router();

router.route("/register").post(registerUser);
router.route("/signup").post(createUser);
router.route("/login").post(loginUser);
router.route("/user").get(getUser);
router.route("/list").get(getUsersList);
router.route("/logout").post(logoutUser);
router.route("/checkUsernameAvailability").get(checkUsernameAvailability);
router.route("/update").put(verifyJWT, updateUser);
router
  .route("/uploadAvatar")
  .post(
    upload.fields([{name: "avatar", maxCount: 1}]),
    verifyJWT,
    uploadProfileImage
  );

// router
//   .route("/Create-Blog")
//   .post(upload.fields([{ name: "image", maxCount: 1 }]), jwtVerify, createBlog);

export default router;
