const INITIAL_BOOKS = [
  {
    id: 1,
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "science",
    read: true,
    rating: 5,
  },
  {
    id: 2,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    genre: "fantasy",
    read: true,
    rating: 4,
  },
  {
    id: 3,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    year: 2011,
    genre: "history",
    read: true,
    rating: 4,
  },
  {
    id: 4,
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
    genre: "non-fiction",
    read: false,
    rating: null,
  },
  {
    id: 5,
    title: "Piranesi",
    author: "Susanna Clarke",
    year: 2020,
    genre: "fantasy",
    read: true,
    rating: 5,
  },
  {
    id: 6,
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    year: 1969,
    genre: "fiction",
    read: false,
    rating: null,
  },
];

let books = INITIAL_BOOKS.map((b) => ({ ...b }));
let nextId = 7;

function simulateIoDelay(ms = 20) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDuplicateBook(title, author, excludeId = null) {
  const normTitle = title.toLowerCase();
  const normAuthor = author.toLowerCase();
  return books.some(
    (b) =>
      b.id !== excludeId &&
      b.title.toLowerCase() === normTitle &&
      b.author.toLowerCase() === normAuthor
  );
}

function compareBooks(a, b, sort, order) {
  const dir = order === "desc" ? -1 : 1;

  if (sort === "rating") {
    const aRated = a.rating !== null;
    const bRated = b.rating !== null;
    if (!aRated && !bRated) return (a.id - b.id) * dir;
    if (!aRated) return 1; // unrated always last
    if (!bRated) return -1; // unrated always last
    if (a.rating !== b.rating) return (a.rating - b.rating) * dir;
    return a.id - b.id;
  }

  if (sort === "year" || sort === "id") {
    if (a[sort] !== b[sort]) return (a[sort] - b[sort]) * dir;
    return a.id - b.id;
  }

  // title or author
  const cmp = a[sort].localeCompare(b[sort], undefined, { sensitivity: "base" });
  if (cmp !== 0) return cmp * dir;
  return a.id - b.id;
}

export async function listBooks(options) {
  await simulateIoDelay();

  let filtered = books.map((b) => ({ ...b }));

  if (options.genre !== null) {
    filtered = filtered.filter((b) => b.genre === options.genre);
  }

  if (options.read !== null) {
    filtered = filtered.filter((b) => b.read === options.read);
  }

  if (options.q !== null && options.q.length > 0) {
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(options.q) ||
        b.author.toLowerCase().includes(options.q)
    );
  }

  const sorted = [...filtered].sort((a, b) =>
    compareBooks(a, b, options.sort, options.order)
  );

  const totalFiltered = sorted.length;
  const start = (options.page - 1) * options.limit;
  const paginated = sorted.slice(start, start + options.limit).map((b) => ({ ...b }));

  return {
    items: paginated,
    total: totalFiltered,
    page: options.page,
    limit: options.limit,
  };
}

export async function getBookById(id) {
  await simulateIoDelay();
  const found = books.find((b) => b.id === id);
  return found ? { ...found } : null;
}

export async function createBook(validatedFields) {
  await simulateIoDelay();

  if (isDuplicateBook(validatedFields.title, validatedFields.author)) {
    return { conflict: true, error: "A book with the same title and author already exists" };
  }

  const newBook = {
    id: nextId,
    title: validatedFields.title,
    author: validatedFields.author,
    year: validatedFields.year,
    genre: validatedFields.genre,
    read: validatedFields.read,
    rating: validatedFields.rating,
  };

  nextId += 1;
  books = [...books, newBook];

  return { conflict: false, book: { ...newBook } };
}

export async function replaceBook(id, validatedFields) {
  await simulateIoDelay();

  const index = books.findIndex((b) => b.id === id);
  if (index === -1) {
    return { notFound: true };
  }

  if (isDuplicateBook(validatedFields.title, validatedFields.author, id)) {
    return { conflict: true, error: "A book with the same title and author already exists" };
  }

  const updatedBook = {
    id,
    title: validatedFields.title,
    author: validatedFields.author,
    year: validatedFields.year,
    genre: validatedFields.genre,
    read: validatedFields.read,
    rating: validatedFields.rating,
  };

  books = books.map((b) => (b.id === id ? updatedBook : b));

  return { notFound: false, conflict: false, book: { ...updatedBook } };
}

export async function patchBook(id, patchValidatorFn, body) {
  await simulateIoDelay();

  const existing = books.find((b) => b.id === id);
  if (!existing) {
    return { notFound: true };
  }

  const validation = patchValidatorFn(existing, body);
  if (!validation.ok) {
    return { notFound: false, validationError: validation.error };
  }

  if (isDuplicateBook(validation.value.title, validation.value.author, id)) {
    return {
      notFound: false,
      conflict: true,
      error: "A book with the same title and author already exists",
    };
  }

  const updatedBook = {
    id,
    ...validation.value,
  };

  books = books.map((b) => (b.id === id ? updatedBook : b));

  return { notFound: false, conflict: false, book: { ...updatedBook } };
}

export async function deleteBook(id) {
  await simulateIoDelay();

  const exists = books.some((b) => b.id === id);
  if (!exists) {
    return false;
  }

  books = books.filter((b) => b.id !== id);
  return true;
}

export async function getStats() {
  await simulateIoDelay();

  const total = books.length;
  const readCount = books.filter((b) => b.read === true).length;
  const unreadCount = total - readCount;

  const ratedBooks = books.filter((b) => b.rating !== null);
  const averageRating =
    ratedBooks.length === 0
      ? null
      : Number(
          (
            ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length
          ).toFixed(2)
        );

  const byGenre = {};
  for (const book of books) {
    byGenre[book.genre] = (byGenre[book.genre] || 0) + 1;
  }

  return {
    total,
    read: readCount,
    unread: unreadCount,
    averageRating,
    byGenre,
  };
}