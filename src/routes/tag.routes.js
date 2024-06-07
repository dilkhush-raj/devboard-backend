import {Router} from "express";
import {
  createTag,
  getAllTags,
  searchTags,
  getTagById,
  deleteTag,
  updateTag,
} from "../controllers/tag.controller.js";

const router = Router();

router.route("/create").post(createTag);
router.route("/list").get(getAllTags);
router.route("/search").get(searchTags);
router.route("/tag/:id").get(getTagById);
router.route("/delete/:id").delete(deleteTag);
router.route("/update/:id").put(updateTag);

export default router;
