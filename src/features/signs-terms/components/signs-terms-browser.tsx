"use client";

import { useDeferredValue, useState } from "react";

import type { GlossaryTermWithCategory } from "@/lib/sample-dataset";

type BrowserScope = "all" | "signs" | "terms";

const SCOPE_LABELS: Record<BrowserScope, string> = {
  all: "All",
  signs: "Traffic Signs",
  terms: "Terms"
};

const SIGN_KIND_LABELS = {
  warning: "Warning",
  prohibitory: "Prohibitory",
  mandatory: "Mandatory",
  priority: "Priority",
  supplemental: "Supplemental",
  expressway: "Expressway",
  regulatory: "Regulatory",
  other: "Guide / Info"
} as const;

type TrafficSignKind = keyof typeof SIGN_KIND_LABELS;

interface SignsTermsBrowserProps {
  glossaryDetails: GlossaryTermWithCategory[];
}

export function SignsTermsBrowser({ glossaryDetails }: SignsTermsBrowserProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<BrowserScope>("all");
  const [selectedSignKind, setSelectedSignKind] = useState<string>("all");
  const [selectedTermId, setSelectedTermId] = useState(glossaryDetails[0]?.term.id ?? "");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const trafficSignKinds = [
    ...new Set(
      glossaryDetails
        .map((item) => item.term.trafficSignKind)
        .filter((kind): kind is TrafficSignKind => Boolean(kind))
    )
  ];

  const filteredGlossaryDetails = glossaryDetails.filter((item) => {
    if (scope === "signs" && !item.term.isTrafficSign) {
      return false;
    }

    if (scope === "terms" && item.term.isTrafficSign) {
      return false;
    }

    if (selectedSignKind !== "all" && item.term.trafficSignKind !== selectedSignKind) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      item.term.termEn,
      item.term.shortDefinitionEn,
      item.term.longExplanationEn ?? "",
      item.category?.labelEn ?? "",
      item.term.trafficSignKind ? SIGN_KIND_LABELS[item.term.trafficSignKind] ?? "" : ""
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
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
            <p className="eyebrow">{selectedTerm?.term.isTrafficSign ? "Current Sign" : "Current Term"}</p>
            <h2>{selectedTerm?.term.termEn ?? "No term"}</h2>
          </div>
          <div className="chip-row">
            <span className="chip">{selectedTerm?.term.isTrafficSign ? "Traffic Sign" : "Term"}</span>
            {selectedTerm?.term.trafficSignKind ? (
              <span className="chip">{SIGN_KIND_LABELS[selectedTerm.term.trafficSignKind] ?? "Other"}</span>
            ) : null}
            <span className="chip">{selectedTerm?.category?.labelEn ?? "General"}</span>
          </div>
        </div>

        {selectedTerm?.term.imageAssetPath ? (
          <div className="sign-figure-frame">
            <img
              className="sign-figure"
              src={selectedTerm.term.imageAssetPath}
              alt={selectedTerm.term.imageAltTextEn ?? selectedTerm.term.termEn}
            />
          </div>
        ) : null}

        <p className="question-stem">{selectedTerm?.term.shortDefinitionEn ?? "No term available."}</p>
        <p className="small-copy">{selectedTerm?.term.longExplanationEn ?? ""}</p>

        {selectedTerm?.sourceReference ? (
          <p className="small-copy support-note">
            Source: {selectedTerm.sourceReference.sourceName}
          </p>
        ) : null}
      </article>

      <article className="surface-card focus-card signs-list-card">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Browse</p>
            <h2>Browse Library</h2>
          </div>
          <span className="chip">{filteredGlossaryDetails.length}</span>
        </div>

        <div className="browse-toolbar">
          <div className="browse-toolbar-row">
            <div className="browse-inline-control">
              <span className="browse-inline-label">Show</span>
              <div className="browse-segmented" role="tablist" aria-label="Signs and terms scope">
                {(["all", "signs", "terms"] as BrowserScope[]).map((option) => (
                  <button
                    key={option}
                    className={scope === option ? "mode-button browse-segment active" : "mode-button browse-segment"}
                    type="button"
                    onClick={() => {
                      setScope(option);
                      if (option === "terms") {
                        setSelectedSignKind("all");
                      }
                    }}
                  >
                    {SCOPE_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>

            <label className="search-field browse-search-field">
              <span className="browse-inline-label">Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search signs, terms, or categories"
              />
            </label>
          </div>

          {scope !== "terms" && trafficSignKinds.length > 0 ? (
            <label className="browse-select-field">
              <span className="browse-inline-label">Type</span>
              <select value={selectedSignKind} onChange={(event) => setSelectedSignKind(event.target.value)}>
                <option value="all">All types</option>
                {trafficSignKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {SIGN_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="compact-list signs-list-grid">
          {filteredGlossaryDetails.length > 0 ? (
            filteredGlossaryDetails.map((item) => {
              const isActive = selectedTerm?.term.id === item.term.id;
              const metaLabel =
                item.term.trafficSignKind && selectedSignKind === "all"
                  ? SIGN_KIND_LABELS[item.term.trafficSignKind]
                  : !item.term.trafficSignKind && item.category?.labelEn && item.category.labelEn !== item.term.termEn
                    ? item.category.labelEn
                    : null;
              const hasImage = Boolean(item.term.imageAssetPath);
              const buttonClassName = [
                "list-card",
                "list-card-button",
                isActive ? "active" : "",
                hasImage ? "list-card-with-thumb" : "list-card-no-thumb",
                metaLabel ? "list-card-with-meta" : "list-card-no-meta"
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={item.term.id}
                  className={buttonClassName}
                  type="button"
                  onClick={() => setSelectedTermId(item.term.id)}
                >
                  {hasImage ? (
                    <img
                      className="sign-list-thumb"
                      src={item.term.imageAssetPath}
                      alt=""
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="sign-list-copy">
                    <span>{item.term.termEn}</span>
                    <small>{item.term.shortDefinitionEn}</small>
                  </div>

                  {metaLabel ? <span className="sign-list-meta">{metaLabel}</span> : null}
                </button>
              );
            })
          ) : (
            <div className="list-card">
              <span>No matching sign or term.</span>
              <small>Try clearing a filter or changing the search.</small>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
