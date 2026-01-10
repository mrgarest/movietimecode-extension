import { ChatbotAccess, ChatbotAction } from "@/enums/chatbot";
import { BlurPower, TimecodeAction } from "@/enums/timecode";
import { ChatbotCmmand } from "@/interfaces/chatbot";

export const StorageDefault = {
  isCensorship: true,
  timeBuffer: 0,
  blurPower: BlurPower.base,
  nudity: TimecodeAction.blur,
  sexualContentWithoutNudity: TimecodeAction.blur,
  violence: TimecodeAction.blur,
  sensitiveExpressions: TimecodeAction.mute,
  playerContentCensorshipCommand: TimecodeAction.blur,
  obsClient: null,
  obsCensorScene: null,
  chatbotEnabled: false,
  chatbotConnectStreamLive: true,
  chatbotCommands: [
    {
      enabled: true,
      command: "!mtstop",
      action: ChatbotAction.stop,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!pause",
      action: ChatbotAction.pause,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!play",
      action: ChatbotAction.play,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!mute",
      action: ChatbotAction.mute,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!blur",
      action: ChatbotAction.blur,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!unblur",
      action: ChatbotAction.unblur,
      access: ChatbotAccess.onlyMe,
    },
    {
      enabled: true,
      command: "!movietitle",
      action: ChatbotAction.movieTitle,
      access: ChatbotAccess.users,
    },
    {
      enabled: true,
      command: "!movietime",
      action: ChatbotAction.currentMovieTime,
      access: ChatbotAccess.users,
    },
  ] as ChatbotCmmand[],
};
