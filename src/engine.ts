import templateData from "./template.json";
import type { Template, GateModel, ResolvedElement, ResolvedCladding } from "./types";

const template: Template = templateData as Template;

/**
 * Безопасный eval выражений типа "W + W*counterRatio".
 */
function evalExpr(expr: number | string, ctx: Record<string, number>): number {
	if (typeof expr === "number") return expr;
	const keys = Object.keys(ctx);
	const values = Object.values(ctx);
	try {
		// eslint-disable-next-line no-new-func
		return Function(...keys, `'use strict'; return (${expr});`)(...values);
	} catch (e) {
		throw new Error(`Ошибка в выражении "${expr}": ${(e as Error).message}`);
	}
}

/**
 * Разрешает точку. Может быть:
 *  - имя узла: "BL"
 *  - массив координат: ["W", "H/2"]
 */
function resolvePoint(point: (number | string)[] | string, resolvedNodes: Record<string, [number, number]>, ctx: Record<string, number>): [number, number] {
	// Случай 1: имя узла
	if (typeof point === "string" && resolvedNodes[point]) {
		return resolvedNodes[point];
	}

	// Случай 2: массив координат
	if (Array.isArray(point)) {
		return [evalExpr(point[0], ctx), evalExpr(point[1], ctx)];
	}

	// Случай 3: строка "x,y" (запасной вариант)
	if (typeof point === "string") {
		const parts = point.split(",").map((s) => s.trim());
		if (parts.length === 2) {
			return [evalExpr(parts[0], ctx), evalExpr(parts[1], ctx)];
		}
	}

	throw new Error(`Не удалось разрешить точку: ${JSON.stringify(point)}`);
}

function materialForElement(el: { role: string; material?: string }, materials: Template["materials"]): ResolvedElement["material"] {
	if (el.material && materials[el.material]) return materials[el.material];
	if (el.role === "frame") return materials.frame;
	if (el.role === "brace") return materials.brace ?? materials.inner;
	return materials.inner;
}

/**
 * Главный метод: инстанцирует шаблон с заданными параметрами.
 */
export function instantiate(params: Record<string, number>): GateModel {
	const ctx: Record<string, number> = { ...params };

	// ── Шаг 1: разрешаем все узлы ────────────────────────────────
	const resolvedNodes: Record<string, [number, number]> = {};
	for (const [name, def] of Object.entries(template.nodes)) {
		const [xExpr, yExpr] = def;
		resolvedNodes[name] = [evalExpr(xExpr, ctx), evalExpr(yExpr, ctx)];
	}

	// ── Шаг 2: разрешаем элементы ────────────────────────────────
	const elements: ResolvedElement[] = [];

	for (const el of template.elements) {
		const mat = materialForElement(el, template.materials);

		if (el.type === "line") {
			const from = resolvePoint(el.from, resolvedNodes, ctx);
			const to = resolvePoint(el.to, resolvedNodes, ctx);
			const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
			elements.push({
				id: el.id,
				role: el.role,
				material: mat,
				from,
				to,
				length,
			});
		} else if (el.type === "repeat") {
			const count = el.count ?? 1;
			for (let i = 0; i < count; i++) {
				const loopCtx = { ...ctx, i, count };
				const from = resolvePoint(el.from, resolvedNodes, loopCtx);
				const to = resolvePoint(el.to, resolvedNodes, loopCtx);
				const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
				elements.push({
					id: `${el.id}-${i + 1}`,
					role: el.role,
					material: mat,
					from,
					to,
					length,
				});
			}
		}
	}

	// ── Шаг 3: cladding ──────────────────────────────────────────
	let cladding: ResolvedCladding | undefined;
	if (template.cladding) {
		cladding = {
			from: resolvedNodes[template.cladding.from],
			to: resolvedNodes[template.cladding.to],
			fill: template.cladding.fill,
			stroke: template.cladding.stroke,
		};
	}

	// ── Шаг 4: размерные линии ───────────────────────────────────
	const dimensions = template.dimensions.map((d) => ({
		type: d.type,
		from: evalExpr(d.from, ctx),
		to: evalExpr(d.to, ctx),
		at: evalExpr(d.at, ctx),
		offset: d.offset,
	}));

	// ── ОТЛАДКА: выводим все узлы и элементы ────────────────────
	console.log("─────────────────────────────────────");
	console.log(`Шаблон: ${template.name}`);
	console.log(`Параметры:`, ctx);
	console.log("─────────────────────────────────────");
	console.log("УЗЛЫ:");
	for (const [name, coords] of Object.entries(resolvedNodes)) {
		console.log(`  ${name.padEnd(6)} → X=${coords[0].toFixed(1).padStart(8)}, Y=${coords[1].toFixed(1).padStart(8)}`);
	}
	console.log("─────────────────────────────────────");
	console.log("ЭЛЕМЕНТЫ:");
	for (const el of elements) {
		console.log(
			`  ${el.id.padEnd(16)}` + `(${el.from[0].toFixed(0)}, ${el.from[1].toFixed(0)}) → ` + `(${el.to[0].toFixed(0)}, ${el.to[1].toFixed(0)})` + `  длина=${el.length.toFixed(0)} мм  роль=${el.role}`,
		);
	}
	console.log("─────────────────────────────────────");

	return {
		name: template.name,
		params,
		elements,
		cladding,
		dimensions,
	};
}

export { template };
