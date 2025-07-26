/**
 * Waits for the DOM to load if it is not ready yet.
 */
export async function waitForDOMContentLoaded() {
  if (document.readyState !== "loading") {
    return;
  }

  await new Promise((resolve) =>
    window.addEventListener("DOMContentLoaded", resolve, { once: true })
  );
}

/**
 * Asynchronously waits for an element to appear in the DOM with a specified selector.
 *
 * @template T - The type of element returned.
 * @param selector - Selector for searching for an element.
 * @param timeout - Maximum wait time in milliseconds.
 * @param interval - The interval between checks in milliseconds.
 * @returns A promise that resolves with the found element or is rejected on timeout.
 */
export const waitForElement = <T extends Element = Element>(
  selector: string,
  timeout: number = 20000,
  interval: number = 100
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = (): void => {
      const element = document.querySelector(selector) as T | null;

      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`The element “${selector}” did not appear within ${timeout} ms`));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
};

/**
 * Enables or disables page scrolling.
 * @param disabled If true, scrolling will be disabled.
 */
export const setDisabledScroll = (disabled: boolean) =>
  document.body.classList.toggle("mt-no-scroll", disabled);
