import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import connectDB from "./DB/connection.js";
import authRouter from "./Modules/Auth/auth.controller.js";
import userRouter from "./Modules/Users/user.Controller.js";
import { globalHandling } from "./Common/Response/response.js";
import { testRedisConnection } from "./DB/redis.connection.js";
import messageRouter from "./Modules/Messages/message.controller.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import geoLite from "geoip-lite";
import { expire, incr } from "./DB/redis.service.js";

async function bootstrap() {
  const app = express();
  const port = process.env.PORT;

  app.set("trust proxy", true);

  app.use(cors());
  app.use(
    express.json(),
    helmet(),
    rateLimit({
      windowMs: 5 * 60 * 1000,
      limit: (req, res) => {
        const geoInf = geoLite.lookup(req.ip);

        return geoInf.country == "EG" ? 5 : 0;
      },
      legacyHeaders: false,
      statusCode: 429,
      message: "Too many requests",
      requestPropertyName: "rateLimit",
      keyGenerator: (req) => {
        const ip = ipKeyGenerator(req.ip);
        return `${ip}:${req.path}`;
      },
      store: {
        incr: async (key, cb) => {
          const hits = await incr(key);
          if (hits == 1) {
            await expire(key, 5 * 60);
          }
          cb(null, hits);
        },
      },
    }),
  );

  await connectDB();
  await testRedisConnection();

  app.use("/uploads", express.static(path.resolve("./uploads")));
  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

  app.use(globalHandling);

  app.listen(port, () => {
    console.log(`server running on port ${port}...`);
  });
}

export default bootstrap;
