import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSegmet(segment: string) {
  return segment
    .split(/[-_]/) // split by dash or underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
