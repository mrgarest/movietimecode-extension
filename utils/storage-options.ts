import { BlurPower, TimecodeAction } from "@/enums/timecode";

export const StorageDefault = {
  isCensorship: true,
  timeBuffer: 0,
  blurPower: BlurPower.base,
  nudity: TimecodeAction.blur,
  violence: TimecodeAction.blur,
  sensitiveExpressions: TimecodeAction.mute,
  obsClient: null,
  obsCensorScene: "mt-censor",
};
