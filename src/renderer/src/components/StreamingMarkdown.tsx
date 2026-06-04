import { memo } from "react";

/**
 * Lightweight streaming text renderer.
 *
 * Renders streaming text as-is without react-markdown to prevent flickering
 * caused by repeated AST parsing and DOM reconciliation on every streaming
 * frame. Full markdown rendering happens via AgentMarkdown when the message
 * is committed (streaming=false).
 */

interface StreamingMarkdownProps {
  children: string;
}

const StreamingMarkdown = memo(function StreamingMarkdown({
  children,
}: StreamingMarkdownProps): React.JSX.Element {
  if (!children) {
    return <div className="markdown-body sm-streaming" />;
  }

  return (
    <div className="markdown-body sm-streaming sm-streaming-plain">
      {children}
    </div>
  );
});

export { StreamingMarkdown };
export default StreamingMarkdown;
