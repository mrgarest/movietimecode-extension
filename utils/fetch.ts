import config from "config";
import { TMovieSearch } from "@/types/movie";

/**
 * Sends a request to the background script.
 * @param url URL for the request.
 * @param options Request options (method, headers, etc.).
 * @returns The result of the request.
 */
export const fetchBackground = async (
  url: string,
  options: RequestInit = {
    method: "GET",
  }
) => {
  return new Promise<any>((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchData", url, options },
      (response) =>
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(response)
    );
  });
};

/**
 * Fetches movie search results from the background script.
 *
 * @param query The search query.
 * @param page The page number for paginated results.
 * @param year Optional release year filter.
 * @returns The result of the request.
 */
export const fetchSearchMovie = async (
  query: string,
  page: number,
  year: number | null
): Promise<TMovieSearch> => {
  const url = new URL("/api/v1/movie/search", config.baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));
  if (year !== null) url.searchParams.set("year", String(year));

  const response = await fetchBackground(url.toString());
  return response as TMovieSearch;
};
