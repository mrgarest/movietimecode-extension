import { TResponse } from "./response";

export type TMovieSearch = TResponse & {
  id: number;
  items: TMovieSearchItem[] | null;
};

export type TMovieSearchItem = {
  id: number | null;
  tmdb_id: number | null;
  title: string | null;
  original_title: string;
  release_year: number | null;
  poster_url: string | null;
};

export type TMovieCheck = TResponse & {
  id: number;
  release: {
    hazard: boolean;
    release_date: string;
  } | null;
  productions: TMovieCompany[] | null;
  distributors: TMovieCompany[] | null;
  imdb: {
    id: string;
    content_ratings: TImdbContentRating[] | null;
  } | null;
};

export type TMovieCompany = {
  id: number;
  hazard_level: number;
  name: string;
};
export type TImdbContentRating = {
  content_id: number;
  level: number;
};
