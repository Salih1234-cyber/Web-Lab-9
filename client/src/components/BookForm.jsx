import { useEffect, useState } from "react";

const GENRES = ["fiction", "non-fiction", "science", "history", "fantasy", "other"];

const EMPTY_FORM = {
  title: "",
  author: "",
  year: "",
  genre: "fiction",
  read: false,
  rating: "",
};

export default function BookForm({ editingBook, onCancelEdit, onSubmitBook, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (editingBook) {
      setForm({
        title: editingBook.title,
        author: editingBook.author,
        year: String(editingBook.year),
        genre: editingBook.genre,
        read: Boolean(editingBook.read),
        rating: editingBook.rating === null ? "" : String(editingBook.rating),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingBook]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      if (type === "checkbox") {
        return {
          ...prev,
          [name]: checked,
          rating: !checked ? "" : prev.rating,
        };
      }
      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      title: form.title,
      author: form.author,
      year: form.year === "" ? NaN : Number(form.year),
      genre: form.genre,
      read: form.read,
      rating: form.read && form.rating !== "" ? Number(form.rating) : null,
    };

    const ok = await onSubmitBook(payload, editingBook ? editingBook.id : null);
    if (ok && !editingBook) {
      setForm(EMPTY_FORM);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{editingBook ? `Edit Book #${editingBook.id}` : "Add a New Book"}</h2>

      <div>
        <label>
          Title:{" "}
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            disabled={submitting}
          />
        </label>
      </div>

      <div>
        <label>
          Author:{" "}
          <input
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            disabled={submitting}
          />
        </label>
      </div>

      <div>
        <label>
          Year:{" "}
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
            disabled={submitting}
          />
        </label>
      </div>

      <div>
        <label>
          Genre:{" "}
          <select
            name="genre"
            value={form.genre}
            onChange={handleChange}
            disabled={submitting}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            name="read"
            checked={form.read}
            onChange={handleChange}
            disabled={submitting}
          />{" "}
          Read
        </label>
      </div>

      {form.read && (
        <div>
          <label>
            Rating (1-5):{" "}
            <select
              name="rating"
              value={form.rating}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="">Unrated</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
        </div>
      )}

      <div style={{ marginTop: "8px" }}>
        <button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : editingBook
              ? "Save Changes (PUT)"
              : "Add Book"}
        </button>
        {editingBook && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={submitting}
            style={{ marginLeft: "8px" }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}