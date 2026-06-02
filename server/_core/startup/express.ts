import express, { type Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { SITE_URL_PRODUCTION } from "@shared/const";

export function createApp(): { app: Express; server: Server } {
  const app = express();
  const server = createServer(app);

  // Trust proxy - CRITICAL for cookies to work behind reverse proxy (nginx, etc.)
  app.set("trust proxy", 1);

  // CORS configuration - MUST be before OAuth and session middleware
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? SITE_URL_PRODUCTION
          : "http://localhost:5173", // Vite's default dev server port
      credentials: true, // Allow cookies to be sent and received
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve uploads folder for local storage
  app.use("/uploads", express.static("uploads"));

  return { app, server };
}