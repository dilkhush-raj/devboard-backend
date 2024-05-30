import {Router} from "express";
import {createTag, getAllTags} from "../controllers/tag.controller.js";

const router = Router();

router.route("/create").post(createTag);
router.route("/list").get(getAllTags);

export default router;
