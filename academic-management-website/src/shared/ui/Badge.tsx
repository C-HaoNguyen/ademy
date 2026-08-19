interface BadgeProps {
    text: string;
    color?: "blue" | "green" | "red";
}

const Badge = ({ text, color = "blue" }: BadgeProps) => {
    const map = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        red: "bg-red-100 text-red-600",
    };

    return (
        <span className={`px-4 py-1 rounded-full text-sm font-medium ${map[color]}`}>
            {text}
        </span>
    );
};

export default Badge;