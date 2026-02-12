import express from "express";
import cors from "cors";
import session from "express-session";

import apiRoutes from "./src/routes/api.js";
import { initDb } from "./src/db/schema.js";

initDb();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
