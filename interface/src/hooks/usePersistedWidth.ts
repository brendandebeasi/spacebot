import {useCallback, useEffect, useRef, useState} from "react";

const DEBOUNCE_MS = 250;

/** Single-value width persistence hook backed by localStorage. Used for
 * resizable layout dividers where we want the user's choice to survive
 * reloads. Writes are debounced so dragging doesn't spam storage. */
export function usePersistedWidth(key: string, defaultPx: number) {
	const [width, setWidthState] = useState<number>(() => {
		if (typeof window === "undefined") return defaultPx;
		const raw = localStorage.getItem(key);
		const parsed = raw ? Number(raw) : NaN;
		return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPx;
	});

	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			try {
				localStorage.setItem(key, String(width));
			} catch {
				/* localStorage may be unavailable — silently ignore */
			}
		}, DEBOUNCE_MS);
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, [key, width]);

	const setWidth = useCallback((value: number) => {
		setWidthState(Math.round(value));
	}, []);

	return {width, setWidth};
}
