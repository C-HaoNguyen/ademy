import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
    key: string;
    label: string;
    disabled?: boolean;
}

interface TabsProps {
    tabs: TabItem[];
    activeKey: string;
    onChange: (key: string) => void;
    children?: ReactNode;
}

const Tabs = ({ tabs, activeKey, onChange, children }: TabsProps) => {
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const focusableIndexes = tabs
        .map((tab, index) => (tab.disabled ? -1 : index))
        .filter((index) => index !== -1);

    const moveFocus = (currentIndex: number, delta: 1 | -1) => {
        if (focusableIndexes.length === 0) return;
        const position = focusableIndexes.indexOf(currentIndex);
        const fallbackPosition = delta === 1 ? -1 : 0;
        const nextPosition =
            ((position === -1 ? fallbackPosition : position) + delta + focusableIndexes.length) %
            focusableIndexes.length;
        const nextIndex = focusableIndexes[nextPosition];
        tabRefs.current[nextIndex]?.focus();
        onChange(tabs[nextIndex].key);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            moveFocus(index, 1);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            moveFocus(index, -1);
        }
    };

    return (
        <div>
            <div role="tablist" className="flex gap-1 border-b border-default">
                {tabs.map((tab, index) => {
                    const isActive = tab.key === activeKey;
                    return (
                        <button
                            key={tab.key}
                            ref={(el) => {
                                tabRefs.current[index] = el;
                            }}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-disabled={tab.disabled || undefined}
                            disabled={tab.disabled}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => onChange(tab.key)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`px-4 py-2 text-body-sm font-medium disabled:cursor-not-allowed disabled:text-disabled ${
                                isActive
                                    ? "bg-nav-selected-bg text-nav-selected-text"
                                    : "text-secondary hover:bg-surface-muted"
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            {children}
        </div>
    );
};

export default Tabs;
