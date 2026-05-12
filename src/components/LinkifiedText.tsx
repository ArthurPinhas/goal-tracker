import { Fragment } from "react";
import { parseLinkSegments } from "@/lib/linkSegments";

const linkClass =
  "text-primary underline underline-offset-2 hover:text-primary/90 break-all [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm";

type LinkifiedTextProps = {
  text: string;
  className?: string;
  /** Use span to nest inside buttons / truncated rows */
  as?: "span" | "p" | "div";
};

export function LinkifiedText({ text, className, as: Tag = "span" }: LinkifiedTextProps) {
  const segments = parseLinkSegments(text);
  return (
    <Tag className={className}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <Fragment key={i}>{seg.text}</Fragment>
        ) : (
          <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {seg.label}
          </a>
        )
      )}
    </Tag>
  );
}
