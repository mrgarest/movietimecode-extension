import config from "config";
import { TUser } from "@/types/user";
import { getUser } from "@/utils/auth";

/**
 * Opens the extension page when the browser action icon is clicked.
 */
chrome.action.onClicked.addListener(() => goToTab({ to: "/settings" }));

/**
 * Handles messages received via `chrome.runtime.onMessage`.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "fetchData":
      return fetchData(message, sendResponse);
    case "goToTab":
      goToTab(message);
      break;
    default:
      break;
  }
});

/**
 * Opens a new tab with the extension and navigates to the specified section (hash).
 * @param message
 */
const goToTab = (message: any) => {
  let url: string;
  if (message.url) {
    url = message.url;
  } else if (message.to) {
    url = chrome.runtime.getURL("index.html") + "#" + message.to;
  } else return;

  chrome.tabs.create({
    url: url,
  });
};

/**
 * Performs an HTTP request via fetch and returns the result to the background script.
 * @param message Object with URL and request parameters.
 * @param sendResponse Function to send the response.
 * @returns true if the request was performed.
 */
const fetchData = (
  message: any,
  sendResponse: (response?: any) => void
): boolean => {
  if (!message.url) {
    sendResponse({ error: "URL is required" });
    return false;
  }
  (async () => {
    try {
      const { url, options } = message;

      options.headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Extension-ID": chrome.runtime.id as string,
        ...options.headers,
      };

      const user: TUser | undefined = await getUser();

      if (user?.accessToken) {
        options.headers["Authorization"] = `Bearer ${user.accessToken}`;
      }

      if (config.version) {
        options.headers["Extension-Version"] = config.version;
      }

      const response = await fetch(url, options);
      const data = await response.json();
      sendResponse(data);
    } catch (error) {
      sendResponse({ error: error });
    }
  })();

  return true;
};