import { BlurPower, TimecodeAction } from "@/enums/timecode";
import { ChatbotCmmand } from "./chatbot";

export type SettingsOBSClientNull = SettingsOBSClient | null;

export interface Settings {
  token?: string;
  timeBuffer?: number;
  blurPower?: BlurPower;
  nudity?: TimecodeAction;
  sexualContentWithoutNudity?: TimecodeAction;
  violence?: TimecodeAction;
  sensitiveExpressions?: TimecodeAction;
  obsClient?: SettingsOBSClientNull;
  obsCensorScene?: string | null;
  playerContentCensorshipCommand?: TimecodeAction;
  chatbotEnabled?: boolean;
  chatbotConnectStreamLive?: boolean;
  chatbotCommands?: ChatbotCmmand[];
};

export interface SettingsOBSClient {
  type: string;
  host: string;
  port: number;
  auth: string;
};
