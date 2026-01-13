import { PostCommand, PostMessageSource } from "@/enums/post-command";
import { goToTab } from "@/utils/navigation";

// Typing for commands
interface ExtensionCommand {
  source: string;
  command: string;
  payload?: Record<string, number | string>;
}

/**
 * Sending commands from the extension.
 *
 * @param command
 * @param payload
 */
export const postCommand = ({
  command,
  payload = undefined,
}: {
  command: string;
  payload?: any;
}) => {
  window.postMessage(
    {
      source: PostMessageSource.EXTENSION,
      command: command,
      payload: payload,
    },
    "*"
  );
};

window.addEventListener("message", async (event: MessageEvent) => {
  const data = event.data as ExtensionCommand;

  // Checking the source
  if (data?.source !== PostMessageSource.SERVER) return;

  // Command routing
  switch (data.command) {
    case PostCommand.PING:
      postCommand({ command: PostCommand.PONG });
      break;
    case PostCommand.OPEN_TIMECODE_EDITOR:
      goToTab({ to: `/timecode?id=${data.payload?.id}` });
      break;
  }
});
