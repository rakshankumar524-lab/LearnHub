const test = require("node:test");
const assert = require("node:assert/strict");
const { authenticate, createAccessToken, requireRole } = require("../middleware/authorization");

function runMiddleware(middleware, token, role) {
  const req = {
    get: () => token ? `Bearer ${token}` : undefined,
    user: role ? { role } : undefined,
  };
  const result = { status: 200, body: null, continued: false };
  const res = {
    status(status) {
      result.status = status;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  middleware(req, res, () => { result.continued = true; });
  return { ...result, user: req.user };
}

test("authenticate accepts a valid signed token", () => {
  const token = createAccessToken({ email: "student@example.com", name: "Student", role: "student" });
  const result = runMiddleware(authenticate, token);

  assert.equal(result.continued, true);
  assert.equal(result.user.email, "student@example.com");
});

test("authenticate rejects missing and modified tokens", () => {
  assert.equal(runMiddleware(authenticate).status, 401);
  const token = createAccessToken({ email: "student@example.com", name: "Student", role: "student" });
  assert.equal(runMiddleware(authenticate, `${token}x`).status, 401);
});

test("requireRole blocks students from admin actions", () => {
  const result = runMiddleware(requireRole("admin"), null, "student");

  assert.equal(result.status, 403);
  assert.equal(result.continued, false);
});

test("requireRole allows admins", () => {
  const result = runMiddleware(requireRole("admin"), null, "admin");

  assert.equal(result.continued, true);
});