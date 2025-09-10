import { BlurPower, TimecodeAction } from "@/enums/timecode";
import OBSClient, { OBSType, TScene } from "@/lib/obs-client";
import { TSettingsOBSClientNull } from "@/types/storage";
import { TSegment } from "@/types/timecode";
import config from "config";
import { secondsToTime } from "@/utils/format";
import { renderQuestionDialog } from "./components/question-dialog";
import i18n from "@/lib/i18n";
import { playAlerSound } from "@/utils/alert";

let isPlayerListener = false;
let obsClient: OBSClient | null = null;
let obsType: string | null = null;
let isConnectedObsClient: boolean = false;
let activeSceneOBS: TScene | null;
let obsCensorScene: TScene | null;

/**
 * Updates the OBS scene for censorship if it differs from the current one.
 * @param name Scene name.
 */
export const updatePlayerCensorScene = async (name: string) => {
  if (obsCensorScene && obsCensorScene.name == name) {
    return;
  }
  if (!obsClient) {
    return;
  }
  const scene = await obsClient.findScene(name);
  if (scene) {
    obsCensorScene = scene;
  }
};

/**
 * Removes the player message listener and disconnects the OBS client.
 */
export const removePlayerListener = () => {
  if (!isPlayerListener) return;
  window.removeEventListener("message", handlePlayer);
  isPlayerListener = false;
  if (obsClient) {
    try {
      obsClient.disconnect();
    } catch (e) {
      if (config.debug) {
        console.error(e);
      }
    }
  }
};

/**
 * Adds a player message listener and sets up the OBS client.
 * @param enableOBSClient Indicates whether to use the OBS client.
 * @param obsClientSettings OBS client settings.
 * @param obsCensorSceneName Scene name.
 */
export const setPlayerListener = async (
  enableOBSClient: boolean,
  obsClientSettings: TSettingsOBSClientNull,
  obsCensorSceneName: string
) => {
  if (isPlayerListener) removePlayerListener();
  window.addEventListener("message", handlePlayer);
  isPlayerListener = true;

  setOBSClient(enableOBSClient, obsClientSettings, obsCensorSceneName);
};

/**
 * Handles OBS client connection errors by displaying a dialog.
 */
const handleObsClientError = () => {
  let obsName: string;
  switch (obsType) {
    case OBSType.obsstudio:
      obsName = "OBS Studio";
      break;
    case OBSType.streamlabs:
      obsName = "Streamlabs OBS";
      break;
    default:
      obsName = "OBS";
      break;
  }
  renderQuestionDialog({
    sound: true,
    id: "obs-connection-error",
    title: i18n.t("connectionError"),
    description: i18n.t("unableConnectObsOrConnectionLost", { obs: obsName }),
    buttons: [
      {
        text: i18n.t("close"),
        style: "primary",
      },
    ],
  });
};

/**
 * Sets up the OBS client for censorship actions.
 * @param enableOBSClient Indicates whether to use the OBS client.
 * @param obsClientSettings OBS client settings.
 * @param obsCensorSceneName Scene name.
 */
export const setOBSClient = async (
  enableOBSClient: boolean,
  obsClientSettings: TSettingsOBSClientNull,
  obsCensorSceneName: string
) => {
  if (!isPlayerListener || !obsClientSettings || !enableOBSClient) return;

  obsType = obsClientSettings.type;
  try {
    obsClient?.disconnect();
    obsClient = new OBSClient(obsClientSettings);
    isConnectedObsClient = await obsClient.connect();
    if (!isConnectedObsClient) {
      throw new Error("Failed to connect to OBS Client");
    }
    const scene = await obsClient.findScene(obsCensorSceneName);
    if (!scene) {
      obsClient?.disconnect();
      return;
    }
    obsCensorScene = scene;
  } catch (e) {
    obsClient = null;
    obsCensorScene = null;
    if (config.debug) {
      console.error(e);
    }
  }
};

/**
 * Handles messages from the player.
 * @param e Message event object (MessageEvent).
 */
const handlePlayer = (e: MessageEvent) => {
  if (e.data.event === undefined) return;

  switch (e.data.event) {
    case "time":
      timePlayerListener?.(parseInt(e.data.time || "0"));
      break;
    case "fullscreen":
      break;
    case "exitfullscreen":
      break;
    case "play":
      break;
    case "volume":
      break;
    default:
      break;
  }
};

type TPlayerTimeCallback = (data: any) => void;
let timePlayerListener: TPlayerTimeCallback | null = null;
/**
 * Sets a listener for updating the player's time.
 * @param callback Callback function that receives time data.
 */
