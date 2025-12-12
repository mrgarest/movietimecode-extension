export default function BackgroundGradient() {
    return (
        <div
            className="fixed inset-0 z-[-1]"
            style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(255 255 255 / 6%), transparent 70%), var(--color-background)",
            }}
        />
    );
}