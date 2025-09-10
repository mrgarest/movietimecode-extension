export enum TimecodeTag {
  NUDITY = 100,
  VIOLENCE = 101,
  SENSITIVE_EXPRESSIONS = 102,
}

export enum TimecodeAction {
  noAction = 100,
  blur = 101,
  hide = 102,
  skip = 103,
  mute = 104,
  pause = 105,
  obsSceneChange = 106,
}

export enum BlurPower {
  light = "light",
  base = "base",
  strong = "strong",
  max = "max",
}
