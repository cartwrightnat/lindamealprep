import IngredientRow from "./IngredientRow";
import type { AggregatedIngredient } from "@/lib/aggregation";

interface IngredientSectionProps {
  title: string;
  ingredients: AggregatedIngredient[];
}

export default function IngredientSection({ title, ingredients }: IngredientSectionProps) {
  if (ingredients.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="font-serif text-xl text-text-primary mb-3 pb-2 border-b-2 border-spice-light">
        {title}
      </h2>
      <ul>
        {ingredients.map((ing) => (
          <IngredientRow
            key={`${ing.name}||${ing.unit}`}
            name={ing.name}
            quantity={ing.quantity}
            unit={ing.unit}
          />
        ))}
      </ul>
    </section>
  );
}
