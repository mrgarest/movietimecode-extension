import { BlurPower, TimecodeAction, TimecodeTag } from "@/enums/timecode";
import { TSegment } from "@/types/timecode";
import { StorageDefault } from "@/utils/storage-options";
import { render } from "preact";
import config from "config";
import { ControlBar } from "./components/control-bar";
import { TSettings, TSettingsOBSClientNull } from "@/types/storage";
import { waitForDOMContentLoaded, waitForElement } from "@/utils/page";
import OBSClient, { OBSType, TScene } from "@/lib/obs-client";
import { renderQuestionDialog } from "./components/question-dialog";
import i18n from "@/lib/i18n";
import { playAlerSound } from "@/utils/alert";
import { censorshipActionLog } from "@/utils/log";

let isHotkeyPressed: boolean = false;
let isMessageListener: boolean = false;
let isCensorshipEnabled: boolean = false;
let settings: TSettings;
let nudity: TimecodeAction;
let violence: TimecodeAction;
let sensitiveExpressions: TimecodeAction;

let neededOBSClient: boolean = false;
let obsClient: OBSClient | null = null;
let mainSceneOBS: TScene | null;
let obsCensorScene: TScene | null;

type Thtml = HTMLIFrameElement | undefined;
let player: Thtml = undefined;

let timecodeSegments: TSegment[] | null = null;
let activeCensorshipActions: TSegment[] = [];

const playerContentCensorshipEnabled: { blur: boolean; hide: boolean; obsSceneChange: boolean } = {
    blur: false,
    hide: false,
    obsSceneChange: false,
};

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key != "settings") continue;
        settings = handleSettings(newValue, true);
    }
});

/**
 * Processes settings received from storage and updates corresponding variables.
 * @param settings Settings object received from storage.
 * @param isOnChanged Indicates if the function was called due to a settings change.
 * @returns Updated settings object.
 */
const handleSettings = (settings: TSettings, isOnChanged: boolean) => {
    nudity = (settings.nudity as TimecodeAction) || StorageDefault.nudity;
    violence = (settings.violence as TimecodeAction) || StorageDefault.violence;
    sensitiveExpressions = (settings.sensitiveExpressions as TimecodeAction) || StorageDefault.sensitiveExpressions;

    neededOBSClient = [nudity, violence, sensitiveExpressions].includes(TimecodeAction.obsSceneChange);

    if (!neededOBSClient && obsClient) {
        obsClient.disconnect();
        obsClient = null;
    } else if (isCensorshipEnabled && neededOBSClient && !obsClient) {
        connectOBS();
    }
    return settings;
};

/**
 * Determines the player and movie title based on the site domain.
 */
