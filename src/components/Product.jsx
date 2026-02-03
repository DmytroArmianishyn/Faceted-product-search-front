import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination.jsx";
import FiltersModal from "./FiltersModal.jsx";

const API_BASE = "https://portal-of-memories.site:6042";
const PAGE_SIZE = 12;



export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState(() => {
        return searchParams.getAll("brands").map(Number).filter(n => !isNaN(n));
    });
    const [selectedCategories, setSelectedCategories] = useState(() => {
        return searchParams.getAll("categories").map(Number).filter(n => !isNaN(n));
    });

    const qFromUrl = searchParams.get("q") ?? "";
    const pageFromUrl = toInt(searchParams.get("page"), 0);

    const [q, setQ] = useState(qFromUrl);

    const [pageDto, setPageDto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(pageFromUrl);

    useEffect(() => {
        setQ(qFromUrl);
        setPage(pageFromUrl);
    }, [qFromUrl, pageFromUrl]);

    const debouncedQ = useDebounce(q, 350);

    useEffect(() => {
        const url = new URL(`${API_BASE}/product`);
        url.searchParams.set("page", page);
        url.searchParams.set("size", PAGE_SIZE);
        
        if (debouncedQ.trim()) {
            url.searchParams.set("search", debouncedQ.trim());
        }

        selectedBrands.forEach(b => url.searchParams.append("brands", b));
        selectedCategories.forEach(c => url.searchParams.append("categories", c));

        setLoading(true);
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                setPageDto(data);
                setTotalPages(data.totalPages ?? 0);
            })
            .finally(() => setLoading(false));
    }, [page, debouncedQ, selectedBrands, selectedCategories]);



    const products = pageDto?.content ?? [];

    function applyUrl(nextQ, nextPage, nextBrands, nextCategories) {
        const sp = new URLSearchParams(searchParams);

        if (nextQ) sp.set("q", nextQ);
        else sp.delete("q");

        if (nextPage && nextPage > 0) sp.set("page", String(nextPage));
        else sp.delete("page");

        sp.delete("brands");
        sp.delete("categories");
        
        const brandsToSave = nextBrands !== undefined ? nextBrands : selectedBrands;
        const categoriesToSave = nextCategories !== undefined ? nextCategories : selectedCategories;
        
        brandsToSave.forEach(b => sp.append("brands", b));
        categoriesToSave.forEach(c => sp.append("categories", c));

        setSearchParams(sp, { replace: true });
    }

    function onSearchChange(value) {
        setQ(value);
        setPage(0);
        applyUrl(value, 0);
    }

    function clearSearch() {
        setQ("");
        setPage(0);
        applyUrl("", 0);
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-[92%] mx-auto p-6">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-zinc-200">
                    <div
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 bg-gradient-to-r from-zinc-900 to-zinc-700 p-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Products</h1>
                        </div>

                        <div className="w-full sm:w-[420px]">
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search products…"
                                    className="w-full bg-white text-zinc-900 text-sm rounded-xl px-4 py-3 pr-10 shadow focus:outline-none focus:ring-2 focus:ring-white/40"
                                />
                                {q ? (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 rounded-full px-2 py-1"
                                        title="Clear"
                                    >
                                        ×
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-2 text-xs text-zinc-200">
                                {qFromUrl ? (
                                    <>
                                        Query: <span className="font-semibold text-white">"{qFromUrl}"</span>
                                    </>
                                ) : (
                                    <>Type to search (partial matches)</>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFiltersOpen(true)}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
                        Filters
                    </button>

                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-zinc-600">
                                {loading ? "Loading…" : `${pageDto?.totalElements ?? 0} items`}
                            </div>
                        </div>
                        <div className="mt-5">
                            {loading ? (
                                <ProductsSkeleton/>
                            ) : products.length ? (
                                <div
                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
                                    {products.map((p) => (
                                        <ProductCard key={p.id} p={p}/>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState onClear={clearSearch}/>
                            )}
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={(p) => {
                                setPage(p);
                                applyUrl(qFromUrl, p);
                            }}
                        />
                    </div>
                </div>
            </div>
            <FiltersModal
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                search={qFromUrl}
                selectedBrands={selectedBrands}
                selectedCategories={selectedCategories}
                onApply={({ brands, categories }) => {
                    setSelectedBrands(brands);
                    setSelectedCategories(categories);
                    setPage(0);
                    applyUrl(qFromUrl, 0, brands, categories);
                }}
            />
        </div>
    );
}

function ProductCard({p}) {
    const categories = Array.isArray(p.categoriesNames) ? p.categoriesNames : [];
    const firstCategory = categories[0];

    return (
        <div className="rounded-xl border border-zinc-200 bg-white hover:shadow-sm transition overflow-hidden">
            <div className="bg-zinc-50 h-40 sm:h-44 flex items-center justify-center p-3">
                {p.image ? (
                    <img
                        src={p.image}
                        alt={p.name}
                        className="max-h-full max-w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="text-xs text-zinc-400">No image</div>
                )}
            </div>


            <div className="p-2">
                <div className="text-[12px] font-semibold text-zinc-900 truncate" title={p.name}>
                    {p.name}
                </div>

                <div className="mt-1 flex flex-wrap gap-1">
                    {p.brandName ? (
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600">
              {p.brandName}
            </span>
                    ) : null}

                    {firstCategory ? (
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600">
              {firstCategory}
            </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}


function ProductsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
            {Array.from({length: PAGE_SIZE}).map((_, i) => (
                <div key={i}
                     className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-zinc-100"/>
                    <div className="p-4 space-y-3">
                        <div className="h-4 w-3/4 bg-zinc-100 rounded"/>
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-zinc-100 rounded-full"/>
                            <div className="h-6 w-20 bg-zinc-100 rounded-full"/>
                        </div>
                        <div className="h-10 w-full bg-zinc-100 rounded-xl"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({onClear}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
            <div className="text-sm font-semibold text-zinc-900">No products found</div>
            <div className="mt-1 text-sm text-zinc-600">Try a different query or clear search.</div>
            <button
                type="button"
                onClick={onClear}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 active:bg-zinc-100"
            >
                Clear search
            </button>
        </div>
    );
}

function useDebounce(value, delay) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

function toInt(v, fallback) {
    const n = Number.parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}



