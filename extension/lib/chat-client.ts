import config from "config";
import {
  getChannel,
  getDisplayName,
  getId,
  getMessage,
  getRoomId,
  getTmiSentTimestamp,
  getUserId,
  isMod,
  isVip,
} from "./irc";

interface Options {
  username: string;
  accessToken: string;
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  channel: {
    id?: number;
    username: string;
  };
  user: {
    id?: number;
    username: string;
    mod?: boolean;
    vip?: boolean;
  };
  message: string | null;
};

export default class ChatClient {
  private options: Options;
  private timeout: number = 5000;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;

  private onErrorListener?: (msg: any) => void;
  private onCloseListener?: () => void;
  private onMessageListener?: (msg: ChatMessage) => void;

  /**
   * Initializes an Twitch chat instance with the given options.
   * @param options Settings for connecting to Twitch.
   */
  constructor(options: Options) {
    this.options = options;
  }

  /**
   * Connects to Twitch chat via WebSocket.
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.isConnected) return;
        this.isConnected = false;
        if (this.onErrorListener != null) this.onErrorListener("timeout");
        resolve(false);
        this.disconnect();
      }, this.timeout);

      this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

      this.ws.onopen = () => {
        if (!this.ws) return;
        if (config.debug) {
          console.log("[ChatClient] WebSocket Open");
        }
        this.ws.send(
          "CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands"
        );

        this.ws.send(`PASS oauth:${this.options.accessToken}`);
        this.ws.send(`NICK ${this.options.username}`);
        this.ws.send(`JOIN #${this.options.username}`);
      };

      this.ws.onerror = (event: any) => {
        if (config.debug) {
          console.error(event);
        }
        this.isConnected = false;

        if (this.onErrorListener != null) this.onErrorListener(event);
        resolve(false);
        this.disconnect();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (config.debug) console.log("[ChatClient] WebSocket Close");
        if (this.onCloseListener != null) this.onCloseListener();
      };

      this.ws.onmessage = (event: any) => {
        const irc = String(event.data);
        if (irc.includes("PRIVMSG") && this.onMessageListener != null) {
          this.onMessageListener({
            id: getId(irc),
            timestamp: getTmiSentTimestamp(irc),
            channel: {
              id: getRoomId(irc),
              username: getChannel(irc),
            },
            user: {
              id: getUserId(irc),
              username: getDisplayName(irc),
              mod: isMod(irc),
              vip: isVip(irc),
            },
            message: getMessage(irc),
          } as ChatMessage);
        } else if (irc.includes("PING") && this.ws) {
          this.ws.send("PONG :tmi.twitch.tv");
        } else if (irc.includes("GLOBALUSERSTATE") && !this.isConnected) {
          this.isConnected = true;
          resolve(true);
        }
      };
    });
  }

  /**
   * Disconnects from Twitch by closing the WebSocket connection.
   */
  public disconnect() {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send a message to chat
   */
  public send(message: string) {
    if (this.ws) {
      this.ws.send(`PRIVMSG #${this.options.username} :${message}`);
    }
  }

  /**
   * Sends a message tagging the user
   */
  public sendTagging(username: string, message: string) {
    this.send(`@${username} ${message}`);
  }

  /**
   * Sets the handle for the WebSocket close event.
   * @param onCloseListener Function called when the connection is closed.
   */
  public onClose(onCloseListener: () => void) {
    this.onCloseListener = onCloseListener;
  }

  /**
   * Sets the handle for WebSocket errors.
   * @param onErrorListener Function called when an error occurs.
   */
  public onError(onErrorListener: (msg: any) => void) {
    this.onErrorListener = onErrorListener;
  }

  /**
   * Sets the handle for WebSocket chat messages.
   * @param onMessageListener Function called when a message arrives in the chat.
   */
  public onMessage(onMessageListener: (msg: ChatMessage) => void) {
    this.onMessageListener = onMessageListener;
  }
}
