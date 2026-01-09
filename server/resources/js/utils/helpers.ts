/**
 * Checks whether the value is valid (not undefined and not null)
 * 
 * @param value
 * @returns bool
 */
export const isValidValue = <T>(value: T | null | undefined): value is T => {
  return value !== undefined && value !== null;
};

