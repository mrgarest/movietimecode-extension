export type TButtonStyle = "primary" | "outline";

interface RootProps {
    style?: TButtonStyle
    text: string;
    onClick?: () => void | Promise<void> | undefined;
}

export const Button = ({ style = "primary", text, onClick = undefined }: RootProps) => {
    return (
        <div className={`mt-button mt-${style}`} onClick={onClick}>
            <span>{text}</span>
        </div>
    )
}