import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreamingMarkdown } from "./StreamingMarkdown";

describe("StreamingMarkdown", () => {
  it("renders text content as plain text during streaming", () => {
    const { container } = render(
      <StreamingMarkdown>
        {"Hello **world** and `code` here"}
      </StreamingMarkdown>,
    );

    expect(container.textContent).toContain("Hello **world** and `code` here");
    // No markdown formatting applied during streaming
    expect(container.querySelector("code")).toBeNull();
    expect(container.querySelector("strong")).toBeNull();
  });

  it("renders empty state correctly", () => {
    const { container } = render(<StreamingMarkdown>{""}</StreamingMarkdown>);
    expect(container.querySelector(".sm-streaming")).not.toBeNull();
  });

  it("renders table markdown as plain text during streaming", () => {
    const { container } = render(
      <StreamingMarkdown>
        {"| Name | Status |\n| --- | --- |\n| build | pass |"}
      </StreamingMarkdown>,
    );

    expect(container.querySelector("table")).toBeNull();
    expect(container.textContent).toContain("| build |");
  });

  it("adds pre-wrap class for whitespace preservation", () => {
    const { container } = render(
      <StreamingMarkdown>{"line1\n\nline2\n\nline3"}</StreamingMarkdown>,
    );

    const el = container.querySelector(".sm-streaming-plain");
    expect(el).not.toBeNull();
    expect(container.textContent).toContain("line1\n\nline2");
  });
});
