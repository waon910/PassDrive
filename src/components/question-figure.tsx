import type { Question } from "@/domain/content-types";

interface QuestionFigureProps {
  question: Pick<Question, "hasImage" | "imageAssetPath" | "imageAltTextEn" | "imageCaptionEn">;
  size?: "full" | "compact";
}

export function QuestionFigure({ question, size = "full" }: QuestionFigureProps) {
  if (!question.hasImage || !question.imageAssetPath) {
    return null;
  }

  return (
    <figure className={size === "compact" ? "question-figure question-figure-compact" : "question-figure"}>
      <img
        className="question-figure-image"
        src={question.imageAssetPath}
        alt={question.imageAltTextEn ?? "Question image"}
      />
      {question.imageCaptionEn ? <figcaption>{question.imageCaptionEn}</figcaption> : null}
    </figure>
  );
}
