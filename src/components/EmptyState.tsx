interface EmptyStateProps {
  isFiltered?: boolean;
}

export default function EmptyState({ isFiltered = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <span className="text-6xl" role="img" aria-hidden="true">🥘</span>
      <h2 className="font-serif text-2xl text-text-primary">
        Pick something to prep this week
      </h2>
      <p className="text-text-secondary max-w-sm">
        {isFiltered
          ? "No items match this category. Try another filter."
          : "Select items from the grid below to build your batch prep session."}
      </p>
    </div>
  );
}
