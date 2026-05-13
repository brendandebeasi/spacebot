import {useEffect, useRef, type ReactNode} from "react";
import {
	Resizable,
	ResizableHandle,
	ResizablePanel,
	useResizableContext,
} from "@spacedrive/primitives";
import {usePersistedWidth} from "@/hooks/usePersistedWidth";

interface ResizableSidebarProps {
	/** localStorage key for persisted width. */
	storageKey: string;
	/** Default width in pixels when no persisted value exists. */
	defaultWidth: number;
	/** Minimum allowed width in pixels. */
	minWidth: number;
	children: ReactNode;
}

/** Wraps a sidebar in a horizontal Resizable with a drag handle on its right
 * edge and persisted width keyed by `storageKey`. Width persists only on drag
 * end to avoid spamming localStorage during the drag. */
export function ResizableSidebar({
	storageKey,
	defaultWidth,
	minWidth,
	children,
}: ResizableSidebarProps) {
	const {width, setWidth} = usePersistedWidth(storageKey, defaultWidth);

	return (
		<Resizable axis="x" initial={width} min={minWidth}>
			{/* shrink-0 holds the chosen width even when sibling content
			    pressures the flex row to compress. */}
			<div className="flex h-full shrink-0">
				<ResizablePanel className="flex h-full overflow-hidden">
					{children}
				</ResizablePanel>
				<WidthReporter setWidth={setWidth} />
				<ResizableHandle
					aria-orientation="vertical"
					className="relative shrink-0 hover:bg-accent/20 after:!opacity-30 hover:after:!opacity-100"
				/>
			</div>
		</Resizable>
	);
}

/** Side-channel that watches the Resizable context's `position` and pushes
 * to the persistence hook when the user finishes dragging. `position` is
 * read via a ref so we capture its final value without re-firing the effect
 * on every drag tick. `wasDragging` gates the save to true→false transitions
 * so we don't write the initial position to storage on mount. */
function WidthReporter({setWidth}: {setWidth: (value: number) => void}) {
	const {position, isDragging} = useResizableContext();
	const positionRef = useRef(position);
	positionRef.current = position;
	const wasDraggingRef = useRef(false);
	useEffect(() => {
		if (wasDraggingRef.current && !isDragging) {
			setWidth(positionRef.current);
		}
		wasDraggingRef.current = isDragging;
	}, [isDragging, setWidth]);
	return null;
}
