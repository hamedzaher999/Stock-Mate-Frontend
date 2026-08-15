# Red Crescent Hospital Management System — Design Guidelines

## Stance: Swiss International Style
Strict grid, predominantly neutral surfaces, red as the single purposeful accent. Every element earns its space. Function declares the aesthetic.

## Color Tokens
- `--color-primary`: #C8102E (Red Crescent red)
- `--color-primary-foreground`: #FFFFFF
- `--color-bg`: #F5F6FA
- `--color-surface`: #FFFFFF
- `--color-border`: #E2E4EC
- `--color-muted`: #F0F1F6
- `--color-muted-fg`: #8B90A4
- `--color-success`: #1A7F4E
- `--color-warning`: #B45309
- `--color-danger`: #C8102E
- `--color-info`: #1D4ED8

## Typography
- Display/headings: Geist (geometric humanist sans — clinical, modern)
- Body: Inter (highly readable, neutral)
- Mono (data, codes, numbers): JetBrains Mono

## Aesthetic Rules
- Cards: `rounded-2xl`, soft shadow (`shadow-sm`), white background on light gray page
- Red is reserved for: primary CTA buttons, active nav, error/alert badges, required indicators
- Borders: `1px solid var(--color-border)` — organize, never dominate
- Spacing scale: generous — clinical whitespace signals professionalism
- RTL: use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) via Tailwind
