export function authHeaders(includeJson = false) {
  const headers = includeJson ? { "Content-Type": "application/json" } : {};
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token) headers.Authorization = `Bearer ${user.token}`;
  } catch {
    localStorage.removeItem("user");
  }
  return headers;
}