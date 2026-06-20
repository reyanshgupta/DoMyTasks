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
      className="mt-[-1px] grid h-6 w-4 shrink-0 cursor-grab touch-none place-items-center rounded-[6px] text-[var(--text-muted)] opacity-60 transition-[background-color,color,opacity,transform] duration-200 group-hover:opacity-100 hover:scale-110 hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)] active:cursor-grabbing active:scale-95"
      aria-label="Drag task"
      title="Drag task"
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
    zIndex: isDragging ? 1 : undefined,
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
        <div className="animate-scale-in grid min-h-[120px] place-items-center rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--surface-raised)] transition-colors">
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
      className={`flex min-w-[270px] flex-1 flex-col overflow-hidden rounded-[8px] border transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out ${
        isOver
          ? "scale-[1.01] border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-md)]"
          : "border-[var(--border-subtle)] bg-[var(--kanban-column)]"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--kanban-header)] px-4 py-3 transition-colors">
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

  function targetStatusFor(overId: string): TaskStatus | null {
    if (STATUSES.has(overId)) return overId as TaskStatus;
    return taskMap.get(overId)?.status || null;
  }

  function taskIdsFor(status: TaskStatus): string[] {
    return board.columns.find((col) => col.status === status)?.tasks.map((task) => task.id) || [];
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = taskMap.get(taskId);
    if (!task) return;

    const overId = String(over.id);
    const targetStatus = targetStatusFor(overId);

    if (targetStatus && targetStatus !== task.status) {
      await onMove(taskId, targetStatus);
      return;
    }

    if (manualSort && targetStatus === task.status && overId !== taskId && !STATUSES.has(overId)) {
      const ids = taskIdsFor(task.status);
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="animate-fade-up stagger-2 flex gap-3 overflow-x-auto pb-6">
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
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeTask ? (
          <div className="rotate-1 scale-[1.03] opacity-95 shadow-[var(--shadow-lg)]">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
