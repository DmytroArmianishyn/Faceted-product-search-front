import React, { useMemo } from "react";
export default function Pagination({ page, totalPages, onPageChange, delta = 2 }) {
    const pages = useMemo(() => buildPages(page, totalPages, delta), [page, totalPages, delta]);

    if (!totalPages || totalPages <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <PageButton disabled={page === 0} onClick={() => onPageChange(page - 1)}>
                    ← Prev
                </PageButton>

                {pages.map((p, idx) =>
                        p === "..." ? (
                            <span key={`dots-${idx}`} className="px-2 text-sm text-zinc-400">
              ...
            </span>
                        ) : (
                            <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
                                {p + 1}
                            </PageButton>
                        )
                )}

                <PageButton disabled={page === totalPages - 1} onClick={() => onPageChange(page + 1)}>
                    Next →
                </PageButton>
            </div>
        </div>
    );
}

function PageButton({ children, active, disabled, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={[
                "h-9 min-w-9 px-3 rounded-lg text-sm font-semibold transition",
                active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                disabled ? "opacity-40 cursor-not-allowed hover:bg-zinc-100" : "",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function buildPages(current, totalPages, delta) {
    const last = totalPages - 1;
    const range = (from, to) => {
        const out = [];
        for (let i = from; i <= to; i++) out.push(i);
        return out;
    };

    // if small -> show all
    if (totalPages <= 9) return range(0, last);

    const left = Math.max(1, current - delta);
    const right = Math.min(last - 1, current + delta);

    const pages = [0];

    if (left > 1) pages.push("...");
    pages.push(...range(left, right));
    if (right < last - 1) pages.push("...");

    pages.push(last);

    return pages;
}
