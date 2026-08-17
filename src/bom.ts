import type { GateModel } from "./types";

export interface BomRow {
	no: number;
	material: string;
	length: number;
	qty: number;
}

export function buildBom(model: GateModel): BomRow[] {
	const map = new Map<string, { material: string; length: number; qty: number }>();
	for (const el of model.elements) {
		const key = `${el.material.name}|${Math.round(el.length)}`;
		const row = map.get(key);
		if (row) row.qty++;
		else
			map.set(key, {
				material: el.material.name,
				length: Math.round(el.length),
				qty: 1,
			});
	}
	return [...map.values()].sort((a, b) => b.length - a.length).map((r, i) => ({ no: i + 1, ...r }));
}

export function renderBom(rows: BomRow[]): string {
	const rows_html = rows
		.map(
			(r) => `
    <tr>
        <td>${r.no}</td>
        <td>${r.material}</td>
        <td>${r.length} мм</td>
        <td>${r.qty} шт.</td>
    </tr>`,
		)
		.join("");
	return `<table>
    <thead><tr><th>№</th><th>Материал</th><th>Длина</th><th>Кол-во</th></tr></thead>
    <tbody>${rows_html}</tbody>
</table>`;
}
