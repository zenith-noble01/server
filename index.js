import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import dotenv from "dotenv";
import userRoute from "./routes/userRoute.js";
import postRoute from "./routes/postRoute.js";
import testRoute from "./routes/testRoute.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

connectDb();

app.use("/api/user", userRoute);
app.use("/api/post", postRoute);
app.use("/test", testRoute);

app.listen(5000, () => {
  console.log(`server is runntion on `);
});
