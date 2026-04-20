"use client";

import { Loader2, FilePlus, FilePen, Eye, Undo2, FolderInput, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolInvocation } from "ai";

function basename(path: string): string {
  return path.split("/").pop() || "file";
}

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>
): { text: string; Icon: LucideIcon | null } {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = basename(path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return { Icon: FilePlus, text: `Creating ${filename}` };
      case "str_replace":
      case "insert":
        return { Icon: FilePen, text: `Editing ${filename}` };
      case "view":
        return { Icon: Eye, text: `Reading ${filename}` };
      case "undo_edit":
        return { Icon: Undo2, text: `Undoing edit in ${filename}` };
      default:
        return { Icon: FilePen, text: `Editing ${filename}` };
    }
  }

  if (toolName === "file_manager") {
    const newPath = typeof args.new_path === "string" ? args.new_path : "";
    switch (args.command) {
      case "rename":
        return { Icon: FolderInput, text: `Renaming ${filename} → ${basename(newPath)}` };
      case "delete":
        return { Icon: Trash2, text: `Deleting ${filename}` };
    }
  }

  return { Icon: null, text: toolName };
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state } = toolInvocation;
  const done = state === "result";
  const { Icon, text } = getToolLabel(toolName, args as Record<string, unknown>);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 text-neutral-500" />}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
