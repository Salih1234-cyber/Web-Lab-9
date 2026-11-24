export const VALID_GENRES = [
  "fiction",
  "non-fiction",
  "science",
  "history",
  "fantasy",
  "other",
];

export const VALID_SORT_FIELDS = ["id", "title", "author", "year", "rating"];
export const VALID_ORDERS = ["asc", "desc"];

function isPlainObject(val) {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function parsePositiveIntId(rawId) {
  if (!/^\d+$/.test(String(rawId))) {
    return null;
  }
  const num = Number(rawId);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

export function validateCompleteBookBody(body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  if (typeof body.title !== "string") {
    return { ok: false, error: "title is required and must be a string" };
  }
  const title = body.title.trim();
  if (title.length < 1 || title.length > 100) {
    return {
      ok: false,
      error: "title must be between 1 and 100 characters after trimming",
    };
  }

  if (typeof body.author !== "string") {
    return { ok: false, error: "author is required and must be a string" };
  }
  const author = body.author.trim();
  if (author.length < 1 || author.length > 100) {
    return {
      ok: false,
      error: "author must be between 1 and 100 characters after trimming",
    };
  }

  const currentYear = new Date().getFullYear();
  if (
    typeof body.year !== "number" ||
    !Number.isInteger(body.year) ||
    body.year < 1000 ||
    body.year > currentYear
  ) {
    return {
      ok: false,
      error: `year must be an integer between 1000 and ${currentYear}`,
    };
  }

  if (typeof body.genre !== "string" || !VALID_GENRES.includes(body.genre)) {
    return {
      ok: false,
      error: `genre must be one of: ${VALID_GENRES.join(", ")}`,
    };
  }

  const read = body.read === undefined ? false : body.read;
  if (typeof read !== "boolean") {
    return { ok: false, error: "read must be a boolean" };
  }

  const rating = body.rating === undefined ? null : body.rating;
  if (rating !== null) {
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return {
        ok: false,
        error: "rating must be null or an integer between 1 and 5",
      };
    }
    if (!read) {
      return {
        ok: false,
        error: "rating is only allowed when read is true",
      };
    }
  }

  return {
    ok: true,
    value: {
      title,
      author,
      year: body.year,
      genre: body.genre,
      read,
      rating,
    },
  };
}

export function validatePatchBody(existingBook, body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const candidate = {
    title: body.title !== undefined ? body.title : existingBook.title,
    author: body.author !== undefined ? body.author : existingBook.author,
    year: body.year !== undefined ? body.year : existingBook.year,
    genre: body.genre !== undefined ? body.genre : existingBook.genre,
    read: body.read !== undefined ? body.read : existingBook.read,
    rating: body.rating !== undefined ? body.rating : existingBook.rating,
  };

  return validateCompleteBookBody(candidate);
}

export function validateQueryParams(query) {
  const allowedKeys = new Set(["genre", "read", "q", "sort", "order", "limit", "page"]);

  for (const key of Object.keys(query)) {
    if (!allowedKeys.has(key)) {
      return { ok: false, error: `Unknown query parameter: ${key}` };
    }
    if (Array.isArray(query[key])) {
      return { ok: false, error: `Query parameter '${key}' cannot be repeated` };
    }
  }

  let genre = null;
  if (query.genre !== undefined) {
    if (!VALID_GENRES.includes(query.genre)) {
      return {
        ok: false,
        error: `Invalid genre '${query.genre}'. Must be one of: ${VALID_GENRES.join(", ")}`,
      };
    }
    genre = query.genre;
  }

  let read = null;
  if (query.read !== undefined) {
    if (query.read === "true") {
      read = true;
    } else if (query.read === "false") {
      read = false;
    } else {
      return { ok: false, error: "Query parameter 'read' must be 'true' or 'false'" };
    }
  }

  let q = null;
  if (query.q !== undefined) {
    q = String(query.q).trim().toLowerCase();
  }

  let sort = "id";
  if (query.sort !== undefined) {
    if (!VALID_SORT_FIELDS.includes(query.sort)) {
      return {
        ok: false,
        error: `Invalid sort field '${query.sort}'. Must be one of: ${VALID_SORT_FIELDS.join(", ")}`,
      };
    }
    sort = query.sort;
  }

  let order = "asc";
  if (query.order !== undefined) {
    if (!VALID_ORDERS.includes(query.order)) {
      return { ok: false, error: "Invalid order. Must be 'asc' or 'desc'" };
    }
    order = query.order;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    if (!/^\d+$/.test(String(query.limit))) {
      return { ok: false, error: "Query parameter 'limit' must be an integer between 1 and 50" };
    }
    limit = Number(query.limit);
    if (limit < 1 || limit > 50) {
      return { ok: false, error: "Query parameter 'limit' must be between 1 and 50" };
    }
  }

  let page = 1;
  if (query.page !== undefined) {
    if (!/^\d+$/.test(String(query.page))) {
      return { ok: false, error: "Query parameter 'page' must be a positive integer" };
    }
    page = Number(query.page);
    if (page < 1) {
      return { ok: false, error: "Query parameter 'page' must be at least 1" };
    }
  }

  return {
    ok: true,
    value: { genre, read, q, sort, order, limit, page },
  };
}