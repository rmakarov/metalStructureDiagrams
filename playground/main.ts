// import { instantiate, template } from "../src/engine";
// import { render } from "../src/renderer";
// import { buildBom, renderBom } from "../src/bom";

import { generateDrawing, template } from "../src/index";

const controlsEl = document.getElementById("controls")!;
const canvasEl = document.getElementById("canvas")!;
const bomEl = document.getElementById("bom")!;

const inputs: Record<string, HTMLInputElement> = {};

// ── 1. Динамически создаём инпуты из template.params ──────────
for (const [key, def] of Object.entries(template.params)) {
	const label = document.createElement("label");
	label.textContent = def.label;

	const input = document.createElement("input");
	input.type = "number";
	input.value = String(def.default);
	input.min = String(def.min);
	input.max = String(def.max);
	input.step = String(def.step);
	input.addEventListener("input", update);

	label.appendChild(input);
	controlsEl.appendChild(label);
	inputs[key] = input;
}

// ── 2. Читаем текущие значения ────────────────────────────────
function readParams(): Record<string, number> {
	const params: Record<string, number> = {};
	for (const key of Object.keys(inputs)) {
		params[key] = parseFloat(inputs[key].value);
	}
	return params;
}

// ── 3. Перерисовка ────────────────────────────────────────────
function update() {
	const { svg, bom } = generateDrawing(readParams(), { width: 900, height: 560 });
	canvasEl.innerHTML = svg;

	const rows = bom
		.map(
			(r) => `
    <tr><td>${r.no}</td><td>${r.material}</td>
        <td>${r.length} мм</td><td>${r.qty} шт.</td></tr>`,
		)
		.join("");
	bomEl.innerHTML = `
    <table>
    <thead><tr><th>№</th><th>Материал</th><th>Длина</th><th>Кол-во</th></tr></thead>
    <tbody>${rows}</tbody>
    </table>`;
}

update();
