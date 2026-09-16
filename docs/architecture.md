# Shield Configurator Architecture

Branch: `visual-panel-builder`

## Goal
Fast configurator for apartment/house distribution boards. The engineer should be able to describe the incoming supply and outgoing circuits during a phone call and get:

- visual DIN-rail board layout;
- simplified single-line diagram;
- module usage / reserve;
- equipment list;
- printable PDF summary.

## Stack
- **Floot** — live full-stack application and UI.
- **Supabase** — catalog of manufacturers, device types, series, devices, load icons, templates and later saved projects.
- **Figma** — source of truth for screen/component design.
- **Mermaid Chart** — quick single-line logic prototypes before implementing the production SVG renderer.
- **GitHub** — versioning, review branch and migration/reference files.

## Core data model
`manufacturers` → `device_series` → `devices`; `device_types` describes electrical function and designation prefix; `load_icons` provides user-facing circuit categories; `project_templates` stores starter apartment/house presets; `projects` and `project_devices` are reserved for persistence once authentication/token ownership is finalized.

## Board rendering
A board has `cabinet_modules` and a `rail_modules` width. Each device has a module width. Layout is packed left-to-right and rail-to-rail while keeping explicit reserve/blank slots. The visual renderer is front-facing and proportioned in 18 mm DIN module units.

## Single-line rendering
The same project state feeds a separate electrical graph: source → incoming switch → optional voltage relay / SPD / RCCB → bus → outgoing MCB/RCBO branches. Mermaid is used for prototyping only; production output remains an editable SVG/React view.

## Safety / engineering scope
The tool is intended for fast visualization and preliminary configuration. Nominals and protection settings remain editable and are not treated as a substitute for project calculations, selectivity checks or regulatory design review.
