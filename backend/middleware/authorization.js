const crypto = require("node:crypto");

const secret = process.env.JWT_SECRET || "learnhub-local-development-secret-change-me";

function createAccessToken(user) {
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function authenticate(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Please sign in to continue" });
  }

  try {
    const [payload, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      throw new Error("Invalid token signature");
    }

    const user = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!user.email || !["student", "admin"].includes(user.role) || user.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token");
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Your session has expired. Please sign in again" });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
    }
    return next();
  };
}

module.exports = { authenticate, createAccessToken, requireRole };