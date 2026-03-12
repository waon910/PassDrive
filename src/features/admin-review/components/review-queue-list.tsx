"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { formatQuestionStatusLabel } from "@/domain/content-rules";
import type { QuestionStatus } from "@/domain/content-types";
import type { ReviewDashboardItem } from "@/features/admin-review/get-review-dashboard-view-model";

interface ReviewQueueListProps {
  items: ReviewDashboardItem[];
}

type StatusFilter = "all" | QuestionStatus;
const PAGE_SIZE = 10;

function buildVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

export function ReviewQueueList({ items }: ReviewQueueListProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousPageRef = useRef(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("unpublished");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const categoryOptions = [...new Set(items.map((item) => item.bundle.category.labelEn))].sort((left, right) =>
    left.localeCompare(right)
  );
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "all" && item.bundle.question.status !== statusFilter) {
      return false;
    }

    if (categoryFilter !== "all" && item.bundle.category.labelEn !== categoryFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      item.bundle.question.englishStem,
      item.bundle.question.id,
      item.bundle.category.labelEn,
      item.bundle.sourceReference.sourceName,
      formatQuestionStatusLabel(item.bundle.question.status)
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const visibleItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
  const pageNumbers = buildVisiblePageNumbers(safeCurrentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    if (previousPageRef.current === safeCurrentPage) {
      return;
    }

    previousPageRef.current = safeCurrentPage;
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [safeCurrentPage]);

  return (
    <article ref={containerRef} className="surface-card">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Question Visibility</p>
          <h2>Open one item and adjust learner access.</h2>
        </div>
        <span className="chip">{items.length} total</span>
      </div>

      <div className="admin-review-controls">
        <label className="search-field">
          <span className="meta-label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              const nextValue = event.target.value;
              startTransition(() => setQuery(nextValue));
            }}
            placeholder="Search by question, id, category, source, or status"
          />
        </label>

        <label className="search-field admin-filter-field">
          <span className="meta-label">Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="unpublished">Unpublished</option>
            <option value="published">Published</option>
            <option value="all">All statuses</option>
          </select>
        </label>

        <label className="search-field admin-filter-field">
          <span className="meta-label">Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="home-highlight-row" aria-label="Visibility filters">
        <span className="home-highlight-chip">{filteredItems.length} matching item(s)</span>
        <span className="home-highlight-chip">
          Page {safeCurrentPage} / {totalPages}
        </span>
        <span className="home-highlight-chip">
          {statusFilter === "all" ? "All statuses" : formatQuestionStatusLabel(statusFilter)}
        </span>
      </div>

      {filteredItems.length === 0 ? <p className="small-copy">No questions match the current filters.</p> : null}

      <div className="stack-list admin-review-list">
        {visibleItems.map((item) => (
          <Link
            key={item.bundle.question.id}
            className="admin-review-card"
            href={`/admin/review/questions/${item.bundle.question.id}`}
          >
            <div className="admin-review-card-main">
              <div className="admin-review-chip-row">
                <span className="chip">{formatQuestionStatusLabel(item.bundle.question.status)}</span>
                <span className="small-copy">{item.bundle.category.labelEn}</span>
                <span className="small-copy">{item.bundle.question.id}</span>
              </div>

              <strong>{item.bundle.question.englishStem}</strong>
            </div>

            <div className="admin-review-status-grid" aria-label="Question metadata">
              <span className="admin-status-pill">Source: {item.bundle.sourceReference.sourceName}</span>
              <span className="admin-status-pill">Choices: {item.bundle.choices.length}</span>
              <span className="admin-status-pill">Updated: {item.bundle.question.updatedAt.slice(0, 10)}</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredItems.length > PAGE_SIZE ? (
        <div className="admin-pagination" aria-label="Review queue pagination">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
          >
            Previous
          </button>

          <div className="admin-pagination-pages">
            {pageNumbers.map((pageNumber, index) => {
              const previousPage = pageNumbers[index - 1];
              const showGap = previousPage !== undefined && pageNumber - previousPage > 1;

              return (
                <div key={pageNumber} className="question-index-group">
                  {showGap ? <span className="question-index-gap">...</span> : null}
                  <button
                    className={pageNumber === safeCurrentPage ? "question-index-pill active" : "question-index-pill"}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </article>
  );
}
