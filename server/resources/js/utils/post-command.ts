import { PostCommand, PostMessageSource } from "@/enums/post-command";

/**
 * Checking whether the extension is ready to receive messages.
 */
export const isExtensionReadyForMessages = (
    timeoutMs = 2000
): Promise<boolean> => {
    return new Promise((resolve) => {
        // Response handler function
        const handleMessage = (event: MessageEvent) => {
            
            // Source check
            if (event.data?.command === PostCommand.PONG) {
                clearTimeout(timeout);
                window.removeEventListener("message", handleMessage);
                resolve(true);
            }
        };

        // Listen to the answer
        window.addEventListener("message", handleMessage);

        // Sending a check command
        postCommand({ command: PostCommand.PING });

        // Timeout (if the extension is not installed or silent)
        const timeout = setTimeout(() => {
            window.removeEventListener("message", handleMessage);
            resolve(false);
        }, timeoutMs);
    });
};

/**
 * Sending commands from the server.
 *
 * @param command
 * @param payload
 */
export const postCommand = ({
    command,
    payload = undefined,
}: {
    command: string;
    payload?: Record<string, number | string>;
}) => {
    window.postMessage(
        {
            source: PostMessageSource.SERVER,
            command: command,
            payload: payload,
        },
        "*"
    );
};
