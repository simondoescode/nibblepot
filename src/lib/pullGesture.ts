export const PULL_THRESHOLD = 96;
export const MAX_PULL = 145;

/** Pure gesture classification, separate from DOM listeners for easy testing. */
export function pullDistance(startX: number, startY: number, currentX: number, currentY: number): number {
  const vertical = currentY - startY;
  const horizontal = Math.abs(currentX - startX);
  if (vertical <= 0 || horizontal > vertical * 0.75) return 0;
  return Math.min(MAX_PULL, vertical * 0.65);
}
export function shouldRefresh(distance: number): boolean {
  return distance >= PULL_THRESHOLD;
}
