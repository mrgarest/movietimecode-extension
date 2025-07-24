import { BlurPower, TimecodeAction } from "@/enums/timecode";

export const StorageDefault = {
  isCensorship: true,
  timeBuffer: 0,
  blurPower: BlurPower.base,
  nudity: TimecodeAction.blur,
  obsClient: null,
  obsCensorScene: "mt-censor",
};
