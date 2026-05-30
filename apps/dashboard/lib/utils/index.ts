// Common UI utilities — `cn` for conditional Tailwind classes.
// Uses clsx alone; tailwind-merge optional and not currently installed.

import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export * from './logger'
