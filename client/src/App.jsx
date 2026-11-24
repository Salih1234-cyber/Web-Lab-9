import { useEffect, useState } from "react";
import {
  fetchBooks,
  fetchStats,
  createBook,
  replaceBook,
  patchBook,
  deleteBook,
} from "./api/books.js";
import StatsPanel from "./components/StatsPanel.jsx";
import BookForm from "./components/BookForm.jsx";

const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

export default function App() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Query state
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState("asc");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [booksRes, statsRes] = await Promise.all([
          fetchBooks(
            { q, genre, read: readFilter, sort, order },
            { signal: controller.signal }
          ),
          fetchStats({ signal: controller.signal }),
        ]);

        if (!active) return;
        setBooks([...booksRes.items]);
        setStats({ ...statsRes });
      } catch (err) {
        if (err.name === "AbortError") return;
        if (!active) return;
        setError(err.message || "Failed to load books");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [q, genre, readFilter, sort, order, refreshTick]);

  async function refreshAll() {
    setRefreshTick((prev) => prev + 1);
  }

  async function handleFormSubmit(payload, bookId) {
    setSubmitting(true);
    setActionError(null);

    try {
      if (bookId !== null) {
        const updated = await replaceBook(bookId, payload);
        setBooks((prev) => prev.map((item) => (item.id === bookId ? updated : item)));
        setEditingBook(null);
      } else {
        await createBook(payload);
      }
      await refreshAll();
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleRead(book) {
    setActionError(null);
    const nextRead = !book.read;
    const patchPayload = nextRead
      ? { read: true }
      : { read: false, rating: null };

    try {
      const updated = await patchBook(book.id, patchPayload);
      setBooks((prev) => prev.map((item) => (item.id === book.id ? updated : item)));
      const nextStats = await fetchStats();
      setStats({ ...nextStats });
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRatingChange(book, rawValue) {
    setActionError(null);
    const nextRating = rawValue === "" ? null : Number(rawValue);

    try {
      const updated = await patchBook(book.id, { rating: nextRating });
      setBooks((prev) => prev.map((item) => (item.id === book.id ? updated : item)));
      const nextStats = await fetchStats();
      setStats({ ...nextStats });
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(bookId) {
    setActionError(null);
    try {
      await deleteBook(bookId);
      setBooks((prev) => prev.filter((item) => item.id !== bookId));
      if (editingBook && editingBook.id === bookId) {
        setEditingBook(null);
      }
      const nextStats = await fetchStats();
      setStats({ ...nextStats });
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <main style={{ maxWidth: "900px", margin: "24px auto", padding: "0 16px" }}>
      <h1>Reading List</h1>

      <StatsPanel stats={stats} />

      <hr />

      <section aria-label="Search, Filter and Sort">
        <h2>Search &amp; Filter</h2>
        <div>
          <label>
            Search (title/author):{" "}
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Dune or Tolkien"
            />
          </label>
        </div>

        <div style={{ marginTop: "8px" }}>
          <label>
            Genre:{" "}
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label style={{ marginLeft: "12px" }}>
            Status:{" "}
            <select value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
              <option value="">All</option>
              <option value="true">Read</option>
              <option value="false">Unread</option>
            </select>
          </label>

          <label style={{ marginLeft: "12px" }}>
            Sort by:{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="id">ID</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="year">Year</option>
              <option value="rating">Rating</option>
            </select>
          </label>

          <label style={{ marginLeft: "12px" }}>
            Order:{" "}
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>
      </section>

      <hr />

      {actionError && (
        <div role="alert" style={{ color: "crimson", marginBottom: "12px" }}>
          Error: {actionError}
        </div>
      )}

      <BookForm
        editingBook={editingBook}
        onCancelEdit={() => setEditingBook(null)}
        onSubmitBook={handleFormSubmit}
        submitting={submitting}
      />

      <hr />

      <section aria-label="Books List">
        <h2>Books</h2>

        {loading && <p>Loading books...</p>}
        {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {!loading && !error && books.length === 0 && <p>No books match the current filters.</p>}

        {!loading && !error && books.length > 0 && (
          <ul>
            {books.map((book) => (
              <li key={book.id} style={{ marginBottom: "12px" }}>
                <div>
                  <strong>{book.title}</strong> — {book.author} ({book.year}) | Genre:{" "}
                  {book.genre} | Status: {book.read ? "Read" : "Unread"}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <button type="button" onClick={() => handleToggleRead(book)}>
                    Mark as {book.read ? "Unread" : "Read"}
                  </button>

                  <label style={{ marginLeft: "8px" }}>
                    Rating:{" "}
                    <select
                      value={book.rating === null ? "" : String(book.rating)}
                      disabled={!book.read}
                      onChange={(e) => handleRatingChange(book, e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => setEditingBook({ ...book })}
                    style={{ marginLeft: "8px" }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(book.id)}
                    style={{ marginLeft: "8px" }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}