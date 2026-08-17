import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
	// Общий конфиг плагинов для сборки библиотеки
	const libConfig = {
		plugins: [dts({ include: ["src"], rollupTypes: true, insertTypesEntry: true })],
		build: {
			lib: {
				entry: resolve(__dirname, "src/index.ts"),
				name: "MetalStructureDiagrams",
				fileName: (format) => `metal-structure-diagrams.${format === "es" ? "js" : "cjs"}`,
				formats: ["es", "cjs"],
			},
			rollupOptions: { external: ["d3-path", "d3-scale"] },
			sourcemap: true,
			minify: false,
			outDir: "dist",
		},
	};

	// В режиме dev (npm run dev) используем playground как корень
	if (mode === "development") {
		return {
			root: "playground",
			server: { port: 5173 },
		};
	}

	// В режиме build (npm run build) собираем библиотеку
	return libConfig;
});
