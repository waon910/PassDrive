"use client";

import { useDeferredValue, useState } from "react";

import type { GlossaryTermWithCategory } from "@/lib/sample-dataset";

interface SignsTermsBrowserProps {
  glossaryDetails: GlossaryTermWithCategory[];
}

export function SignsTermsBrowser({ glossaryDetails }: SignsTermsBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedTermId, setSelectedTermId] = useState(glossaryDetails[0]?.term.id ?? "");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredGlossaryDetails = glossaryDetails.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    return [item.term.termEn, item.term.shortDefinitionEn, item.category?.labelEn ?? ""].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });

  const selectedTerm =
    filteredGlossaryDetails.find((item) => item.term.id === selectedTermId) ??
    filteredGlossaryDetails[0] ??
    glossaryDetails[0];

  return (
    <section className="signs-browser-layout">
      <article className="surface-card focus-card signs-detail-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Current Term</p>
            <h2>{selectedTerm?.term.termEn ?? "No term"}</h2>
          </div>
          <span className="chip">{selectedTerm?.category?.labelEn ?? "General"}</span>
        </div>

        <p className="question-stem">{selectedTerm?.term.shortDefinitionEn ?? "No term available."}</p>
        <p className="small-copy">{selectedTerm?.term.longExplanationEn ?? ""}</p>
      </article>

      <article className="surface-card focus-card signs-list-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Find a Term</p>
            <h2>Search and switch quickly</h2>
          </div>
          <span className="chip">{filteredGlossaryDetails.length}</span>
        </div>

        <label className="search-field">
          <span className="meta-label">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search terms or categories"
          />
        </label>

        <div className="compact-list signs-list-grid">
          {filteredGlossaryDetails.map((item) => {
            const isActive = selectedTerm?.term.id === item.term.id;

            return (
              <button
                key={item.term.id}
                className={isActive ? "list-card list-card-button active" : "list-card list-card-button"}
                type="button"
                onClick={() => setSelectedTermId(item.term.id)}
              >
                <div>
                  <span>{item.term.termEn}</span>
                  <small>{item.term.shortDefinitionEn}</small>
                </div>
                <strong>{item.category?.labelEn ?? "General"}</strong>
              </button>
            );
          })}
        </div>
      </article>
    </section>
  );
}
