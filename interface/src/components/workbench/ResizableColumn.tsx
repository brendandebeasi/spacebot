import {useEffect, useRef, type ReactNode} from "react";
import {
	Resizable,
	ResizableHandle,
	ResizablePanel,
	useResizableContext,
} from "@spacedrive/primitives";

const DEFAULT_COLUMN_WIDTH = 560;
const MIN_COLUMN_WIDTH = 360;

interface ResizableColumnProps {
	index: number;
	isLast: boolean;
	widths: Record<number, number>;
	setWidth: (index: number, value: number) => void;
	columnRef: (el: HTMLDivElement | null) => void;
	children: ReactNode;
}

/** Wraps a workbench column in a horizontal Resizable. The handle on the
 * right edge lets the user drag to widen / narrow this column. The last
 * column in the row is rendered without a Resizable wrapper so it
 * flex-fills any remaining horizontal space — that way the workbench
 * never has dead pixels at the right edge regardless of how many
 * columns are present.
 *
 * Width persistence is keyed by column position (not worker id), so the
 * layout remains stable as workers come and go. */
export function ResizableColumn({
	index,
	isLast,
	widths,
	setWidth,
	columnRef,
	children,
}: ResizableColumnProps) {
	if (isLast) {
		// Last column flex-fills to consume remaining width — no resizer.
		return (
			<div ref={columnRef} className="flex h-full min-w-[360px] flex-1">
				{children}
			</div>
		);
	}

	const initial = widths[index] ?? DEFAULT_COLUMN_WIDTH;

	return (
		<Resizable axis="x" initial={initial} min={MIN_COLUMN_WIDTH}>
			{/* shrink-0 holds the user-set width even when total > viewport;
			    horizontal overflow on the parent provides the scroll fallback. */}
			<div ref={columnRef} className="flex h-full shrink-0">
				<ResizablePanel className="flex h-full overflow-hidden">
					{children}
				</ResizablePanel>
				<WidthReporter index={index} setWidth={setWidth} />
				<ResizableHandle
					aria-orientation="vertical"
					className="relative shrink-0 hover:bg-accent/20 after:!opacity-30 hover:after:!opacity-100"
				/>
			</div>
		</Resizable>
	);
}

/** Side-channel that watches the Resizable context's `position` and pushes
 * to the persistence hook when the user finishes dragging. We commit on
 * drag end (rather than every move) to keep localStorage writes bounded.
 *
 * `position` is read via a ref so we capture its final value without
 * adding it to the effect deps (which would re-fire mid-drag). `wasDragging`
 * gates the save to true→false transitions only, so we don't write the
 * initial position to storage on mount. */
function WidthReporter({
	index,
	setWidth,
}: {
	index: number;
	setWidth: (index: number, value: number) => void;
}) {
	const {position, isDragging} = useResizableContext();
	const positionRef = useRef(position);
	positionRef.current = position;
	const wasDraggingRef = useRef(false);
	useEffect(() => {
		if (wasDraggingRef.current && !isDragging) {
			setWidth(index, positionRef.current);
		}
		wasDraggingRef.current = isDragging;
	}, [isDragging, index, setWidth]);
	return null;
}
