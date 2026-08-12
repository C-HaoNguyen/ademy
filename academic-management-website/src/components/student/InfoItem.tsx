interface InfoItemProps {
    label: string;
    value: string;
    editable?: boolean;
    onChange?: (value: string) => void;
}

const InfoItem = ({ label, value, editable = false, onChange }: InfoItemProps) => {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-md">
            <p className="text-sm text-gray-400 mb-1">{label}</p>

            {editable ? (
                <input
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="w-full text-gray-800 font-medium outline-none border-b-2 border-blue-400"
                />
            ) : (
                <p className="text-gray-800 font-medium">{value}</p>
            )}
        </div>
    );
};

export default InfoItem;