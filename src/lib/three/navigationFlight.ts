/**
 * Single-flight guard for board navigation.
 *
 * Kept outside the experience store and navigateToBoard so either can
 * clear the guard without creating a circular import.
 */

let inFlight: Promise<boolean> | null = null;

export function getNavigationFlight() {
  return inFlight;
}

export function setNavigationFlight(flight: Promise<boolean> | null) {
  inFlight = flight;
}

export function resetNavigationFlight() {
  inFlight = null;
}
