import { invoke } from "@tauri-apps/api/core";
import type {
  KanbanBoard,
  KanbanTask,
  KanbanTaskDetail,
  KanbanCreateTaskInput,
  KanbanResult,
  KanbanDataResult,
} from "@shared/api-types";

export function kanbanListBoards(
  includeArchived?: boolean,
  profile?: string,
): Promise<KanbanDataResult<KanbanBoard[]> & { unsupportedMode?: boolean }> {
  return invoke("kanban_list_boards", { includeArchived, profile });
}
export function kanbanCurrentBoard(
  profile?: string,
): Promise<KanbanDataResult<string>> {
  return invoke("kanban_current_board", { profile });
}
export function kanbanSwitchBoard(
  slug: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_switch_board", { slug, profile });
}
export function kanbanCreateBoard(
  slug: string,
  name?: string,
  switchAfter?: boolean,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_create_board", { slug, name, switchAfter, profile });
}
export function kanbanRemoveBoard(
  slug: string,
  hardDelete?: boolean,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_remove_board", { slug, hardDelete, profile });
}
export function kanbanListTasks(filters?: {
  status?: string;
  assignee?: string;
  tenant?: string;
  includeArchived?: boolean;
  profile?: string;
}): Promise<KanbanDataResult<KanbanTask[]>> {
  return invoke("kanban_list_tasks", { filters });
}
export function kanbanGetTask(
  taskId: string,
  profile?: string,
): Promise<KanbanDataResult<KanbanTaskDetail>> {
  return invoke("kanban_get_task", { taskId, profile });
}
export function kanbanCreateTask(
  input: KanbanCreateTaskInput,
  profile?: string,
): Promise<KanbanDataResult<{ id: string }>> {
  return invoke("kanban_create_task", { input, profile });
}
export function kanbanAssignTask(
  taskId: string,
  assignee: string | null,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_assign_task", { taskId, assignee, profile });
}
export function kanbanCompleteTask(
  taskId: string,
  result?: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_complete_task", { taskId, result, profile });
}
export function kanbanBlockTask(
  taskId: string,
  reason?: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_block_task", { taskId, reason, profile });
}
export function kanbanUnblockTask(
  taskId: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_unblock_task", { taskId, profile });
}
export function kanbanArchiveTask(
  taskId: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_archive_task", { taskId, profile });
}
export function kanbanSpecifyTask(
  taskId: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_specify_task", { taskId, profile });
}
export function kanbanReclaimTask(
  taskId: string,
  reason?: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_reclaim_task", { taskId, reason, profile });
}
export function kanbanCommentTask(
  taskId: string,
  body: string,
  profile?: string,
): Promise<KanbanResult> {
  return invoke("kanban_comment_task", { taskId, body, profile });
}
export function kanbanDispatchOnce(
  dryRun?: boolean,
  profile?: string,
): Promise<KanbanDataResult<unknown>> {
  return invoke("kanban_dispatch_once", { dryRun, profile });
}
