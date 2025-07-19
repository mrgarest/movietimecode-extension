import { fetchSearchMovie } from "@/utils/fetch";
import config from "config";
import { useEffect, useState } from "react";
import { TMovieSearch, TMovieSearchItem } from "@/types/movie";
import { logOut } from "@/utils/auth";

type RootProps = {
    query: string;
    year?: number | null;
    onSelected: (item: TMovieSearchItem) => void;
    onMessage: (msg: string) => void;
    onHideContent: (b: boolean) => void;
    onLoading: (b: boolean) => void;
};

export default function SearchMovie({ query, year = null, onSelected, onMessage, onHideContent, onLoading }: RootProps) {
    const [page, setPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEnabledSearch, setEnabledSearch] = useState<boolean>(true);
    const [movies, setMovies] = useState<TMovieSearchItem[]>([]);

    /**
     * Searches for movies on the server.
     * Adds new results to the movie list. If only one movie is found on the first page, it selects it immediately.
     * If there are no results, a message is displayed.
     * @param query
     * @param page
     * @param year
     */
    const searchMovie = async (query: string, page: number, year: number | null) => {
        if (!isEnabledSearch || isLoading) return;
        setIsLoading(true);
        try {
            const response: TMovieSearch = await fetchSearchMovie(query, page, year);

            if (response.success) {
                if (response.items !== null && response.items.length > 0) {
                    if (page === 1 && response.items.length === 1) {
                        onSelected(response.items[0]);
                        return;
                    }
                    setMovies(prev => [...prev, ...response.items || []]);
                    setPage(prev => prev + 1);
                    setIsLoading(false);
                    return;
                } else if (page === 1) {
                    onMessage("Фільм не знайдено 😢")
                }
            } else switch (response.error?.code) {
                case 'ACCESS_TOKEN_INVALID':
                case 'USER_NOT_FOUND':
                    await logOut();
                    onMessage("Помилка доступу. Спробуйте ще раз");
                    break;
                case 'USER_DEACTIVATED':
                    onMessage("Користувач деактивований");
                    break;
                default:
                    onMessage("Сталася невідома помилка");
            }
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
        }

        setEnabledSearch(false);
        setIsLoading(false);
    };

    // Initializing the search
    useEffect(() => {
        const init = async () => {
            onLoading(true);
            onHideContent(true);
            await searchMovie(query, page, year);
            onHideContent(false);
            onLoading(false);
        };
        setMovies([]);
        setPage(1);
        setEnabledSearch(true);

        init();
    }, [query]);

    // Adds a scroll handler to load new movies when reaching the bottom of the page.
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 150 &&
                isEnabledSearch &&
                !isLoading
            ) {
                searchMovie(query, page, year);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [query, page, isEnabledSearch, isLoading]);

    return (
        <>
            <h1 className="text-2xl text-foreground font-bold">Виберіть фільм</h1>
            <div className="space-y-1">
                {movies.map((item, index) => <div
                    key={index}
                    onClick={() => onSelected(item)}
                    className="flex items-center gap-3 rounded-md p-2 cursor-pointer hover:bg-secondary duration-300 select-none">
                    <img
                        className="w-12 rounded-md pointer-events-none"
                        src={item.poster_url || chrome.runtime.getURL("images/not_found_poster.webp")} />
                    <div className="space-y-1">
                        <div>
                            <span className="text-sm font-semibold">{item.title ? item.title : item.original_title}</span> <span className="text-xs text-muted">({item.release_year})</span>
                        </div>
                        {item.title != null && <h2 className="text-sm text-muted font-medium">{item.original_title}</h2>}
                    </div>
                </div>)}
            </div>
        </>
    );
}