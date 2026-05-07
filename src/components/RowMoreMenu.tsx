import { useEffect, useRef } from "react";
 
export type MoreAction =
    | "view_history"
    | "duplicate_application"
    | "archive_application"
    | "edit"
    | "delete"; // ✅ add delete
 
type Props = {
    open: boolean;
    anchorRect: DOMRect | null;
    onClose: () => void;
    onAction: (action: MoreAction) => void;
 
    // ✅ optional UX: disable delete while API call is in-flight
    disableDelete?: boolean;
};
 
export default function RowMoreMenu({
    open,
    anchorRect,
    onClose,
    onAction,
    disableDelete,
}: Props) {
    const menuRef = useRef<HTMLDivElement | null>(null);
 
    useEffect(() => {
        if (!open) return;
 
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (menuRef.current && !menuRef.current.contains(target)) onClose();
        };
 
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, onClose]);
 
    useEffect(() => {
        if (!open) return;
 
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
 
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);
 
    if (!open || !anchorRect) return null;
 
    const top = anchorRect.bottom + window.scrollY + 8;
    const left = anchorRect.right + window.scrollX - 240;
 
    return (
        <div className="overlay-layer">
            <div
                ref={menuRef}
                className="more-menu"
                style={{ top, left }}
                role="menu"
                aria-label="More actions"
            >
                <button className="more-item" type="button" onClick={() => onAction("view_history")}>
                    <span className="more-ico">🕒</span>
                    <span>View History</span>
                </button>
 
                <button className="more-item" type="button" onClick={() => onAction("duplicate_application")}>
                    <span className="more-ico">📄</span>
                    <span>Duplicate Application</span>
                </button>
 
                {/* ✅ Delete option like your screenshot */}
                <button
                    className="more-item more-item--danger"
                    type="button"
                    onClick={() => onAction("delete")}
                    disabled={disableDelete}
                >
                    <span className="more-ico">🗑️</span>
                    <span>{disableDelete ? "Deleting..." : "Delete"}</span>
                </button>
 
                <button className="more-item" type="button" onClick={() => onAction("edit")}>
                    <span className="more-ico">✏️</span>
                    <span>Edit</span>
                </button>
            </div>
        </div>
    );
}