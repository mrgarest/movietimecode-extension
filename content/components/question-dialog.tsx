import { Button, TButtonStyle } from "./ui/button";
import { removeDialog, renderDialog } from "@/utils/dialog";

type RootProps = {
    title: string;
    description?: string;
    buttons: QuestionDialogButton[]
};

type QuestionDialogButton = {
    text: string;
    style?: TButtonStyle;
    dismiss?: boolean;
    onClick?: () => void
};

/**
 * QuestionDialog component
 * Renders a dialog with title, description and buttons.
 * @param title - dialog title
 * @param description - dialog description
 * @param buttons - dialog buttons
 */
const QuestionDialog = ({ title, description = undefined, buttons }: RootProps) => {
    return (
        <div className="mt-dialog-container mt-dialog-question">
            <div className="mt-title">{title}</div>
            {description && <div className="mt-description">{description}</div>}
            <div className="mt-buttons">{buttons.map((
                { style = "primary", text, dismiss = true, onClick = undefined }: QuestionDialogButton,
                index
            ) => <Button
                    key={index}
                    style={style}
                    text={text}
                    onClick={onClick || dismiss ? () => {
                        if (onClick) onClick();
                        if (dismiss) dismissQuestionDialog();
                    } : undefined}
                />)}
            </div>
        </div>
    )
};

/**
 * Renders the QuestionDialog in a dialog container.
 * @param props - dialog props
 */
let container: HTMLDivElement;
export const renderQuestionDialog = (props: RootProps) => renderDialog("question", <QuestionDialog {...props} />, (e) => container = e);

/**
 * Dismisses the QuestionDialog.
 */
export const dismissQuestionDialog = () => {
    if (!container) return;
    removeDialog(container);
};