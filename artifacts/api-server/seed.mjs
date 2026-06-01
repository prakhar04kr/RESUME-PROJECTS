import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, 'package.json'));
const bcrypt = require('bcrypt');
const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adminHash = await bcrypt.hash("Admin1234!", 12);
const demoHash = await bcrypt.hash("Password1!", 12);
await pool.query(`INSERT INTO users (email, password_hash, username, role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING`, ["admin@typeracer.com", adminHash, "admin", "admin"]);
await pool.query(`INSERT INTO users (email, password_hash, username, role) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING`, ["demo@typeracer.com", demoHash, "speedracer", "user"]);
console.log("Users seeded!");
await pool.end();
