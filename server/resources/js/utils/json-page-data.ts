/**
 * Retrieves JSON page data embedded in the HTML.
 * The data is expected to be stored in an element with the ID "JSON_PAGE_DATA".
 *
 * @template T - The expected return type of the parsed JSON.
 * @returns {T | undefined} Parsed JSON object if valid, otherwise `undefined`.
*/
export function getPageData<T = any>(): T | undefined {
    const element = document.getElementById("JSON_PAGE_DATA");

    if (!element) return undefined;

    const text = element.textContent;

    if (!text) return undefined;

    try {
        return JSON.parse(text) as T;
    } catch (err) {
        return undefined;
    }
}
