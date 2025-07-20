import { TTimecodeSearch, TTimecode } from "@/types/timecode";
import { Button } from "./ui/button";
import { useState } from 'preact/hooks';
import { Circle, CircleCheck } from "lucide-react";
import { removeDialog, renderDialog } from "@/utils/dialog";
import { secondsToTime } from "@/utils/format";
import i18n from "@/lib/i18n";

type RootProps = {
    data: TTimecodeSearch;
    onSelected: (timecode: TTimecode) => void
};


const MovieDialog = ({ data, onSelected }: RootProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [timecode, setTimecode] = useState<TTimecode | null>(data.timecodes?.[selectedIndex] || null);

    /**
    * Selects a timecode item and updates the selected index.
    * @param index - index of selected item
    * @param timecode - selected timecode
    */
    const handleItemSelected = (index: number, timecode: TTimecode) => {
        setSelectedIndex(index);
        setTimecode(timecode);
    };

    /**
     * Applies the selected timecode and closes the dialog.
     */
    const handleApply = () => {
        if (timecode == null) {
            return;
        }
        remove();
        onSelected(timecode);
    };

    return (
        <div className="mt-dialog-container mt-dialog-movie">
            <img className="mt-poster" src={data.poster_url || chrome.runtime.getURL("images/not_found_poster.webp")} />
            <div className="mt-content">
                <div className="mt-details"><div>
                    <div className="mt-title">{data.title || data.original_title}</div>
                    <div className="mt-origin-title">{data.title != null ? data.original_title + " " : ""}({data.release_year})</div>
                </div>
                    <div>
                        <div className="mt-label">Виберіть таймкоди</div>
                        <div className="mt-select">
                            {data.timecodes?.map((item, index) =>
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
                                        <span>{item.segment_count}</span>
                                        <span className="mt-select-itme-separator">|</span>
                                        <span>{secondsToTime(item.duration)}</span>
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
        </div>
    )
};


let container: HTMLDivElement;
export const renderMovieDialog = (props: RootProps) => renderDialog("movie", <MovieDialog {...props} />, (e) => container = e);

const remove = () => {
    if (!container) return;
    removeDialog(container);
};