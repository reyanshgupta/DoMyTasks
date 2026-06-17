"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { TaskCard } from "./TaskCard";
import type { KanbanResponse, TaskCard as TaskCardType, TaskStatus } from "@/lib/types";

const STATUSES = new Set(["todo", "doing", "done"]);

function KanbanTask({
  task,
  onClick,
  manualSort,
}: {
  task: TaskCardType;
  onClick: () => void;
  manualSort: boolean;
}) {
  const sortable = useSortable({ id: task.id, disabled: !manualSort });
  const draggable = useDraggable({ id: task.id, disabled: manualSort });

  const active = manualSort ? sortable : draggable;
  const style = {
    transform: CSS.Transform.toString(active.transform),
    transition: "transition" in active ? active.transition : undefined,
    opacity: active.isDragging ? 0.5 : 1,
  };

  const dragListeners = manualSort ? sortable.listeners : draggable.listeners;
  const dragAttributes = manualSort ? sortable.attributes : draggable.attributes;

  return (
    <div ref={active.setNodeRef} style={style} {...dragAttributes}>
      <TaskCard
        task={task}
        onClick={onClick}
        dragHandle={
          <button
            type="button"
            className="cursor-grab text-slate-500 hover:text-slate-300"
            {...dragListeners}
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </button>
        }
      />
    </div>
  );
}

function DroppableColumn({
  status,
  tasks,
  onTaskClick,
  manualSort,
}: {
  status: TaskStatus;
  tasks: TaskCardType[];
  onTaskClick: (id: string) => void;
  manualSort: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const content = (
    <div className="flex min-h-[120px] flex-col gap-2 p-3">
      {tasks.map((task) => (
        <KanbanTask
          key={task.id}
          task={task}
          onClick={() => onTaskClick(task.id)}
          manualSort={manualSort}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[260px] flex-1 flex-col rounded-xl border bg-slate-900/50 ${
        isOver ? "border-blue-500" : "border-slate-800"
      }`}
    >
      <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium uppercase tracking-wide text-slate-400">
        {status} ({tasks.length})
      </div>
      {manualSort ? (
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {content}
        </SortableContext>
      ) : (
        content
      )}
    </div>
  );
}

export function KanbanBoard({
  board,
  sortBy,
  onMove,
  onReorder,
  onTaskClick,
}: {
  board: KanbanResponse;
  sortBy: string;
  onMove: (taskId: string, status: TaskStatus) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onTaskClick: (id: string) => void;
}) {
  const [activeTask, setActiveTask] = useState<TaskCardType | null>(null);
  const manualSort = sortBy === "manual";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const taskMap = new Map<string, TaskCardType>();
  for (const col of board.columns) {
    for (const t of col.tasks) taskMap.set(t.id, t);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = taskMap.get(String(event.active.id));
    if (task) setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = taskMap.get(taskId);
    if (!task) return;

    const overId = String(over.id);

    if (STATUSES.has(overId) && overId !== task.status) {
      await onMove(taskId, overId as TaskStatus);
      return;
    }

    if (manualSort && overId !== taskId && !STATUSES.has(overId)) {
      const col = board.columns.find((c) => c.status === task.status);
      if (!col) return;
      const ids = col.tasks.map((t) => t.id);
      const oldIndex = ids.indexOf(taskId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...ids];
      reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, taskId);
      await onReorder(reordered);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((col) => (
          <DroppableColumn
            key={col.status}
            status={col.status}
            tasks={col.tasks}
            onTaskClick={onTaskClick}
            manualSort={manualSort}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
