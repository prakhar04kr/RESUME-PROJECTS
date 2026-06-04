import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok", database: "mysql" });
});

function parseField(value) {
  if (value === null || typeof value === "undefined") return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const v = value.trim();
    if (!v) return [];

    try {
      const parsed = JSON.parse(v);

      // keep behavior: if DB stores JSON array, return array; else wrap into array
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];

      // primitives
      return [parsed];
    } catch {
      // fallback for weirdly escaped strings
      return [value];
    }
  }

  // object/number/bool/etc.
  return [value];
}

function parseSchemeJsonFields(scheme) {
  if (!scheme) return scheme;
  scheme.age_groups = parseField(scheme.age_groups);
  scheme.sectors = parseField(scheme.sectors);
  scheme.categories = parseField(scheme.categories);
  scheme.eligibility = parseField(scheme.eligibility);
  scheme.documents = parseField(scheme.documents);
  scheme.tags = parseField(scheme.tags);
  scheme.terms_and_conditions = parseField(scheme.terms_and_conditions);
  return scheme;
}

app.get("/api/schemes/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM schemes WHERE id = ? LIMIT 1",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Scheme not found" });
    }

    const scheme = rows[0];

    // debug logs to confirm actual DB values
    console.log("RAW ELIGIBILITY =", scheme.eligibility);
    console.log("RAW DOCUMENTS =", scheme.documents);
    console.log("RAW TERMS =", scheme.terms_and_conditions);

    return res.json(parseSchemeJsonFields({ ...scheme }));
  } catch (err) {
    console.error("SchemeDetail Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
      stack: err?.stack,
    });
  }
});

app.get("/api/debug/parse/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT eligibility, documents, terms_and_conditions FROM schemes WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "not found" });

    const r = rows[0];
    return res.json({
      raw: r,
      parsed: {
        eligibility: parseField(r.eligibility),
        documents: parseField(r.documents),
        terms_and_conditions: parseField(r.terms_and_conditions),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message ?? "error" });
  }
});

app.get("/api/schemes", async (req, res) => {
  try {
    const { ageGroup, sector, incomeLimit, isState, search } = req.query;

    const whereParts = [];
    const params = [];

    if (typeof isState !== "undefined") {
      const v = String(isState);
      whereParts.push("is_state = ?");
      params.push(v === "true" || v === "1" ? 1 : 0);
    }

    if (ageGroup) {
      whereParts.push("JSON_CONTAINS(age_groups, JSON_QUOTE(?))");
      params.push(String(ageGroup));
    }

    if (sector) {
      whereParts.push("JSON_CONTAINS(sectors, JSON_QUOTE(?))");
      params.push(String(sector));
    }

    if (incomeLimit) {
      const n = Number(incomeLimit);
      if (!Number.isNaN(n)) {
        whereParts.push("income_limit <= ?");
        params.push(n);
      }
    }

    if (search) {
      whereParts.push(
        "(name LIKE ? OR name_hindi LIKE ? OR ministry LIKE ? OR tags LIKE ?)"
      );
      const s = `%${String(search)}%`;
      params.push(s, s, s, s);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT * FROM schemes ${whereSql} ORDER BY popularity_score DESC`,
      params
    );

    return res.json(rows.map((r) => parseSchemeJsonFields({ ...r })));
  } catch (err) {
    console.error("Schemes Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
      stack: err?.stack,
    });
  }
});

app.get("/api/sectors", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM sectors ORDER BY name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("Sectors Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
      stack: err?.stack,
    });
  }
});

app.get("/api/schemes/popular", async (req, res) => {
  try {
    const { limit, ageGroup } = req.query;
    const lim = Math.max(1, Math.min(Number(limit) || 6, 50));

    const whereParts = [];
    const params = [];

    if (ageGroup) {
      whereParts.push("JSON_CONTAINS(age_groups, JSON_QUOTE(?))");
      params.push(String(ageGroup));
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT * FROM schemes ${whereSql} ORDER BY popularity_score DESC LIMIT ?`,
      [...params, lim]
    );

    return res.json(rows.map((r) => parseSchemeJsonFields({ ...r })));
  } catch (err) {
    console.error("Popular Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
      stack: err?.stack,
    });
  }
});

app.get("/api/schemes/stats", async (req, res) => {
  try {
    const [[tot]] = await pool.query(
      "SELECT COUNT(*) AS total FROM schemes"
    );

    const [[central]] = await pool.query(
      "SELECT COUNT(*) AS centralSchemes FROM schemes WHERE is_state = 0"
    );

    const [[state]] = await pool.query(
      "SELECT COUNT(*) AS stateSchemes FROM schemes WHERE is_state = 1"
    );

    return res.json({
      total: tot.total,
      centralSchemes: central.centralSchemes,
      stateSchemes: state.stateSchemes,
    });
  } catch (err) {
    console.error("Stats Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
      stack: err?.stack,
    });
  }
});

app.get("/api/schemes/:id/related", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM schemes
       WHERE id != ?
       ORDER BY popularity_score DESC
       LIMIT 6`,
      [req.params.id]
    );

    return res.json(rows.map((r) => parseSchemeJsonFields({ ...r })));
  } catch (err) {
    console.error("Related Schemes Error:", err);
    return res.status(500).json({
      message: err?.message ?? "Internal Server Error",
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});

