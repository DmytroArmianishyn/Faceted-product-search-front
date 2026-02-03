import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "https://92.112.180.231:6042";
const PAGE_SIZE = 10;

export default function FiltersModal({
                                         open,
                                         onClose,
                                         search,
                                         selectedBrands = [],
                                         selectedCategories = [],
                                         onApply,
                                     }) {
    const [localBrands, setLocalBrands] = useState([]);
    const [localCategories, setLocalCategories] = useState([]);

    const [brandsData, setBrandsData] = useState({ items: [], totalPages: 0, page: 0 });
    const [categoriesData, setCategoriesData] = useState({ items: [], totalPages: 0, page: 0 });

    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [openSection, setOpenSection] = useState("brands");

    const brandAbortRef = useRef(null);
    const categoryAbortRef = useRef(null);

    const extractContent = (pageDto) => {
        if (!pageDto) return [];
        return pageDto.content || [];
    };

    const extractTotalPages = (pageDto) => {
        if (!pageDto) return 0;
        return pageDto.totalPages || 0;
    };

    const extractCurrentPage = (pageDto) => {
        if (!pageDto) return 0;
        return pageDto.pageNumber ?? 0;
    };

    const uniqueMerge = (prev, next) => {
        const map = new Map();
        [...prev, ...next].forEach((x) => {
            const key = x?.id != null ? String(x.id) : String(x?.value ?? "");
            if (key && !map.has(key)) map.set(key, x);
        });
        return Array.from(map.values());
    };

    const fetchBrands = async (page = 0, isLoadMore = false) => {
        if (brandAbortRef.current) brandAbortRef.current.abort();
        brandAbortRef.current = new AbortController();

        setLoadingBrands(true);
        try {
            const url = new URL(`${API_BASE}/facets/brand`);

            if (search?.trim()) {
                url.searchParams.set("search", search.trim());
            }

            localCategories.forEach((c) => url.searchParams.append("categories", String(c)));

            localBrands.forEach((b) => url.searchParams.append("brands", String(b)));

            url.searchParams.set("pageBrand", String(page));
            url.searchParams.set("sizeBrand", String(PAGE_SIZE));

            console.log(`[FiltersModal] Fetching brands page=${page}`, url.toString());

            const res = await fetch(url.toString(), { signal: brandAbortRef.current.signal });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();

            const newItems = extractContent(data);
            const totalPages = extractTotalPages(data);
            const currentPage = extractCurrentPage(data);

            setBrandsData((prev) => ({
                items: isLoadMore ? uniqueMerge(prev.items, newItems) : newItems,
                totalPages,
                page: currentPage,
            }));
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Error fetching brands:", err);
            }
        } finally {
            if (brandAbortRef.current && !brandAbortRef.current.signal.aborted) {
                setLoadingBrands(false);
            }
        }
    };

    const fetchCategories = async (page = 0, isLoadMore = false) => {
        if (categoryAbortRef.current) categoryAbortRef.current.abort();
        categoryAbortRef.current = new AbortController();

        setLoadingCategories(true);
        try {
            const url = new URL(`${API_BASE}/facets/category`);

            if (search?.trim()) {
                url.searchParams.set("search", search.trim());
            }

            localBrands.forEach((b) => url.searchParams.append("brands", String(b)));

            localCategories.forEach((c) => url.searchParams.append("categories", String(c)));

            url.searchParams.set("pageCategory", String(page));
            url.searchParams.set("sizeCategory", String(PAGE_SIZE));

            console.log(`[FiltersModal] Fetching categories page=${page}`, url.toString());

            const res = await fetch(url.toString(), { signal: categoryAbortRef.current.signal });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();

            const newItems = extractContent(data);
            const totalPages = extractTotalPages(data);
            const currentPage = extractCurrentPage(data);

            setCategoriesData((prev) => ({
                items: isLoadMore ? uniqueMerge(prev.items, newItems) : newItems,
                totalPages,
                page: currentPage,
            }));
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Error fetching categories:", err);
            }
        } finally {
            if (categoryAbortRef.current && !categoryAbortRef.current.signal.aborted) {
                setLoadingCategories(false);
            }
        }
    };

    useEffect(() => {
        if (!open) return;

        setLocalBrands((selectedBrands ?? []).map(Number));
        setLocalCategories((selectedCategories ?? []).map(Number));

        setBrandsData({ items: [], totalPages: 0, page: 0 });
        setCategoriesData({ items: [], totalPages: 0, page: 0 });

        setOpenSection("brands");
    }, [open, selectedBrands, selectedCategories]);

    useEffect(() => {
        if (!open) return;
        fetchBrands(0, false);
    }, [open, search, localCategories, localBrands]);

    useEffect(() => {
        if (!open) return;
        fetchCategories(0, false);
    }, [open, search, localBrands, localCategories]);

    const handleLoadMoreBrands = () => {
        if (loadingBrands) return;
        if (brandsData.page + 1 < brandsData.totalPages) {
            fetchBrands(brandsData.page + 1, true);
        }
    };

    const handleLoadMoreCategories = () => {
        if (loadingCategories) return;
        if (categoriesData.page + 1 < categoriesData.totalPages) {
            fetchCategories(categoriesData.page + 1, true);
        }
    };

    const toggleSelection = (type, value) => {
        const id = Number(value);
        const setState = type === "brand" ? setLocalBrands : setLocalCategories;

        setState((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const handleApply = () => {
        onApply?.({ brands: localBrands, categories: localCategories });
        onClose?.();
    };

    const handleClear = () => {
        setLocalBrands([]);
        setLocalCategories([]);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/40 flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose?.();
                }}
            >
                <div
                    className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 shrink-0">
                        <div>
                            <div className="text-base font-bold text-zinc-900">Filters</div>
                            <div className="text-xs text-zinc-500">Select multiple items, then press Apply.</div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 w-9 rounded-xl hover:bg-zinc-100 text-zinc-600"
                            aria-label="Close"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto min-h-0 flex-1">
                        <FacetSection
                            title="Brands"
                            isOpen={openSection === "brands"}
                            onToggleSection={() => setOpenSection((prev) => (prev === "brands" ? null : "brands"))}
                            items={brandsData.items}
                            selectedItems={localBrands}
                            onToggleItem={(id) => toggleSelection("brand", id)}
                            loading={loadingBrands}
                            onLoadMore={handleLoadMoreBrands}
                            hasMore={brandsData.page + 1 < brandsData.totalPages}
                        />

                        <FacetSection
                            title="Categories"
                            isOpen={openSection === "categories"}
                            onToggleSection={() => setOpenSection((prev) => (prev === "categories" ? null : "categories"))}
                            items={categoriesData.items}
                            selectedItems={localCategories}
                            onToggleItem={(id) => toggleSelection("category", id)}
                            loading={loadingCategories}
                            onLoadMore={handleLoadMoreCategories}
                            hasMore={categoriesData.page + 1 < categoriesData.totalPages}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-zinc-200 px-5 py-4 bg-zinc-50 shrink-0">
                        <div className="text-sm text-zinc-600">
                            Selected:{" "}
                            <span className="font-semibold text-zinc-900">
                                {localBrands.length + localCategories.length}
                            </span>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                onClick={handleApply}
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FacetSection({
                          title,
                          isOpen,
                          onToggleSection,
                          items,
                          selectedItems,
                          onToggleItem,
                          loading,
                          onLoadMore,
                          hasMore,
                      }) {
    const selectedSet = useMemo(() => new Set(selectedItems.map(Number)), [selectedItems]);
    const selectedCount = selectedItems.length;

    return (
        <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
            <button
                type="button"
                onClick={onToggleSection}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">{title}</span>
                    {selectedCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                            {selectedCount} selected
                        </span>
                    )}
                </div>
                <span className="text-zinc-500 text-lg leading-none">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
                <div className="border-t border-zinc-200 p-3">
                    <div className="max-h-[40vh] overflow-y-auto pr-1">
                        {items.length === 0 && !loading ? (
                            <div className="text-sm text-zinc-500 py-2 text-center">No options found</div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {items.map((opt) => {
                                    const id = Number(opt.id);
                                    const checked = selectedSet.has(id);
                                    const disabled = opt.count === 0 && !checked;

                                    return (
                                        <label
                                            key={`${id}-${opt.value}`}
                                            className={`flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition ${
                                                disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-50 cursor-pointer"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={() => onToggleItem(id)}
                                                    className="h-4 w-4 accent-zinc-900 rounded border-gray-300"
                                                />
                                                <span className="text-sm text-zinc-900 truncate" title={opt.value}>
                                                    {opt.value}
                                                </span>
                                            </span>
                                            <span className="text-xs text-zinc-500 font-medium">{opt.count}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {loading && (
                            <div className="py-2 text-center text-xs text-zinc-500 animate-pulse">Loading...</div>
                        )}

                        {!loading && hasMore && (
                            <button
                                type="button"
                                onClick={onLoadMore}
                                className="w-full mt-2 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                                More (+{PAGE_SIZE})
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}