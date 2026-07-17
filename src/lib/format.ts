export function formatPrice(price: number | string, currency: string): string {
  const n = typeof price === "string" ? Number(price) : price;
  return `${currency} ${n.toLocaleString()}`;
}

export function formatMileage(mileage: number | null, unit: string): string {
  if (mileage === null) return "—";
  return `${mileage.toLocaleString()} ${unit === "MILES" ? "mi" : "km"}`;
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  USED: "Used",
  IMPORTED: "Imported",
  CERTIFIED_PRE_OWNED: "Certified pre-owned",
};

const FUEL_LABELS: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in hybrid",
  LPG: "LPG",
  OTHER: "Other",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
  CVT: "CVT",
  SEMI_AUTOMATIC: "Semi-automatic",
};

const DRIVE_TYPE_LABELS: Record<string, string> = {
  FWD: "Front-wheel drive",
  RWD: "Rear-wheel drive",
  AWD: "All-wheel drive",
  FOUR_WD: "4WD",
};

export function conditionLabel(value: string): string {
  return CONDITION_LABELS[value] ?? value;
}

export function fuelLabel(value: string): string {
  return FUEL_LABELS[value] ?? value;
}

export function transmissionLabel(value: string): string {
  return TRANSMISSION_LABELS[value] ?? value;
}

export function driveTypeLabel(value: string): string {
  return DRIVE_TYPE_LABELS[value] ?? value;
}
