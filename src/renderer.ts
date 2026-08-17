import { path } from "d3-path";
import type { GateModel, ResolvedElement } from "./types";

function bbox(model: GateModel): [number, number, number, number] {
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
	for (const el of model.elements) {
		for (const p of [el.from, el.to]) {
			if (p[0] < minX) minX = p[0];
			if (p[0] > maxX) maxX = p[0];
			if (p[1] < minY) minY = p[1];
			if (p[1] > maxY) maxY = p[1];
		}
	}
	return [minX, minY, maxX, maxY];
}

/** Размерные линии */
function dimH(x1: number, x2: number, baseY: number, offset: number, label: string, X: (x: number) => number, Y: (y: number) => number): string {
	const EXT = 10;
	const y = Y(baseY + offset);
	const p = path();
	p.moveTo(X(x1), Y(baseY));
	p.lineTo(X(x1), y + EXT * Math.sign(offset));
	p.moveTo(X(x2), Y(baseY));
	p.lineTo(X(x2), y + EXT * Math.sign(offset));
	p.moveTo(X(x1), y);
	p.lineTo(X(x2), y);
	const TICK = 6;
	for (const x of [x1, x2]) {
		p.moveTo(X(x) - TICK / 2, y - TICK / 2);
		p.lineTo(X(x) + TICK / 2, y + TICK / 2);
	}
	return `<g class="dim" stroke="#000" stroke-width="0.8" fill="none">
    <path d="${p.toString()}"/>
    <text x="${(X(x1) + X(x2)) / 2}" y="${y - 5}" text-anchor="middle"
        font-size="14" fill="#000" font-family="Arial">${label}</text>
    </g>`;
}

function dimV(y1: number, y2: number, baseX: number, offset: number, label: string, X: (x: number) => number, Y: (y: number) => number): string {
	const EXT = 10;
	const x = X(baseX + offset);
	const p = path();
	p.moveTo(X(baseX), Y(y1));
	p.lineTo(x + EXT * Math.sign(offset), Y(y1));
	p.moveTo(X(baseX), Y(y2));
	p.lineTo(x + EXT * Math.sign(offset), Y(y2));
	p.moveTo(x, Y(y1));
	p.lineTo(x, Y(y2));
	const TICK = 6;
	for (const y of [y1, y2]) {
		p.moveTo(x - TICK / 2, Y(y) - TICK / 2);
		p.lineTo(x + TICK / 2, Y(y) + TICK / 2);
	}
	const midY = (Y(y1) + Y(y2)) / 2;
	return `<g class="dim" stroke="#000" stroke-width="0.8" fill="none">
    <path d="${p.toString()}"/>
    <text x="${x - 6}" y="${midY}" text-anchor="end" dominant-baseline="middle"
        font-size="14" fill="#000" font-family="Arial">${label}</text>
    </g>`;
}

/** Стили по роли */
const STYLES = {
	frame: { stroke: "#1a365d", width: 2.8, cap: "square" },
	inner: { stroke: "#2c5282", width: 1.6, cap: "butt" },
	brace: { stroke: "#4a5568", width: 1.2, cap: "round" },
	cladding: { stroke: "#a0aec0", width: 0.8, cap: "butt" },
};

export function render(model: GateModel, width = 900, height = 600): string {
	const [minX, minY, maxX, maxY] = bbox(model);
	const W = maxX - minX,
		H = maxY - minY;
	const PAD = 120;

	const scale = Math.min((width - 2 * PAD) / W, (height - 2 * PAD) / H);
	const X = (x: number) => PAD + (x - minX) * scale;
	const Y = (y: number) => height - PAD - (y - minY) * scale;

	const layers: Record<string, string[]> = {
		cladding: [],
		inner: [],
		brace: [],
		frame: [],
		dims: [],
	};

	// ── 1. Обшивка (серый фон, как в иконке) ─────────────────────
	if (model.cladding) {
		const c = model.cladding;
		const x1 = Math.min(X(c.from[0]), X(c.to[0]));
		const y1 = Math.min(Y(c.from[1]), Y(c.to[1]));
		const w = Math.abs(X(c.to[0]) - X(c.from[0]));
		const h = Math.abs(Y(c.to[1]) - Y(c.from[1]));
		layers.cladding.push(
			`<rect x="${x1}" y="${y1}" width="${w}" height="${h}"
            fill="${c.fill}" stroke="${c.stroke}" />`,
		);
	}

	// ── 2. Каркас: внутренние перемычки и раскосы ────────────────
	for (const el of model.elements) {
		if (el.role === "frame") continue; // рисуем последним (сверху)

		const d = path();
		d.moveTo(X(el.from[0]), Y(el.from[1]));
		d.lineTo(X(el.to[0]), Y(el.to[1]));

		const s = STYLES[el.role] ?? STYLES.inner;
		const layer = el.role === "brace" ? "brace" : "inner";
		layers[layer].push(
			`<path d="${d.toString()}" stroke="${s.stroke}" stroke-width="${s.width}"
            fill="none" stroke-linecap="${s.cap}"/>`,
		);
	}

	// ── 3. Рама — сверху, самая толстая ──────────────────────────
	for (const el of model.elements) {
		if (el.role !== "frame") continue;
		const d = path();
		d.moveTo(X(el.from[0]), Y(el.from[1]));
		d.lineTo(X(el.to[0]), Y(el.to[1]));
		const s = STYLES.frame;
		layers.frame.push(
			`<path d="${d.toString()}" stroke="${s.stroke}" stroke-width="${s.width}"
            fill="none" stroke-linecap="${s.cap}"/>`,
		);
	}

	// ── 4. Размерные линии ───────────────────────────────────────
	for (const dim of model.dimensions) {
		const len = Math.round(Math.abs(dim.to - dim.from));
		if (dim.type === "h") {
			layers.dims.push(dimH(dim.from, dim.to, dim.at, dim.offset, `${len}`, X, Y));
		} else {
			layers.dims.push(dimV(dim.from, dim.to, dim.at, dim.offset, `${len}`, X, Y));
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
            viewBox="0 0 ${width} ${height}" style="font-family: Arial, sans-serif;">
    <rect width="100%" height="100%" fill="#fff"/>
    ${layers.cladding.join("")}
    ${layers.inner.join("")}
    ${layers.brace.join("")}
    ${layers.frame.join("")}
    ${layers.dims.join("")}
</svg>`;
}
