import {Router} from "express";
import {getLeaderboard} from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/", getLeaderboard);

export default router;
