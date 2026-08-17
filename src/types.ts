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

export interface ElementDef {
	id: string;
	type: "line" | "repeat";
	role: "frame" | "inner" | "cladding";
	from: (number | string)[] | string;
	to: (number | string)[] | string;
	count?: number;
	material?: string; // ключ из materials; если нет — берётся по role
}

export interface DimDef {
	type: "h" | "v";
	from: number | string;
	to: number | string;
	at: number | string;
	offset: number; // в мм, от контура
}

export interface Template {
	id: string;
	name: string;
	params: Record<string, ParamDef>;
	materials: Record<string, Material>;
	nodes: Record<string, (number | string)[]>;
	elements: ElementDef[];
	dimensions: DimDef[];
}

export interface ResolvedElement {
	id: string;
	role: "frame" | "inner" | "cladding";
	material: Material;
	from: [number, number];
	to: [number, number];
	length: number;
}

export interface GateModel {
	name: string;
	params: Record<string, number>;
	elements: ResolvedElement[];
	dimensions: Array<{ type: "h" | "v"; from: number; to: number; at: number; offset: number }>;
}
