import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookiePraser from "cookie-parser";

const app = express();

// App Setup
app.use(
  cors({
    origin: [
      "https://dev-board.tech",
      "https://www.dev-board.tech/",
      "http://dev-board.tech",
      "https://devboard-frontend.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.json({limit: "16kb"}));
app.use(express.static("public"));
app.use(cookiePraser());

app.get("/", (req, res) =>
  res.json({
    message: "/",
    request: req.url,
    status: "Running smoothly 🚀",
    timestamp: new Date().toLocaleString(),
    uptime: `${Math.floor(process.uptime() / 60)} minutes ${Math.floor(
      process.uptime() % 60
    )} seconds`,
  })
);

// Routes import
import userRoutes from "./routes/user.routes";
import tagRoutes from "./routes/tag.routes";
import questionRoutes from "./routes/question.routes";
import blogRoutes from "./routes/blog.routes";
import feedRoutes from "./routes/feed.routes";
import leaderboardRoutes from "./routes/leaderbaord.routes";
import savedRoutes from "./routes/saved.routes";
import answerRoute from "./routes/answer.routes";

// Routes setup
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tags", tagRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/feed", feedRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/saved", savedRoutes);
app.use("/api/v1/answers", answerRoute);

export {app};
