import { TResponse } from "./response";

export type TTimecodeSearch = TResponse & {
  id: number;
  title: string | null;
  original_title: string;
  release_year: number | null;
  poster_url: string | null;
  like_count: number;
  dislike_count: number;
  used_count: number;
  timecodes: TTimecode[] | null;
};

export type TTimecode = {
  id: number;
  user?: TTimecodeUser | null;
  duration: number;
  like_count: number;
  dislike_count: number;
  used_count: number;
  segment_count: number;
};

export type TTimecodeUser = {
  id: number;
  username: string;
};

export type TSegment = {
  id: number;
  tag_id: number;
  action_id: number | null;
  start_time: number;
  end_time: number;
  description?: string | null;
};