export const setPlayerTimeListener = (callback: TPlayerTimeCallback) => {
  timePlayerListener = callback;
};

/**
 * Performs a censorship action for the player depending on the action type.
 * @param isCensored Indicates whether to apply censorship.
 * @param time Current time in the player.
 * @param action Action type.
 * @param blurPower Blur strength (if blur is applied).
 * @param segment Timecode segment to which the action is applied.
 * @param player Player HTML element.
 */
export const setPlayerCensorshipAction = async ({
  isCensored,
  time,
  action,
  blurPower,
  segment,
  player,
}: {
  isCensored: boolean;
  time: number,
  action: TimecodeAction | null;
  blurPower: BlurPower | null;
  segment: TSegment;
  player: HTMLIFrameElement;
}) => {
  const cw: WindowProxy | null = player!.contentWindow;
  switch (action) {
    case TimecodeAction.blur:
      setPlayerBlur(isCensored, blurPower, player);
      break;
    case TimecodeAction.hide:
      player.style.opacity = isCensored ? "0" : "1";
      break;
    case TimecodeAction.mute:
      cw?.postMessage({ api: isCensored ? "mute" : "unmute" }, "*");
      break;
    case TimecodeAction.pause:
      if (!isCensored) break;
      cw?.postMessage({ api: "pause" }, "*");
      playAlerSound();
      break;
    case TimecodeAction.skip:
      if (isCensored && segment.end_time)
        cw?.postMessage({ api: "seek", set: segment.end_time + 1 }, "*");
      break;
    case TimecodeAction.obsSceneChange:
      try {
        if (obsClient && isCensored) {
          activeSceneOBS = await obsClient.getActiveScene();
        }

        if (
          !obsClient ||
          !obsCensorScene ||
          (!isCensored && !activeSceneOBS?.id)
        ) {
          debugLogCensorshipAction(false, time, segment, isCensored, action);
          setPlayerCensorshipAction({
            isCensored: isCensored,
            time: time,
            action: TimecodeAction.pause,
            blurPower: blurPower,
            segment: segment,
            player: player,
          });
          handleObsClientError();
          return;
        }

        let isSetScene = await obsClient.setActiveScene(
          isCensored ? obsCensorScene : activeSceneOBS!
        );

        if (isCensored && !isSetScene) {
          debugLogCensorshipAction(false, time, segment, isCensored, action);
          setPlayerCensorshipAction({
            isCensored: isCensored,
            time: time,
            action: TimecodeAction.pause,
            blurPower: blurPower,
            segment: segment,
            player: player,
          });
          handleObsClientError();
          return;
        }
      } catch (error) {
        if (config.debug) {
          console.error(`catch ${action}: `, error);
        }
        handleObsClientError();
        if (isCensored) {
          debugLogCensorshipAction(false, time, segment, isCensored, action);
          setPlayerCensorshipAction({
            isCensored: isCensored,
            time: time,
            action: TimecodeAction.pause,
            blurPower: blurPower,
            segment: segment,
            player: player,
          });
          return;
        }
      }
      break;
    default:
      break;
  }

  debugLogCensorshipAction(true, time, segment, isCensored, action);
};

/**
 * Logs information about the censorship action for debugging.
 * @param ok Indicates whether the action was successful.
 * @param time Current time in the player.
 * @param segment Timecode segment to which the action is applied.
 * @param isCensored Indicates whether censorship was applied.
 * @param action Action type.
 */
function debugLogCensorshipAction(
  ok: boolean = true,
  time: number,
  segment: TSegment,
  isCensored: boolean,
  action: TimecodeAction | null
) {
  if (!config.debug) return;
  const tl = secondsToTime(time);
  const st = secondsToTime(isCensored ? segment.start_time : segment.end_time);
  let msg = `Censorship Action: ${action} | Time: ${tl} (${st}) | Censored: ${isCensored} | Segment ID: ${segment.id}`;
  ok ? console.log(msg) : console.error(msg);
};

const setPlayerBlur = (
  isCensored: boolean,
  blurPower: BlurPower | null,
  player: HTMLIFrameElement
) => {
  const blurClasses: Record<BlurPower, string> = {
    [BlurPower.light]: "mt-player-blur-light",
    [BlurPower.strong]: "mt-player-blur-strong",
    [BlurPower.max]: "mt-player-blur-max",
    [BlurPower.base]: "mt-player-blur-base",
  };
  const cn =
    blurPower != null ? blurClasses[blurPower] : blurClasses[BlurPower.base];

  player.classList.toggle(cn, isCensored);
};
