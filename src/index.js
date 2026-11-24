import "../config/env.js";
import express from "express";
import bootstrap from "./app.bootstrap.js";

const app = express();
await bootstrap(app);

if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`server running on port ${port}...`);
  });
}

export default app;
