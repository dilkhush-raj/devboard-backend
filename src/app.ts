import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookiePraser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";

const app = express();

const file = fs.readFileSync(
  path.resolve(__dirname, "../swagger.yaml"),
  "utf8"
);
const swaggerDocument = YAML.parse(file);

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

// Routes import
import userRoutes from "./routes/user.routes";
import tagRoutes from "./routes/tag.routes";
import questionRoutes from "./routes/question.routes";
import blogRoutes from "./routes/blog.routes";
import feedRoutes from "./routes/feed.routes";
import leaderboardRoutes from "./routes/leaderbaord.routes";
import savedRoutes from "./routes/saved.routes";
import answerRoute from "./routes/answer.routes";
import verifyRoute from "./routes/verify.routes";

// Routes setup
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tags", tagRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/feed", feedRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/saved", savedRoutes);
app.use("/api/v1/answers", answerRoute);
app.use("/api/v1/verify", verifyRoute);

app.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      docExpansion: "none",
    },
    customSiteTitle: "DevBoard API docs",
  })
);

export {app};
