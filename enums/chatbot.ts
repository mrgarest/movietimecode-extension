export enum ChatbotAction {
  stop = "stop",
  pause = "pause",
  play = "play",
  mute = "mute",
  unmute = "unmute",
  blur = "blur",
  unblur = "unblur",
  showPlayer = "show_player",
  hidePlayer = "hide_player",
  fastForwardRewind = "fast_forward_rewind",
  currentMovieTime = "current_movie_time",
  movieTitle = "movie_title",
}

export enum ChatbotAccess {
  users = "users",
  vip = "vip",
  moderators = "moderators",
  onlyMe = "only_me",
}