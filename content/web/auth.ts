import { fetchBackground } from "@/utils/fetch";
import config from "config";
import { TUser } from "@/types/user";

/**
 * Sends an error message and clears user from storage.
 */
const postError = () => {
  chrome.storage.sync.set({ user: undefined });
  window.postMessage(
    {
      source: "auth",
      type: "error",
    },
    "*"
  );
};

/**
 * Handles authentication message from window.
 * @param event - message event
 */
const onMessage = async (event: any) => {
  if (event.source !== window) return;
  if (event.data?.source !== "auth") return;
  const auth = event.data?.auth;
  if (!auth?.id || !auth?.token) {
    return;
  }
  window.removeEventListener("message", onMessage);

  try {
    const data = await fetchBackground(
      `${config.baseUrl}/api/v1/auth?id=${auth.id}&token=${auth.token}`
    );
    if (data.success) {
      chrome.storage.sync.set(
        {
          user: {
            id: data.id,
            roleId: data.role_id,
            username: data.username,
            accessToken: data.access_token,
            expiresAt: data.expires_at,
          } as TUser,
        },
        () => {
          window.postMessage(
            {
              source: "auth",
              type: "success",
            },
            "*"
          );
        }
      );

      return;
    }
  } catch (e) {
    if (config.debug) {
      console.error(e);
    }
  }

  postError();
};

/**
 * Adds message listener if on auth callback page.
 */
if (location.href.includes("/auth/callback")) {
  window.addEventListener("message", onMessage);
}
