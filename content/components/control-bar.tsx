import { TSegment, TTimecode, TTimecodeSearch } from "@/types/timecode";
import { useState } from 'preact/hooks';
import { LucideProps, Search, Settings, BadgePlus, ShieldBan, CopyCheck } from "lucide-react";
import { ESearchButtonAction, StatusIndicator } from "@/enums/control-bar";
import { renderMovieDialog } from "./movie-dialog";
import { renderQuestionDialog } from "./question-dialog";
import { fetchBackground } from "@/utils/fetch";
import config from "@/config.json";
import { TUser } from "@/types/user";
import { goToTab, logIn } from "@/utils/navigation";
import { getUser } from "@/utils/auth";
import { renderMovieCheckDialog } from "./movie-check/dialog";
import i18n from "@/lib/i18n";

type RootProps = {
    player: HTMLIFrameElement;
    movie: MovieProps;
    onTurnOffCensorship: () => void
    onCensorship: (segments: TSegment[] | null) => void
};

type MovieProps = {
    title: string;
    year?: number | null;
};

export const ControlBar = ({ player, movie, onTurnOffCensorship, onCensorship }: RootProps) => {
    type TLucideIcon = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

    const [isSearchButtonDisabled, setSearchButtonDisabled] = useState<boolean>(false);
    const [statusIndicator, setStatusIndicator] = useState<StatusIndicator>(StatusIndicator.inactive);

    const [searchButton, setSearchButton] = useState<{
        action: string
        title: string
        icon: TLucideIcon
    }>({
        action: ESearchButtonAction.searchTimecode,
        title: i18n.t('searchTimecode'),
        icon: Search
    });

    /**
     * handles the click event for the search button.
     */
    const handleClickSearch = () => {
        if (isSearchButtonDisabled) return;
        switch (searchButton.action) {
            case ESearchButtonAction.searchTimecode:
                handleSearchTimecode(movie.title);
                break;
            case ESearchButtonAction.turnOffCensorship:
                setStatusIndicator(StatusIndicator.inactive);
                setButtonAction(ESearchButtonAction.searchTimecode);
                onTurnOffCensorship();
                break;
            default:
                break;
        }
    };

    /**
     * handles searching for timecodes for a movie.
     * @param title Movie title.
     */
    async function handleSearchTimecode(
        title: string
    ) {
        setSearchButtonDisabled(true);
        setStatusIndicator(StatusIndicator.loader);

        try {
            const data: TTimecodeSearch = await fetchBackground(
                `${config.baseUrl}/api/v1/timecode/search?q=${encodeURIComponent(title)}`
            ) as TTimecodeSearch;
            if (data.success) renderMovieDialog({
                data: data,
                onSelected: handleGetTimecodeSegments
            }); else if (data?.error?.code == 404) {
                renderQuestionDialog({
                    title: i18n.t("notFound"),
                    description: i18n.t("notFoundTimecodeDescription"),
                    buttons: [
                        {
                            text: i18n.t("addTimecodes"),
                            style: "outline",
                            onClick: handleTimecodeEditor
                        },
                        {
                            text: i18n.t("close"),
                            style: "primary",
                        }
                    ]
                });
            }
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
        }
        setStatusIndicator(StatusIndicator.inactive);
        setSearchButtonDisabled(false);
    }

    /**
     * Loads timecode segments for the selected movie.
     * @param button Button that initiates the search.
     * @param status Status element for displaying the state.
     * @param timecode Timecode object selected by the user.
     */
    async function handleGetTimecodeSegments(
        timecode: TTimecode
    ) {
        setSearchButtonDisabled(true);
        setStatusIndicator(StatusIndicator.loader);

        if (timecode.segment_count == 0) {
            setCensorship(null);
            setSearchButtonDisabled(false);
            handleTimecodeUsedAnalytics(timecode.id);
            return;
        }
        try {
            const data = await fetchBackground(
                `${config.baseUrl}/api/v1/timecode/${timecode.id}/segment`
            );

            if (data.success) {
                setCensorship(data.segments as TSegment[]);
                handleTimecodeUsedAnalytics(timecode.id);
            } else {
                setStatusIndicator(StatusIndicator.inactive);
            }

        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
            setStatusIndicator(StatusIndicator.inactive);
        }
        setSearchButtonDisabled(false);
    }

    /**
     * Sends a request to increase the timecode usage counter.
     * @param id Timecode id.
     */
    async function handleTimecodeUsedAnalytics(
        id: number
    ) {
        try {
            await fetchBackground(`${config.baseUrl}/api/v1/timecode/${id}/analytics/used`, { method: "POST" });
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
        }
    }

    /**
     * Changes the button action and updates its text and icon.
     * @param action New action for the button.
     */
    function setButtonAction(action: ESearchButtonAction) {
        let textKey: string, icon: TLucideIcon;
        switch (action) {
            case ESearchButtonAction.searchTimecode:
                textKey = "searchTimecode";
                icon = Search;
                break;
            case ESearchButtonAction.turnOffCensorship:
                textKey = "turnOffCensorship";
                icon = ShieldBan;
                break;

            default:
                return;
        }
        setSearchButton({
            action: action,
            title: i18n.t(textKey),
            icon: icon
        })
    }

    /**
     * Sets the censorship state for the player.
     * @param button Button that initiates the change.
     * @param status Status element for displaying the state.
     * @param segments List of timecode segments.
     */
    function setCensorship(
        segments: TSegment[] | null
    ) {
        if (player == null) {
            setButtonAction(ESearchButtonAction.searchTimecode);
            setStatusIndicator(StatusIndicator.inactive);
            return;
        }

        setButtonAction(ESearchButtonAction.turnOffCensorship);
        setStatusIndicator(StatusIndicator.active);
        onCensorship(segments);
    }

    /**
     * Opens the timecode editor if the user is authorized.
     * If the user is not authorized, a dialog window appears with a suggestion to log in.
     */
    const handleTimecodeEditor = async () => {
        const user: TUser | undefined = await getUser();

        if (user?.accessToken) {
            const params = new URLSearchParams();
            params.set("q", movie.title);
            if (movie.year != null) {
                params.set("y", String(movie.year));
            }
            goToTab({ to: `/timecode?${params.toString()}` });
            return;
        }
        renderQuestionDialog({
            title: i18n.t("authorizationRequired"),
            description: i18n.t("authorizationRequiredDescription"),
            buttons: [
                {
                    text: i18n.t("close"),
                    style: "outline",
                },
                {
                    text: i18n.t("logIn"),
                    style: "primary",
                    onClick: () => logIn()
                }
            ]
        });
    };

    /**
    * Opens the movie check dialog for the current movie.
    */
    const handleMovieCheck = () => renderMovieCheckDialog({
        title: movie.title,
        year: movie.year
    });

    const iconSize: number = 48;
    return (
        <div data-movietimecode="control-bar" className="mt-control-bar">
            <div className="mt-container">
                <div className={`mt-status mt-${statusIndicator}`}></div>
                <div
                    className={`mt-button mt-primary${isSearchButtonDisabled ? " mt-disabled" : ""}`}
                    onClick={handleClickSearch}>
                    <searchButton.icon size={iconSize} />
                    <span>{searchButton.title}</span>
                </div>
                <div
                    data-mt-tooltip={i18n.t("movieCheck")}
                    className="mt-button mt-icon"
                    onClick={handleMovieCheck}>
                    <CopyCheck size={iconSize} />
                </div>
                <div
                    data-mt-tooltip={i18n.t("addTimecodes")}
                    className="mt-button mt-icon"
                    onClick={handleTimecodeEditor}>
                    <BadgePlus size={iconSize} />
                </div>
                <div
                    data-mt-tooltip={i18n.t("settings")}
                    className="mt-button mt-icon"
                    onClick={() => goToTab({ to: "/settings" })}>
                    <Settings size={iconSize} />
                </div>
            </div>
        </div>
    );
}
