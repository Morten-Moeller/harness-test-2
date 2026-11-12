export function moveInArray<T>(entries: readonly T[], from: number, to: number): T[] {
  const copy = [...entries];
  const [entry] = copy.splice(from, 1);
  copy.splice(to, 0, entry);
  return copy;
}

export function positionAfterMove<T>(
  all: readonly T[],
  visible: readonly T[],
  fromVisible: number,
  toVisible: number,
): number {
  const moved = visible[fromVisible];
  if (fromVisible === toVisible) {
    return all.indexOf(moved);
  }
  const rest = all.filter((entry) => entry !== moved);
  const newVisible = moveInArray(visible, fromVisible, toVisible);
  if (toVisible > fromVisible) {
    return rest.indexOf(newVisible[toVisible - 1]) + 1;
  }
  return rest.indexOf(newVisible[toVisible + 1]);
}
