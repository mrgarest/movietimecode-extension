import { BlurPower, TimecodeAction } from "@/enums/timecode";

export type TSettingsOBSClientNull = TSettingsOBSClient | null;

export type TSettings = {
  token?: string;
  timeBuffer?: number;
  blurPower?: BlurPower;
  nudity?: TimecodeAction;
  obsClient?: TSettingsOBSClientNull;
  obsCensorScene?: string | null;
};

export type TSettingsOBSClient = {
  type: string;
  host: string;
  port: number;
  auth: string;
};
