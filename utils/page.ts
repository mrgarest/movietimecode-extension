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
 * Enables or disables page scrolling.
 * @param disabled If true, scrolling will be disabled.
 */
export const setDisabledScroll = (disabled: boolean) =>
  document.body.classList.toggle("mt-no-scroll", disabled);
