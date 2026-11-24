const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  const init = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  if (signal) {
    init.signal = signal;
  }

  const response = await fetch(`${BASE_URL}${path}`, init);

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function fetchBooks(params = {}, { signal } = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  const path = qs ? `/api/books?${qs}` : "/api/books";
  return request(path, { method: "GET", signal });
}

export function createBook(bookData) {
  return request("/api/books", { method: "POST", body: bookData });
}

export function replaceBook(id, bookData) {
  return request(`/api/books/${id}`, { method: "PUT", body: bookData });
}

export function patchBook(id, partialData) {
  return request(`/api/books/${id}`, { method: "PATCH", body: partialData });
}

export function deleteBook(id) {
  return request(`/api/books/${id}`, { method: "DELETE" });
}

export function fetchStats({ signal } = {}) {
  return request("/api/stats", { method: "GET", signal });
}