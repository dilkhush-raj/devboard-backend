import express from "express";
import morgan from "morgan";
import cors from "cors";

const app = express();

// App Setup
app.use(
  cors({
    origin: [
      "https://dev-board-ten.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  })
);

app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.json({limit: "16kb"}));
app.use(express.static("public"));

app.get("/", (req, res) =>
  res.json({
    message: "DevBoard Backend 🌐",
    request: req.url,
    status: "Running smoothly 🚀",
    timestamp: new Date().toLocaleString(),
    uptime: `${Math.floor(process.uptime() / 60)} minutes ${Math.floor(
      process.uptime() % 60
    )} seconds`,
  })
);

// Routes import
import userRoutes from "./routes/user.routes.js";
import tagRoutes from "./routes/tag.routes.js";

// Routes setup
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tags", tagRoutes);

export {app};
