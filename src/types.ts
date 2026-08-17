export interface Material {
	kind: "tube" | "corner" | "sheet";
	w?: number;
	h?: number;
	t?: number;
	name: string;
}

export interface ParamDef {
	default: number;
	min: number;
	max: number;
	step: number;
	label: string;
}

export type ElementRole = "frame" | "inner" | "brace" | "cladding";

export interface ElementDef {
	id: string;
	type: "line" | "repeat";
	role: ElementRole;
	from: (number | string)[] | string;
	to: (number | string)[] | string;
	count?: number;
	material?: string;
}

export interface DimDef {
	type: "h" | "v";
	from: number | string;
	to: number | string;
	at: number | string;
	offset: number;
}

export interface CladdingDef {
	type: "rect";
	from: string;
	to: string;
	fill: string;
	stroke: string;
}

export interface Template {
	id: string;
	name: string;
	params: Record<string, ParamDef>;
	materials: Record<string, Material>;
	nodes: Record<string, (number | string)[]>;
	elements: ElementDef[];
	cladding?: CladdingDef; // ← добавлено
	dimensions: DimDef[];
}

export interface ResolvedElement {
	id: string;
	role: ElementRole; // ← включает 'brace'
	material: Material;
	from: [number, number];
	to: [number, number];
	length: number;
}

export interface ResolvedCladding {
	// ← новый тип
	from: [number, number];
	to: [number, number];
	fill: string;
	stroke: string;
}

export interface GateModel {
	name: string;
	params: Record<string, number>;
	elements: ResolvedElement[];
	cladding?: ResolvedCladding; // ← добавлено
	dimensions: Array<{
		type: "h" | "v";
		from: number;
		to: number;
		at: number;
		offset: number;
	}>;
}
