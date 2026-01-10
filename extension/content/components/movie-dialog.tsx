import { TimecodeAuthor, TimecodeAuthorsResponse, TimecodeResponse, TimecodeSegment } from "@/interfaces/timecode";
import { Button } from "./ui/button";
import { useEffect, useState } from 'preact/hooks';
import { Circle, CircleCheck } from "lucide-react";
import { removeDialog, renderDialog } from "@/utils/dialog";
import { secondsToTime } from "@/utils/format";
import i18n from "@/lib/i18n";
import config from "@/config.json";
import { fetchBackground } from "@/utils/fetch";
import { MovieSearchTimecodesResponse } from "@/interfaces/movie";
import { LoadingSpinner } from "./ui/loading";
import { ServerResponse } from "@/interfaces/response";

interface RootProps {
    data: MovieSearchTimecodesResponse;
    onSelected: (segment: TimecodeSegment[] | undefined) => void
};

const MovieDialog = ({ data, onSelected }: RootProps) => {
    const [isLoading, setLoading] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [author, setAuthor] = useState<TimecodeAuthor | null>(null);
    const [authors, setAuthors] = useState<TimecodeAuthor[] | null>([]);

    useEffect(() => {
        // Fetch authors when the component is mounted
        const getAuthors = async () => {
            setLoading(true);
            try {
                const response = await fetchBackground<TimecodeAuthorsResponse>(
                    `${config.baseUrl}/api/v2/movies/${data.id}/timecodes/authors`
                );
                if (response.success) {
                    setAuthors(response.authors || []);

                    // Set the first author as selected by default
                    if (!author && response.authors && response.authors.length > 0) {
                        setAuthor(response.authors[0]);
                        setSelectedIndex(0);
                    }
                }
            } catch (e) {
                if (config.debug) {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };
        getAuthors();
    }, []);

    /**
    * Selects a timecode item and updates the selected index.
    * @param index - index of selected item
    * @param author - selected timecode author
    */
    const handleItemSelected = (index: number, author: TimecodeAuthor) => {
        setSelectedIndex(index);
        setAuthor(author);
    };

    /**
     * Applies the selected timecodes and closes the dialog.
     */
    async function handleApply() {
        if (!author) {
            return;
        }
        if (author.timecode.segment_count === 0) {
            handleTimecodeUsedAnalytics(author.timecode.id);
            onSelected([]);
            remove();
            return;
        }
        setLoading(true);

        try {
            const data = await fetchBackground<TimecodeResponse>(
                `${config.baseUrl}/api/v2/timecodes/${author.timecode.id}`
            );
            if (data.success) handleTimecodeUsedAnalytics(author.timecode.id);
            onSelected(data.success ? (data.segments ?? []) : undefined);
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
            onSelected(undefined);
        }
        setLoading(false);
        remove();
    };

    /**
     * Sends a request to increase the timecode usage counter.
     * @param id Timecode id.
     * 
     * @deprecated 
     */
    async function handleTimecodeUsedAnalytics(
        id: number
    ) {
        try {
            await fetchBackground<ServerResponse>(`${config.baseUrl}/api/v1/timecode/${id}/analytics/used`, { method: "POST" });
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
        }
    }

    return (
        <div className="mt-dialog-container mt-dialog-movie">
            <img className="mt-poster" src={data.poster_url || chrome.runtime.getURL("images/not_found_poster.webp")} />
            <div className="mt-content">
                <div className="mt-details"><div>
                    <div className="mt-title">{data.title || data.original_title}</div>
                    <div className="mt-origin-title">{data.title != null ? data.original_title + " " : ""}({data.release_year})</div>
                </div>
                    <div>
                        <div className="mt-label">{i18n.t('selectTimecodes')}</div>
                        <div className="mt-select">
                            {authors?.map((item, index) =>
                                <div
                                    key={index}
                                    className="mt-select-itmes"
                                    onClick={() => handleItemSelected(index, item)}>
                                    <div className="mt-select-itme-left">
                                        {selectedIndex == index
                                            ? <CircleCheck size={13} strokeWidth={3} color="var(--mt-grean)" />
                                            : <Circle size={13} strokeWidth={3} color="oklch(0.76 0 0)" />
                                        }
                                        <span className="mt-select-itme-name">{item.user?.username || 'Невідомий'}</span>
                                    </div>
                                    <div className="mt-select-itme-right">
                                        <span>{item.timecode.segment_count}</span>
                                        <span className="mt-select-itme-separator">|</span>
                                        <span>{secondsToTime(item.timecode.duration)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-buttons">
                    <Button
                        style="outline"
                        text={i18n.t("cancel")}
                        onClick={remove}
                    />
                    <Button
                        text={i18n.t("apply")}
                        onClick={handleApply}
                    />
                </div>
            </div>
            <LoadingSpinner isLoading={isLoading} dark={true} />
        </div>
    )
};


let container: HTMLDivElement;
export const renderMovieDialog = (props: RootProps) => renderDialog("movie", <MovieDialog {...props} />, (e) => container = e);

const remove = () => {
    if (!container) return;
    removeDialog(container);
};