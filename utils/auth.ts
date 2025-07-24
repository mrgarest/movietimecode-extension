import config from "config";
import { goToTab } from "./navigation";
import { TUser } from "@/types/user";

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
