import config from "config";
import { goToTab } from "./navigation";
import { TUser, TUserTwitch } from "@/types/user";
import { fetchBackground } from "./fetch";

/**
 * Opens a new tab for authorization
 */
export const logIn = () => goToTab({ url: `${config.baseUrl}/auth/twitch` });

/**
 * Log out of the system
 */
export const logOut = async () => await chrome.storage.sync.remove("user");

/**
 * Receives user data
 * @returns A user object of type TUser or undefined if the user is not found
 */
export const getUser = async (): Promise<TUser | undefined> => {
  const storage = await chrome.storage.sync.get("user");
  return storage?.user;
};

/**
 * Checks if the user's Twitch token has expired.
 *
 * @param user
 * @returns boolean - True if the token is expired, false otherwise.
 */
export const isTwitchTokenExpires = (user: TUser): boolean => {
  if (!user?.twitch) return true;

  const expiresAt = user.twitch.expiresAt;
  if (!expiresAt) return true;

  const now = Math.floor(Date.now() / 1000);

  return now >= expiresAt;
};

/**
 * Refreshes Twitch token and updates chrome.storage.
 *
 * @param user
 * @returns Promise<TUserTwitch | null>
 */
export const refreshTwitchToken = async (
  user: TUser
): Promise<TUserTwitch | null> => {
  if (!user?.twitch?.refreshToken) return null;
  try {
    const data = await fetchBackground(
      `${config.baseUrl}/api/v1/twitch/token?grant_type=refresh_token&refresh_token=${user.twitch.refreshToken}`,
      {
        method: "POST",
      }
    );

    if (!data.success) {
      return null;
    }

    const twitch: TUserTwitch = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };

    await chrome.storage.sync.set({
      user: {
        ...user,
        twitch: twitch,
      } as TUser,
    });

    return twitch;
  } catch (err) {
    if (config.debug) {
      console.error("Failed to refresh Twitch token:", err);
    }
    return null;
  }
};

/**
 * Checks whether the stream has started.
 *
 * @param user
 * @returns Promise<boolean>
 */
export const isStreamLive = async (user: TUser): Promise<boolean> => {
  if (!user?.twitch?.accessToken) return false;
  try {
    const data = await fetchBackground(
      `${config.baseUrl}/api/v1/twitch/stream/status?username=${user.username}&access_token=${user.twitch.accessToken}`
    );

    return data.success && data.is_live;
  } catch (err) {
    if (config.debug) {
      console.error(err);
    }
  }
  return false;
};