const uakino = {
    getPlayer: async (): Promise<HTMLIFrameElement | undefined> => {
        if (document.querySelector<HTMLDivElement>(".movie-right .players-section .playlists-ajax") == undefined) {
            return document.querySelector<HTMLIFrameElement>('.movie-right .players-section iframe#pre') || undefined;
        }
        try {
            return await waitForElement<HTMLIFrameElement>('.movie-right .players-section .playlists-ajax iframe#playerfr');
        } catch (e) {
            return undefined;
        }
    },
    getContainerForControlBar: (): HTMLDivElement | undefined =>
        document.querySelector<HTMLDivElement>(".movie-right .players-section .box.full-text.visible") || undefined,
    getTitle: (): string | null =>
        document.querySelector(".alltitle .origintitle i")?.textContent?.trim() ?? null,
    getYear: (): number | null => {
        const match = document.body.innerHTML.match(/:\/\/[a-z0-9.-]+\.[a-z0-9]+\/find\/year\/(\d+)\//i);
        const year = match?.[1] ? parseInt(match[1], 10) : null;
        return Number.isNaN(year) ? null : year;
    }
};

const playerMap: Record<
    string,
    {
        getPlayer: () => Promise<Thtml>;
        getContainerForControlBar: () => HTMLDivElement | undefined;
        getTitle: () => string | null;
        getYear: () => number | null;
    }
> = {
    "uakino.me": uakino, // old
    "uakino.best": uakino
};

/**
 * Adds styles to the <head> of the document.
 */
const setHeadrStyles = () => {
    const fontLink = document.createElement("link");
    fontLink.href =
        "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
};

(async () => {
    await waitForDOMContentLoaded();
    const hostname = window.location.hostname;
    const site = playerMap[hostname];
    if (!site) {
        if (config.debug) {
            console.warn(`The website ${hostname} is not supported.`);
        }
        return;
    }

    player = await site.getPlayer();
    if (!player && config.debug) {
        console.error("Could not find player");
    }
    const containerForControlBar = site.getContainerForControlBar();

    let movieTitle: string | null = site.getTitle();

    if (!player || !movieTitle || !containerForControlBar) return;

    /********************** SETTINGS START **********************/
    const storage = await chrome.storage.sync.get("settings");

    settings = handleSettings(storage.settings || {}, false);

    /********************** SETTINGS END **********************/
    setHeadrStyles();

    const rootControlBar = document.createElement("div");
    containerForControlBar.after(rootControlBar);

    render(<ControlBar
        player={player}
        movie={{
            title: movieTitle,
            year: site.getYear()
        }}
        onCensorship={handleCensorship}
        onTurnOffCensorship={handleTurnOffCensorship}
    />, rootControlBar);
})();


/**
 * Handles the censorship logic by setting up the player listener and updating the timecode segments.
 *
 * @param segments
 */
function handleCensorship(segments: TSegment[] | null) {
    if (!isMessageListener) {
        window.addEventListener("message", handleMessage);
        isMessageListener = true;
    }
    timecodeSegments = segments;
    isCensorshipEnabled = true;

    if (neededOBSClient) {
        connectOBS();
    }
}

/**
 * Handles turning off censorship by removing the player listener and resetting the timecode segments and active censorship actions.
 */
function handleTurnOffCensorship() {
    if (isMessageListener) {
        window.removeEventListener("message", handleMessage);
        isMessageListener = false;
    }
    isCensorshipEnabled = false;
    timecodeSegments = null;
    activeCensorshipActions = [];

    obsClient?.disconnect();
}

/**
 * Handles messages from the window.
 * @param e Message event object (MessageEvent).
 */
function handleMessage(e: MessageEvent) {
    if (e.data.event === undefined) return;
    switch (e.data.event) {
        case "time":
            handleTimePlayer(parseInt(e.data.time || "0"));
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
}

/**
 * Handles player time
 */
function handleTimePlayer(time: number) {
    if (!player || !isCensorshipEnabled || timecodeSegments == null) return;

    const timeBuffer: number = (settings.timeBuffer as number) || StorageDefault.timeBuffer;

    const segments: TSegment[] = timecodeSegments.filter(
        (segment) =>
            time >= segment.start_time - timeBuffer &&
            time < segment.end_time + timeBuffer
    );

    const isTimecode: boolean = segments.length > 0;

    if (isTimecode) {
        segments.forEach((segment) => {
            if (!activeCensorshipActions.some((e) => e.id == segment.id)) {
                activeCensorshipActions.push(segment);
                setPlayerCensorshipAction({
                    isCensored: true,
                    time: time,
                    action: getActionForTag(segment.tag_id),
                    segment: segment,
                });
            }
        });
    }

    activeCensorshipActions
        .filter((f) => !segments.some((segment) => segment.id === f.id))
        .forEach((segment) => {
            setPlayerCensorshipAction({
                isCensored: false,
                time: time,
                action: getActionForTag(segment.tag_id),
                segment: segment,
            });

            activeCensorshipActions = activeCensorshipActions.filter(
                (item) => item.id !== segment.id
            );
        });
}

/**
 * Determines the censorship action based on the provided timecode tag.
 * @param tag Timecode tag (of type TimecodeTag).
 * @returns Corresponding censorship action (of type TimecodeAction) or null if the tag is not supported.
 */
const getActionForTag = (tag: TimecodeTag): TimecodeAction | null => {
    switch (tag) {
        case TimecodeTag.NUDITY:
            return nudity;
        case TimecodeTag.VIOLENCE:
            return violence;
        case TimecodeTag.SENSITIVE_EXPRESSIONS:
            return sensitiveExpressions;
        default:
            return null;
    }
};

/**
 * Establishes a connection to the OBS client, if possible
 */
async function connectOBS() {
    const obsClientSettings: TSettingsOBSClientNull = (settings.obsClient as TSettingsOBSClientNull) || StorageDefault.obsClient;
    const obsCensorSceneNmae: string | null = (settings.obsCensorScene as string | null) || StorageDefault.obsCensorScene;

    try {
        if (!obsCensorSceneNmae) {
            throw new Error("Scene not specified");
        }

        if (!obsClientSettings?.type
            || !obsClientSettings?.host
            || !obsClientSettings?.port
            || !obsClientSettings?.auth) {
            throw new Error("Missing connection data");
        }

        obsClient?.disconnect();
        obsClient = new OBSClient({
            type: obsClientSettings.type,
            host: obsClientSettings.host,
            port: obsClientSettings.port,
            auth: obsClientSettings.auth
        });
        const isConnectedObsClient = await obsClient.connect();
        if (!isConnectedObsClient) {
            throw new Error("Failed to connect to OBS Client");
        }
        const scene = await obsClient.findScene(obsCensorSceneNmae);
        if (!scene) {
            throw new Error("Could not find the scene");
        }
        obsCensorScene = scene;
    } catch (e) {
        obsClient?.disconnect();
        obsClient = null;
        obsCensorScene = null;
        handleObsClientError();
        if (config.debug) {
            console.error(e);
        }
    }
};

/**
 * Handles OBS client connection errors by displaying a dialog.
 */
function handleObsClientError() {
    const obsCensorSceneNmae: string | null = (settings.obsCensorScene as string | null) || StorageDefault.obsCensorScene;

    let obsName: string;
    switch (obsCensorSceneNmae) {
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
 * Performs a censorship action for the player depending on the action type.
 * @param isCensored Indicates whether to apply censorship.
 * @param time Current time in the player.
 * @param action Action type.
 * @param segment Timecode segment to which the action is applied.
 */
async function setPlayerCensorshipAction({
    isCensored,
    time,
    action,
    segment,
}: {
    isCensored: boolean;
    time: number,
    action: TimecodeAction | null;
    segment: TSegment;
}) {
    if (!player) return;

    switch (action) {
        case TimecodeAction.blur:
            if (playerContentCensorshipEnabled.blur) return;
            setPlayerBlur(isCensored);
            break;
        case TimecodeAction.hide:
            if (playerContentCensorshipEnabled.hide) return;
            player.classList.toggle("mt-opacity-0", isCensored);
            break;
        case TimecodeAction.mute:
            player.contentWindow?.postMessage({ api: isCensored ? "mute" : "unmute" }, "*");
            break;
        case TimecodeAction.pause:
            if (!isCensored) break;
            player.contentWindow?.postMessage({ api: "pause" }, "*");
            playAlerSound();
            break;
        case TimecodeAction.skip:
            if (isCensored && segment.end_time)
                player.contentWindow?.postMessage({ api: "seek", set: segment.end_time + 1 }, "*");
            break;
        case TimecodeAction.obsSceneChange:
            if (playerContentCensorshipEnabled.obsSceneChange) return;
            try {
                if (obsClient && isCensored) {
                    mainSceneOBS = await obsClient.getActiveScene();
                }

                if (
                    !obsClient ||
                    !obsCensorScene ||
                    (!isCensored && !mainSceneOBS?.id)
                ) {
                    censorshipActionLog({
                        error: true,
                        isCensored,
                        time,
                        segment,
                        action,
                    });
                    setPlayerCensorshipAction({
                        isCensored: isCensored,
                        time: time,
                        action: TimecodeAction.pause,
                        segment: segment,
                    });
                    handleObsClientError();
                    return;
                }

                let isSetScene = await obsClient.setActiveScene(
                    isCensored ? obsCensorScene : mainSceneOBS!
                );

                if (isCensored && !isSetScene) {
                    censorshipActionLog({
                        error: true,
                        isCensored,
                        time,
                        segment,
                        action,
                    });
                    setPlayerCensorshipAction({
                        isCensored: isCensored,
                        time: time,
                        action: TimecodeAction.pause,
                        segment: segment,
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
                    censorshipActionLog({
                        error: true,
                        isCensored,
                        time,
                        segment,
                        action,
                    });
                    setPlayerCensorshipAction({
                        isCensored: isCensored,
                        time: time,
                        action: TimecodeAction.pause,
                        segment: segment,
                    });
                    return;
                }
            }
            break;
        default:
            break;
    }

    censorshipActionLog({
        isCensored,
        time,
        segment,
        action,
    });
};

/**
 * Sets blur on the player
 * @param enabled enable or disable blur
 */
function setPlayerBlur(
    enabled: boolean
) {
    if (!player) return;
    const blurPower: BlurPower = (settings.blurPower as BlurPower) || StorageDefault.blurPower;

    const blurClasses: Record<BlurPower, string> = {
        [BlurPower.light]: "mt-player-blur-light",
        [BlurPower.strong]: "mt-player-blur-strong",
        [BlurPower.max]: "mt-player-blur-max",
        [BlurPower.base]: "mt-player-blur-base",
    };
    const cn =
        blurPower != null ? blurClasses[blurPower] : blurClasses[BlurPower.base];

    player.classList.toggle(cn, enabled);
};

/**
 * Gets a message from the background.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "command") return;
    heandleHotkey(message.command);
});

/**
 * Handling hotkeys.
 */
async function heandleHotkey(command: string) {
    if (!player || command !== "censoring-player-content") return;
    const playerContentCensorshipCommand = (settings.playerContentCensorshipCommand as TimecodeAction) || StorageDefault.playerContentCensorshipCommand;
    isHotkeyPressed = true;
    switch (playerContentCensorshipCommand) {
        case TimecodeAction.blur:
            playerContentCensorshipEnabled.blur = [
                "light",
                "strong",
                "max",
                "base"
            ].some(cls => player!.classList.contains("mt-player-blur-" + cls)) ? false : !playerContentCensorshipEnabled.blur;
            setPlayerBlur(playerContentCensorshipEnabled.blur);
            break;
        case TimecodeAction.hide:
            playerContentCensorshipEnabled.hide = player.classList.contains("mt-opacity-0") ? false : !playerContentCensorshipEnabled.hide;
            player.classList.toggle("mt-opacity-0", playerContentCensorshipEnabled.hide);
            break;
        case TimecodeAction.obsSceneChange:
            try {
                if (!obsClient) {
                    await connectOBS();
                }

                if (!obsClient || !obsCensorScene) {
                    player.contentWindow?.postMessage({ api: "pause" }, "*");
                    playerContentCensorshipEnabled.obsSceneChange = false;
                    break;
                }

                const scene = await obsClient.getActiveScene();
                if (!scene) {
                    playerContentCensorshipEnabled.obsSceneChange = false;
                    break;
                }

                if (scene.id !== obsCensorScene.id) {
                    mainSceneOBS = scene;
                    playerContentCensorshipEnabled.obsSceneChange = true;
                    await obsClient.setActiveScene(obsCensorScene);
                    break;
                }

                if (mainSceneOBS && mainSceneOBS.id !== obsCensorScene.id) {
                    await obsClient.setActiveScene(mainSceneOBS);
                    playerContentCensorshipEnabled.obsSceneChange = false;
                    break;
                }
            } catch (error) {
                if (config.debug) {
                    console.error("Hotkey obs error:", error);
                }
            }
            break;
        default:
            break;
    }
    isHotkeyPressed = false;
}