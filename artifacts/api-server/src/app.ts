import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// Serve uploaded library files. Files are stored with UUID filenames so the
// URLs are unguessable; only authenticated users can list items (get URLs).
const uploadsDir = path.resolve(process.cwd(), "uploads/library");
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
app.use("/uploads", express.static(uploadsDir, { maxAge: "7d" }));

app.use("/api", router);

export default app;
