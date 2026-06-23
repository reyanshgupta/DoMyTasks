import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PriorityBadge } from "@/components/PriorityBadge";

describe("PriorityBadge", () => {
  it("renders nothing for priority 0", () => {
    const { container } = render(<PriorityBadge priority={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders label for non-zero priority", () => {
    render(<PriorityBadge priority={2} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });
});

describe("CompleteCircle", () => {
  it("calls onClick without bubbling", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onParentClick = vi.fn();
    const { CompleteCircle } = await import("@/components/CompleteCircle");

    render(
      <div onClick={onParentClick}>
        <CompleteCircle done={false} onClick={onClick} />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Complete task" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("shows undo label when done", async () => {
    const { CompleteCircle } = await import("@/components/CompleteCircle");
    render(<CompleteCircle done onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Mark task incomplete" })).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders optional action", async () => {
    const onAction = vi.fn();
    const { EmptyState } = await import("@/components/EmptyState");

    render(
      <EmptyState
        title="No tasks"
        description="Create one to get started"
        actionLabel="New task"
        onAction={onAction}
      />,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "New task" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
