import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ToolInvocation } from "ai";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => cleanup());

function call(
  toolName: string,
  args: Record<string, unknown>,
  state: "partial-call" | "call" | "result" = "result"
): ToolInvocation {
  if (state === "result") {
    return { state, toolCallId: "id", toolName, args, result: "ok" } as ToolInvocation;
  }
  return { state, toolCallId: "id", toolName, args } as ToolInvocation;
}

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "create", path: "src/Button.tsx" });
  expect(text).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "str_replace", path: "src/App.tsx" });
  expect(text).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "insert", path: "src/index.ts" });
  expect(text).toBe("Editing index.ts");
});

test("getToolLabel: str_replace_editor view", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "view", path: "src/utils.ts" });
  expect(text).toBe("Reading utils.ts");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/styles.css" });
  expect(text).toBe("Undoing edit in styles.css");
});

test("getToolLabel: file_manager rename", () => {
  const { text } = getToolLabel("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" });
  expect(text).toBe("Renaming Old.tsx → New.tsx");
});

test("getToolLabel: file_manager delete", () => {
  const { text } = getToolLabel("file_manager", { command: "delete", path: "src/Unused.tsx" });
  expect(text).toBe("Deleting Unused.tsx");
});

test("getToolLabel: unknown tool returns tool name", () => {
  const { text, Icon } = getToolLabel("some_unknown_tool", {});
  expect(text).toBe("some_unknown_tool");
  expect(Icon).toBeNull();
});

test("getToolLabel: extracts basename from nested path", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "create", path: "src/components/ui/Card.tsx" });
  expect(text).toBe("Creating Card.tsx");
});

test("getToolLabel: empty path falls back to 'file'", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "create", path: "" });
  expect(text).toBe("Creating file");
});

test("getToolLabel: missing path falls back to 'file'", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "create" });
  expect(text).toBe("Creating file");
});

test("getToolLabel: unknown str_replace_editor command falls back to editing", () => {
  const { text } = getToolLabel("str_replace_editor", { command: "unknown_future_cmd", path: "src/A.tsx" });
  expect(text).toBe("Editing A.tsx");
});

// --- ToolInvocationBadge render tests ---

test("renders user-friendly text", () => {
  render(<ToolInvocationBadge toolInvocation={call("str_replace_editor", { command: "create", path: "src/Button.tsx" })} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows green dot when state is result", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={call("str_replace_editor", { command: "create", path: "A.tsx" }, "result")} />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={call("str_replace_editor", { command: "create", path: "A.tsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is partial-call", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={call("str_replace_editor", { command: "create", path: "A.tsx" }, "partial-call")} />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("renders file_manager rename with both filenames", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={call("file_manager", { command: "rename", path: "src/Old.tsx", new_path: "src/New.tsx" })}
    />
  );
  expect(screen.getByText("Renaming Old.tsx → New.tsx")).toBeDefined();
});

test("renders icon for known commands", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={call("str_replace_editor", { command: "create", path: "A.tsx" })} />
  );
  // lucide icons render as SVG elements
  expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
});

test("renders no icon for unknown tools", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={call("unknown_tool", {})} />
  );
  // Only the state indicator svg (green dot is a div, not svg), no icon svg
  expect(container.querySelectorAll("svg").length).toBe(0);
});
