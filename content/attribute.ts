type TStringNull = string | null;

/**
 * Creates a `movietimecode` attribute with the given parameters.
 * @param name Attribute name (optional).
 * @param value Attribute value (optional).
 * @param isBracket If true, adds square brackets around the attribute.
 * @returns Generated attribute as a string.
 */
export const buildData = ({
  name = null,
  value = null,
  isBracket = false,
}: {
  name?: TStringNull;
  value?: TStringNull;
  isBracket?: boolean;
}) => {
  const data = `movietimecode${name ? `-${name}` : ""}${value ? `="${value}"` : ""}`;
  return isBracket ? `[${data}]` : data;
};

/**
 * Finds an element in the DOM by the `movietimecode` attribute.
 * @param name Attribute name (optional).
 * @param value Attribute value (optional).
 * @param element Element within which to search (default is `document.body`).
 * @returns The first found element or null if not found.
 */
export const querySelectorAttribute = ({
  name = null,
  value = null,
  element = document.body as HTMLIFrameElement,
}: {
  name?: TStringNull;
  value?: TStringNull;
  element?: HTMLIFrameElement;
}): HTMLElement | null =>
  element.querySelector(
    buildData({ name: name, value: value, isBracket: true })
  );

/**
 * Finds a dialog element in the DOM by the `movietimecode-dialog` attribute.
 * @param value Value of the `dialog` attribute (optional).
 * @param element Element within which to search (default is `document.body`).
 * @returns The first found dialog element or null if not found.
 */
export const getDialog = (
  value: TStringNull = null,
  element = document.body as HTMLIFrameElement
): HTMLElement | null =>
  querySelectorAttribute({ name: "dialog", value: value, element: element });
