import { MovieCard } from "@/interfaces/movie";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from 'embla-carousel-autoplay'
import { Skeleton } from "../ui/skeleton";

interface RootProps {
    isLoading?: boolean
    loop?: boolean
    autoplay?: boolean
    title: string
    movies: MovieCard[]
};

export default function MovieLatestCarousel({ isLoading = false, loop = false, autoplay = false, title, movies }: RootProps) {
    const { t } = useTranslation();
    const [emblaRef] = useEmblaCarousel(
        {
            loop: loop,
            align: 'start',
            dragFree: false
        },
        autoplay ? [Autoplay({ delay: 3000, stopOnInteraction: false })] : []
    );

    return (
        <div className="w-full mx-auto max-w-6xl">
            <div className="text-xl sm:text-3xl font-bold mb-6 px-4">{title}</div>

            <div className="relative w-full z-0">
                <div className="absolute left-0 top-0 bottom-0 w-5 z-1 pointer-events-none bg-gradient-to-r from-background to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-5 z-1 pointer-events-none bg-gradient-to-l from-background to-transparent" />
                <div className="overflow-hidden relative" ref={emblaRef}>
                    <div className="flex touch-pan-y">
                        {isLoading && Array.from({ length: 10 }).map((_, index) =>
                            <div key={index} className="flex-[0_0_200px] min-w-0 pl-4 space-y-3">
                                <Skeleton className="aspect-2/3 w-full rounded-xl" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        )}
                        {!isLoading && movies.map((movie, index) => (
                            <div
                                key={index}
                                className="flex-[0_0_200px] min-w-0 pl-4 select-none">
                                <Link to={`/movies/${movie.tmdb_id}`} className="group block space-y-3 cursor-pointer">
                                    <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-border">
                                        <img
                                            src={movie.poster_url || "/images/not_found_poster.webp"}
                                            alt={movie.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        {movie.release_year && <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">
                                            {movie.release_year}
                                        </div>}
                                    </div>
                                    <h3 className="text-sm text-foreground font-medium leading-tight truncate group-hover:text-foreground/70 transition-colors">{movie.title}</h3>
                                </Link>
                            </div>
                        ))}

                        {movies.length === 0 && <div className="w-full text-center py-10 text-muted-foreground">{t('moviesNotFound')}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};