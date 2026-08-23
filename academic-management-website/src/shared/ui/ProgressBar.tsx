interface ProgressBarProps {
    value: number;
    label?: string;
}

const ProgressBar = ({ value, label }: ProgressBarProps) => {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div>
            {label && <p className="text-body-sm text-secondary mb-1">{label}</p>}
            <div
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full rounded-radius-full bg-progress-track overflow-hidden"
            >
                <div
                    className="h-full rounded-radius-full bg-progress-fill transition-all"
                    style={{ width: `${clamped}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
