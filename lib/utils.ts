import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value / 100);
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function trackGradient(seed: string) {
  const gradients = [
    "from-fuchsia-500 via-pink-500 to-amber-400",
    "from-cyan-500 via-indigo-500 to-fuchsia-500",
    "from-emerald-500 via-teal-400 to-cyan-400",
    "from-orange-500 via-rose-500 to-fuchsia-500"
  ];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 3)) % gradients.length;
  }
  return gradients[hash] ?? gradients[0];
}
