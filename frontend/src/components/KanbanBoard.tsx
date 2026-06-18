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

const COLUMN_META: Record<TaskStatus, { label: string; dot: string }> = {
  todo: {
    label: "To do",
    dot: "bg-[var(--text-muted)]",
  },
  doing: {
    label: "In progress",
    dot: "bg-[var(--doing)]",
  },
  done: {
    label: "Done",
    dot: "bg-[var(--accent)]",
  },
};

function DragHandle({
  listeners,
}: {
  listeners: ReturnType<typeof useSortable>["listeners"] | ReturnType<typeof useDraggable>["listeners"];
}) {
  return (
    <button
      type="button"
      className="mt-[-1px] grid h-6 w-4 shrink-0 cursor-grab place-items-center rounded-[6px] text-[var(--text-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] active:cursor-grabbing"
      aria-label="Drag to reorder"
      {...listeners}
      onClick={(e) => e.stopPropagation()}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="4" cy="2" r="1.2" />
        <circle cx="8" cy="2" r="1.2" />
        <circle cx="4" cy="6" r="1.2" />
        <circle cx="8" cy="6" r="1.2" />
        <circle cx="4" cy="10" r="1.2" />
        <circle cx="8" cy="10" r="1.2" />
      </svg>
    </button>
  );
}

function SortableKanbanTask({
  task,
  onClick,
}: {
  task: TaskCardType;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        onClick={onClick}
        dragHandle={<DragHandle listeners={listeners} />}
      />
    </div>
  );
}

function DraggableKanbanTask({
  task,
  onClick,
}: {
  task: TaskCardType;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        onClick={onClick}
        dragHandle={<DragHandle listeners={listeners} />}
      />
    </div>
  );
}

function KanbanTask({
  task,
  onClick,
  manualSort,
}: {
  task: TaskCardType;
  onClick: () => void;
  manualSort: boolean;
}) {
  if (manualSort) {
    return <SortableKanbanTask task={task} onClick={onClick} />;
  }

  return <DraggableKanbanTask task={task} onClick={onClick} />;
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
  const meta = COLUMN_META[status];

  const content = (
    <div className="flex min-h-[360px] flex-col gap-2.5 p-2.5">
      {tasks.length === 0 ? (
        <div className="grid min-h-[120px] place-items-center rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[13px] font-medium text-[var(--text-muted)]">No tasks</p>
        </div>
      ) : (
        tasks.map((task) => (
          <KanbanTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
            manualSort={manualSort}
          />
        ))
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[270px] flex-1 flex-col overflow-hidden rounded-[16px] border transition-colors duration-200 ${
        isOver
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface-muted)]"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <span className="text-[13px] font-semibold text-[var(--text)]">{meta.label}</span>
        <span className="ml-auto text-[12px] font-semibold tabular-nums text-[var(--text-muted)]">
          {tasks.length}
        </span>
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
      <div className="flex gap-3 overflow-x-auto pb-6">
        {board.columns.map((col, i) => (
          <div
            key={col.status}
            className={`animate-fade-up stagger-${i + 1} flex min-w-[270px] flex-1`}
          >
            <DroppableColumn
              status={col.status}
              tasks={col.tasks}
              onTaskClick={onTaskClick}
              manualSort={manualSort}
            />
          </div>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeTask ? (
          <div className="rotate-1 scale-[1.02] opacity-95">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
