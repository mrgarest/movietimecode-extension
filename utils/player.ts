/**
 * Sends a postMessage to the player iframe.
 *
 * @param player - The target iframe element.
 * @param message - The message object to send.
 */
const playerPostMessage = (
  player: HTMLIFrameElement | undefined,
  message: any
) => {
  if (!player) return;
  player.contentWindow?.postMessage(message, "*");
};

/**
 * Sends a command to start playback.
 *
 * @param player - The target iframe element.
 */
export const playerPlay = (player: HTMLIFrameElement | undefined) => {
  playerPostMessage(player, { api: "play" });
};

/**
 * Sends a command to pause playback.
 *
 * @param player - The target iframe element.
 */
export const playerPause = (player: HTMLIFrameElement | undefined) => {
  playerPostMessage(player, { api: "pause" });
};

/**
 * Sends a command to mute the player audio.
 *
 * @param player - The target iframe element.
 */
export const playerMute = (player: HTMLIFrameElement | undefined) => {
  playerPostMessage(player, { api: "mute" });
};

/**
 * Sends a command to unmute the player audio.
 *
 * @param player - The target iframe element.
 */
export const playerUnmute = (player: HTMLIFrameElement | undefined) => {
  playerPostMessage(player, { api: "unmute" });
};

/**
 * Sends a command to seek to a specific timestamp in the video.
 *
 * @param player - The target iframe element.
 * @param seconds - The seconds to seek to.
 */
export const playerSeek = (
  player: HTMLIFrameElement | undefined,
  seconds: number
) => {
  playerPostMessage(player, { api: "seek", set: seconds });
};

/**
 * Makes the player iframe visually invisible by adding a CSS class that applies zero opacity.
 *
 * @param player - The target iframe element.
 */
export const playerInvisible = (player: HTMLIFrameElement | undefined) => {
  player?.classList.add("mt-opacity-0");
};

/**
 * Restores the player's visibility by removing the CSS class responsible for hiding it.
 *
 * @param player - The target iframe element.
 */
export const playerVisible = (player: HTMLIFrameElement | undefined) => {
  player?.classList.remove("mt-opacity-0");
};

/**
 * Checks whether the player iframe is currently visible.
 *
 * @param player - The target iframe element.
 * @returns boolean
 */
export const isPlayerVisible = (
  player: HTMLIFrameElement | undefined
): boolean => {
  if (!player) return true;
  return !player.classList.contains("mt-opacity-0");
};
