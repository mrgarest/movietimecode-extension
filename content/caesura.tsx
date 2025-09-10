import { BlurPower, TimecodeAction, TimecodeTag } from "@/enums/timecode";
import { TSegment } from "@/types/timecode";
import { removePlayerListener, setOBSClient, setPlayerCensorshipAction, setPlayerListener, setPlayerTimeListener, updatePlayerCensorScene } from "./player";
import { StorageDefault } from "@/utils/storage-options";
import { render } from "preact";
import config from "config";
import { ControlBar } from "./components/control-bar";
import { TSettings, TSettingsOBSClientNull } from "@/types/storage";
import { waitForDOMContentLoaded, waitForElement } from "@/utils/page";

let settings: TSettings;
let timeBuffer: number;
let blurPower: BlurPower;
let nudity: TimecodeAction;
let violence: TimecodeAction;
let sensitiveExpressions: TimecodeAction;
let obsClientSettings: TSettingsOBSClientNull = null;
let obsCensorScene: string;

type Thtml = HTMLIFrameElement | undefined;
let player: Thtml = undefined;
let enableOBSClient: boolean = false;

let timecodeSegments: TSegment[] | null = null;
let activeCensorshipActions: TSegment[] = [];

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
    timeBuffer = (settings.timeBuffer as number) || StorageDefault.timeBuffer;

    blurPower = (settings.blurPower as BlurPower) || StorageDefault.blurPower;

    nudity = (settings.nudity as TimecodeAction) || StorageDefault.nudity;
    violence = (settings.violence as TimecodeAction) || StorageDefault.violence;
    sensitiveExpressions = (settings.sensitiveExpressions as TimecodeAction) || StorageDefault.sensitiveExpressions;

    obsClientSettings =
        (settings.obsClient as TSettingsOBSClientNull) || StorageDefault.obsClient;

    obsCensorScene =
        (settings.obsCensorScene as string) || StorageDefault.obsCensorScene;

    enableOBSClient = [nudity, violence, sensitiveExpressions].includes(TimecodeAction.obsSceneChange);

    if (isOnChanged) {
        updatePlayerCensorScene(obsCensorScene);
        setOBSClient(enableOBSClient, obsClientSettings, obsCensorScene);
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
    setPlayerListener(enableOBSClient, obsClientSettings, obsCensorScene);
    timecodeSegments = segments;
}
/**
 * Handles turning off censorship by removing the player listener and resetting the timecode segments and active censorship actions.
 */
function handleTurnOffCensorship() {
    removePlayerListener();
    timecodeSegments = null;
    activeCensorshipActions = [];
}

setPlayerTimeListener((time) => {
    if (!player || timecodeSegments == null) return;

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
                    blurPower: blurPower,
                    segment: segment,
                    player: player!,
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
                blurPower: blurPower,
                segment: segment,
                player: player!,
            });

            activeCensorshipActions = activeCensorshipActions.filter(
                (item) => item.id !== segment.id
            );
        });
});

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
