import config from "config";

/**
 * Sends a message to the background script to navigate to a specific extension tab or URL.
 * @param params Object containing navigation parameters.
 * @param params.to Optional path within the extension to navigate to.
 * @param params.url Optional URL to open in the tab.
 */
export const goToTab = ({
  to = undefined,
  url = undefined,
}: {
  to?: string;
  url?: string;
}) =>
  chrome.runtime.sendMessage({
    action: "goToTab",
    to: to,
    url: url,
  });

/**
 * Opens a new tab for authorization
 */
export const logIn = () =>
  goToTab({ url: `${config.baseUrl}/auth/login/twitch` });
