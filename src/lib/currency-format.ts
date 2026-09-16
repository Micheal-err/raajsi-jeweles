import { useCurrency } from "./currency";

type PriceLike = {
  price_min?: number | null;
  price_max?: number | null;
  price_display?: string;
  display_price?: number | null;
  price?: number | null;
};

export function useFormatPrice() {
  const { format } = useCurrency();
  return (a: PriceLike): string => {
    const primary = a.display_price ?? a.price ?? a.price_min ?? 0;
    return format(primary);
  };
}
