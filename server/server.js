import express from "express";
import cors from "cors";
import {
  listBooks,
  getBookById,
  createBook,
  replaceBook,
  patchBook,
  deleteBook,
  getStats,
} from "./booksStore.js";
import {
  parsePositiveIntId,
  validateCompleteBookBody,
  validatePatchBody,
  validateQueryParams,
} from "./validate.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(express.json());

// Malformed JSON handler (400 JSON instead of Express HTML)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }
  return next(err);
});

app.get("/api/books", async (req, res, next) => {
  try {
    const parsed = validateQueryParams(req.query);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    const result = await listBooks(parsed.value);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

app.get("/api/books/:id", async (req, res, next) => {
  try {
    const id = parsePositiveIntId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Book id must be a positive integer" });
    }
    const book = await getBookById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    return res.status(200).json(book);
  } catch (err) {
    return next(err);
  }
});

app.post("/api/books", async (req, res, next) => {
  try {
    const validated = validateCompleteBookBody(req.body);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const created = await createBook(validated.value);
    if (created.conflict) {
      return res.status(409).json({ error: created.error });
    }

    res.set("Location", `/api/books/${created.book.id}`);
    return res.status(201).json(created.book);
  } catch (err) {
    return next(err);
  }
});

app.put("/api/books/:id", async (req, res, next) => {
  try {
    const id = parsePositiveIntId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Book id must be a positive integer" });
    }

    const validated = validateCompleteBookBody(req.body);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const result = await replaceBook(id, validated.value);
    if (result.notFound) {
      return res.status(404).json({ error: "Book not found" });
    }
    if (result.conflict) {
      return res.status(409).json({ error: result.error });
    }

    return res.status(200).json(result.book);
  } catch (err) {
    return next(err);
  }
});

app.patch("/api/books/:id", async (req, res, next) => {
  try {
    const id = parsePositiveIntId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Book id must be a positive integer" });
    }

    const result = await patchBook(id, validatePatchBody, req.body);
    if (result.notFound) {
      return res.status(404).json({ error: "Book not found" });
    }
    if (result.validationError) {
      return res.status(400).json({ error: result.validationError });
    }
    if (result.conflict) {
      return res.status(409).json({ error: result.error });
    }

    return res.status(200).json(result.book);
  } catch (err) {
    return next(err);
  }
});

app.delete("/api/books/:id", async (req, res, next) => {
  try {
    const id = parsePositiveIntId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: "Book id must be a positive integer" });
    }

    const deleted = await deleteBook(id);
    if (!deleted) {
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

app.get("/api/stats", async (req, res, next) => {
  try {
    const stats = await getStats();
    return res.status(200).json(stats);
  } catch (err) {
    return next(err);
  }
});

// Deliberate async error route for testing 500 error middleware (document in README)
app.get("/api/crash", async (req, res, next) => {
  try {
    await Promise.resolve();
    throw new Error("Simulated async failure");
  } catch (err) {
    return next(err);
  }
});

// 404 fallback under /api (no Express 4 wildcard '*')
app.use("/api", (req, res) => {
  return res.status(404).json({ error: "Not found" });
});

// Final 4-argument error-handling middleware (no stack trace in response)
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.message);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});