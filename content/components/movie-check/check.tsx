import { TImdbContentRating, TMovieCheck, TMovieCompany, TMovieSearchItem } from "@/types/movie";
import { useEffect, useState } from "preact/hooks";
import config from "config";
import { fetchBackground } from "@/utils/fetch";
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ImdbContentRatingId } from "@/enums/imdb";

type RootProps = {
    movie: TMovieSearchItem;
    onLoading: (b: boolean) => void;
    onError: (msg: string) => void;
};

export default function MovieCheck({ movie, onLoading, onError }: RootProps) {
    const locales = chrome.i18n;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [movieCheck, setMovieCheck] = useState<TMovieCheck | undefined>(undefined);

    /**
     * Initialize movie check data from API.
     * @param movie - movie object
     */
    const initCheck = async (movie: TMovieSearchItem) => {
        if (isLoading) return;
        onLoading(true);
        setIsLoading(true);
        try {
            const url = new URL("/api/v1/movie/check", config.baseUrl);
            if (movie.id !== null) url.searchParams.set("id", String(movie.id));
            else if (movie.tmdb_id !== null) url.searchParams.set("tmdb_id", String(movie.tmdb_id));

            const response: TMovieCheck = await fetchBackground(url.toString()) as TMovieCheck;
            response.success ? setMovieCheck(response) : onError(locales.getMessage("checkFailed"));
        } catch (e) {
            if (config.debug) {
                console.error(e);
            }
            onError(locales.getMessage("unknownErrorHasOccurred"));
        }

        setIsLoading(false);
        onLoading(false);
    };

    // Run initCheck when movie changes.
    useEffect(() => {
        initCheck(movie);
    }, [movie]);

    if (!movieCheck) return <></>;

    return (
        <>
            <div className="mt-movie-header mt-movie-item">
                <img
                    className="mt-poster"
                    src={movie.poster_url || chrome.runtime.getURL("images/not_found_poster.webp")} />
                <div className="mt-info">
                    <span className="mt-title">{movie.title ? movie.title : movie.original_title}</span>
                    {movie.title != null && <h2 className="mt-sub-title">{movie.original_title}</h2>}
                </div>
            </div>
            <div className="mt-check mt-scrollbar">
                <div className="mt-info-grid">
                    <div>{locales.getMessage("releaseDate")}</div>
                    <div {...(movieCheck.release?.hazard == true ? { style: { color: "var(--mt-destructive)" } } : {})}>
                        {movieCheck.release ?
                            format(parseISO(movieCheck.release.release_date), 'd MMMM yyyy', { locale: uk })
                            : 'N/A'
                        }
                    </div>
                    <MovieCompany text={locales.getMessage("production")} companies={movieCheck.productions} />
                    <MovieCompany text={locales.getMessage("distributors")} companies={movieCheck.distributors} />
                </div>
                {movieCheck.imdb?.content_ratings && <div className="mt-border-t">
                    <div className="mt-info-title">Рейтинг контенту IMDB</div>
                    <div className="mt-info-grid">
                        <ContentRating
                            id={movieCheck.imdb.id}
                            contentId={ImdbContentRatingId.nudity}
                            contentRatings={movieCheck.imdb.content_ratings} />
                        <ContentRating
                            id={movieCheck.imdb.id}
                            contentId={ImdbContentRatingId.violence}
                            contentRatings={movieCheck.imdb.content_ratings} />
                        <ContentRating
                            id={movieCheck.imdb.id}
                            contentId={ImdbContentRatingId.profanity}
                            contentRatings={movieCheck.imdb.content_ratings} />
                        <ContentRating
                            id={movieCheck.imdb.id}
                            contentId={ImdbContentRatingId.alcohol}
                            contentRatings={movieCheck.imdb.content_ratings} />
                    </div>
                </div>}
            </div>
        </>
    )
};

/**
 * MovieCompany component
 * Renders a list of companies with hazard coloring.
 * @param text - label for companies
 * @param companies - array of companies
 */
const MovieCompany = ({
    text,
    companies = null
}: {
    text: string,
    companies: TMovieCompany[] | null
}) => {
    return (
        <>
            <div>{text}</div>
            <div>
                {companies != null && companies.length > 0 ? (
                    companies.map((item, index) => {
                        let color: string | undefined;
                        switch (item.hazard_level) {
                            case 1:
                                color = 'purple';
                                break;
                            case 2:
                                color = 'destructive';
                                break;
                            case 3:
                                color = 'yellow';
                                break;
                            default:
                                color = undefined
                                break;
                        }
                        return (
                            <span key={index}>
                                {index > 0 && <>, </>}
                                {color ? (
                                    <span style={{ color: `var(--mt-${color})` }}>{item.name}</span>
                                ) : (
                                    item.name
                                )}
                            </span>
                        );
                    })
                ) : (
                    'N/A'
                )}
            </div>
        </>
    );
};

/**
 * Displays a movie content rating with optional IMDb link and color.
 *
 * @param id IMDb movie ID
 * @param contentId Type of rating
 * @param contentRatings Array of ratings from backend
 * @param isLink Whether to link to IMDb guide
 */
const ContentRating = ({
    id,
    contentId,
    contentRatings,
    isLink = true,
}: {
    id: string
    contentId: ImdbContentRatingId
    contentRatings: TImdbContentRating[]
    isLink?: boolean
}) => {
    let title: string;
    let hash: string;
    switch (contentId) {
        case ImdbContentRatingId.nudity:
            hash = "nudity";
            title = "sexNudity";
            break;
        case ImdbContentRatingId.violence:
            hash = "violence";
            title = "violence";
            break;
        case ImdbContentRatingId.profanity:
            hash = "profanity";
            title = "profanity";
            break;
        case ImdbContentRatingId.alcohol:
            hash = "alcohol";
            title = "alcoholDrugsSmoking";
            break;
        default:
            return <></>;
    }

    const locales = chrome.i18n;
    let url: string | undefined = isLink ? `https://www.imdb.com/title/${id}/parentalguide/#${hash}` : undefined;
    let color: string | undefined = undefined;
    let level: string | undefined;

    const contentRating: TImdbContentRating | undefined = contentRatings.find(item => contentId == item.content_id);

    if (contentRating != null) {
        switch (contentRating.level) {
            case 0:
                url = undefined;
                level = "none";
                break;
            case 1:
                level = "mild";
                color = 'grean';
                break;
            case 2:
                level = "moderate";
                color = 'yellow';
                break;
            case 3:
                level = "severe";
                color = 'destructive';
                break;
        }
    }

    const style = { style: { color: `var(--mt-${color})` } };

    return (
        <>
            <div>{locales.getMessage(title)}</div>
            <div {...(level && !url && color ? style : {})}>
                {!level && <>N/A</>}
                {level && !url && locales.getMessage(level)}
                {level && url && <a href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...(color ? style : {})}>{locales.getMessage(level)}</a>}
            </div>
        </>
    );
};