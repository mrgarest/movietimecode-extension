
export type TButtonStyle = "primary" | "outline";

type RootProps = {
    style?: TButtonStyle
    text: string;
    onClick?: () => void | undefined
}
export const Button = ({ style = "primary", text, onClick = undefined }: RootProps) => {
    return (
        <div className={`mt-button mt-${style}`} onClick={onClick}>
            <span>{text}</span>
        </div>
    )
}