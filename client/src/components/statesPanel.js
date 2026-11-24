export default function StatsPanel({ stats }) {
  if (!stats) {
    return <p>Loading statistics...</p>;
  }

  const genreEntries = Object.entries(stats.byGenre || {});

  return (
    <section aria-label="Reading Statistics">
      <h2>Statistics</h2>
      <ul>
        <li>Total books: {stats.total}</li>
        <li>Read: {stats.read}</li>
        <li>Unread: {stats.unread}</li>
        <li>
          Average rating:{" "}
          {stats.averageRating === null ? "No ratings yet" : stats.averageRating}
        </li>
      </ul>
      <div>
        <strong>By genre:</strong>{" "}
        {genreEntries.length === 0
          ? "None"
          : genreEntries.map(([genre, count]) => `${genre} (${count})`).join(", ")}
      </div>
    </section>
  );
}