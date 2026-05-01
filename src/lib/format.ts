const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatIndianNumber(value: number | string) {
  return numberFormatter.format(Number(value));
}

export function formatIndianCurrency(value: number | string) {
  return currencyFormatter.format(Number(value));
}

export function formatIndianDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}