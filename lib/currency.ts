export const MENU_CURRENCIES = ["ALL", "EUR"] as const;

export type MenuCurrencyCode = (typeof MENU_CURRENCIES)[number];

/**
 * Decimal places per currency's smallest stored unit. ALL is treated as
 * a zero-decimal currency (like JPY) since Albanian Lek prices aren't
 * conventionally subdivided — its "minor unit" is just the whole amount.
 */
export const CURRENCY_DECIMALS: Record<MenuCurrencyCode, number> = {
  ALL: 0,
  EUR: 2,
};

/** Converts a human-entered amount (e.g. 4.5) into the integer minor-unit value stored in the database (e.g. 450 for EUR). */
export function toMinorUnits(amount: number, currency: MenuCurrencyCode): number {
  const factor = 10 ** CURRENCY_DECIMALS[currency];
  return Math.round(amount * factor);
}

/** Converts a stored minor-unit integer back into a human decimal amount for display or form editing. */
export function fromMinorUnits(minor: number, currency: MenuCurrencyCode): number {
  const factor = 10 ** CURRENCY_DECIMALS[currency];
  return minor / factor;
}

/** Formats a stored price for display, e.g. "4.50 EUR" or "500 ALL". */
export function formatPrice(minor: number, currency: MenuCurrencyCode): string {
  const decimals = CURRENCY_DECIMALS[currency];
  return `${fromMinorUnits(minor, currency).toFixed(decimals)} ${currency}`;
}
