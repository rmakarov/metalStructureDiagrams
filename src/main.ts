import { instantiate, template } from "./engine";
import { render } from "./renderer";
import { buildBom, renderBom } from "./bom";

function update() {
	const params: Record<string, number> = {};
	for (const key of Object.keys(template.params)) {
		const input = document.getElementById(key) as HTMLInputElement;
		params[key] = parseFloat(input.value);
	}
	const model = instantiate(params);
	document.getElementById("canvas")!.innerHTML = render(model);
	document.getElementById("bom")!.innerHTML = renderBom(buildBom(model));
}

// Инициализация
for (const [key, def] of Object.entries(template.params)) {
	const input = document.getElementById(key) as HTMLInputElement;
	input.value = String(def.default);
	input.min = String(def.min);
	input.max = String(def.max);
	input.step = String(def.step);
	input.addEventListener("input", update);
}

update();
