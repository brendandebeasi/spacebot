import {useCallback, useEffect, useRef, useState} from "react";

const STORAGE_KEY = "spacebot-workbench-column-widths";
const DEBOUNCE_MS = 250;

/** Per column-position width persistence for the workbench.
 *
 * Keyed by zero-based column index, NOT by worker id. This keeps the layout
 * stable across worker churn — e.g. if you've widened column 1 to 720px and
 * worker A finishes (replaced by worker B in column 1), B inherits the 720px.
 * Trade-off: when the worker list shrinks, saved widths for higher indices
 * still sit in localStorage; harmless until they're needed again. */
export function useColumnWidths() {
	const [widths, setWidths] = useState<Record<number, number>>(() => {
		if (typeof window === "undefined") return {};
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	});

	// Debounce writes — the resizer fires many onResize calls during drag.
	const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (writeTimer.current) clearTimeout(writeTimer.current);
		writeTimer.current = setTimeout(() => {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
			} catch {
				/* localStorage may be full or unavailable — silently ignore */
			}
		}, DEBOUNCE_MS);
		return () => {
			if (writeTimer.current) clearTimeout(writeTimer.current);
		};
	}, [widths]);

	const setWidth = useCallback((index: number, value: number) => {
		setWidths((prev) => ({...prev, [index]: Math.round(value)}));
	}, []);

	const resetAll = useCallback(() => {
		setWidths({});
	}, []);

	return {widths, setWidth, resetAll};
}
