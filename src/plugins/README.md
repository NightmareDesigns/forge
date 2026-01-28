Plugin system
================

Place plugin metadata in `plugins.json` and implementation modules in `impl/`.

- Manifest: `src/plugins/plugins.json` – list of plugins, GPU capability, icon and enabled state.
- Manager: `src/plugins/PluginManager.js` – helper to list, enable/disable, and load plugin modules.
- Implementations: `src/plugins/impl/<plugin-id>.js` – modules should export an `init(appContext)` function.

GPU plugins
-----------
Mark plugins with `"gpu": true` when they can use accelerated compute. The application should
verify GPU availability and only enable those plugins when the environment supports the required
APIs (WebGPU/Metal/DirectX/OpenCL) and licensing for any native dependencies.

Icons
-----
Tiny SVG icons are located under `assets/icons/tiny/`. Use these or add your own icons and
update `plugins.json` to reference them.
