import { randomBytes } from "node:crypto";
import Database from "../Database/Database.mjs";

const db = Database.getInstance();

const parseCookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie || "").split(";").map((c) => {
      const i = c.trim().indexOf("=");
      return [c.trim().slice(0, i), c.trim().slice(i + 1)];
    })
  );

const buildTokenCookie = (token) =>
  `token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=3600`;

// generates a random session token, stores it in the Session table, sets it as an httpOnly cookie
export const issueToken = async (res, user, role) => {
  const token = randomBytes(32).toString("hex"); // 64-char hex string — opaque to the client
  await db.query(
    "INSERT INTO Session (token, userId, role, userEmail, restaurantName) VALUES (?, ?, ?, ?, ?)",
    [token, user.userId, role, user.email ?? null, user.restaurantName ?? null]
  );
  res.setHeader("Set-Cookie", buildTokenCookie(token));
};

// reads the session token from the request cookie, looks it up in the DB, and returns the session row
export const verifyToken = async (req) => {
  const { token } = parseCookies(req);
  if (!token) throw new Error("No token found");
  const [rows] = await db.query("SELECT * FROM Session WHERE token = ?", [token]);
  if (!rows.length) throw new Error("Invalid or expired session");
  return rows[0];
};

// deletes the session from the DB — called on logout to invalidate the token server-side
export const revokeToken = async (req) => {
  const { token } = parseCookies(req);
  if (token) await db.query("DELETE FROM Session WHERE token = ?", [token]);
};
