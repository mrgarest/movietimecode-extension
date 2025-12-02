import { BlurPower, TimecodeAction } from "@/enums/timecode";
import { TChatbotCmmand } from "./chatbot";

export type TSettingsOBSClientNull = TSettingsOBSClient | null;

export type TSettings = {
  token?: string;
  timeBuffer?: number;
  blurPower?: BlurPower;
  nudity?: TimecodeAction;
  sexualContentWithoutNudity?: TimecodeAction;
  violence?: TimecodeAction;
  sensitiveExpressions?: TimecodeAction;
  obsClient?: TSettingsOBSClientNull;
  obsCensorScene?: string | null;
  playerContentCensorshipCommand?: TimecodeAction;
  chatbotEnabled?: boolean;
  chatbotConnectStreamLive?: boolean;
  chatbotCommands?: TChatbotCmmand[];
};

export type TSettingsOBSClient = {
  type: string;
  host: string;
  port: number;
  auth: string;
};
