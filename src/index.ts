// src/index.ts
import templateData from "./template.json";
import type { Template, GateModel } from "./types";
import { instantiate } from "./engine";
import { render } from "./renderer";
import { buildBom, type BomRow } from "./bom";

// Публичный API — всё, что видит потребитель
export { instantiate, render, buildBom };
export type { Template, GateModel, BomRow };

// Удобная функция «всё в одном вызове»
export interface GenerateResult {
	svg: string;
	bom: BomRow[];
	model: GateModel;
}

export function generateDrawing(params: Record<string, number>, options: { width?: number; height?: number } = {}): GenerateResult {
	const model = instantiate(params);
	const svg = render(model, options.width ?? 900, options.height ?? 600);
	const bom = buildBom(model);
	return { svg, bom, model };
}

// Экспорт шаблона (для чтения метаданных в UI: список параметров, дефолты)
export const template = templateData as Template;
