---
version: alpha
name: SpaFlow Salon Management
description: A premium, cinematic SaaS landing page utilizing high-contrast dark mode aesthetics, scroll-driven storytelling, and ethereal glassmorphism for modern salon management.
colors:
  primary: "#bfeeff"
  background: "#050505"
  surface: "#070707"
  text-main: "#ffffff"
  text-muted: "rgba(255, 255, 255, 0.62)"
  border: "rgba(255, 255, 255, 0.1)"
typography:
  headings: "Playfair Display"
  body: "Inter"
  base-size: "16px"
  line-height: 1.55
spacing:
  section-padding: "110px"
  card-gap: "20px"
rounded:
  cards: "30px"
  buttons: "999px"
components:
  - floating-nav
  - glass-card
  - story-card
  - cinema-frame
  - archive-tile
---

## Overview
SpaFlow is characterized by a "cinematic luxury" aesthetic. It uses a high-density dark interface (#050505) with icy cyan accents (#bfeeff) to create a futuristic, professional tone. The layout relies heavily on immersive, scroll-bound transitions where content "gathers," "expands," or "reveals" through layers of depth. It features significant negative space, high-quality photography, and glassmorphic UI elements (blur and transparency) to establish a premium brand identity.

## Colors
- **Deep Black (#050505)**: The primary background color across all sections.
- **Icy Cyan (#bfeeff)**: Used for eyebrows, highlights, active states, and glowing accents.
- **Glass White**: Various opacities of white (e.g., `rgba(255,255,255,0.07)`) used for card backgrounds and borders.
- **Muted Lavender Glow**: Secondary ambient gradient color used in radial background effects.

## Typography
- **Primary Brand Font**: *Playfair Display*. Used for serif italics in headings to provide an elegant, editorial feel.
- **Functional Font**: *Inter*. A clean sans-serif used for body text, navigation, and technical labels.
- **Eyebrows**: Bold, all-caps sans-serif with high letter-spacing (0.24em) and a leading accent line.

## Layout
- **Sticky-Scroll Containers**: Many sections utilize `position: sticky` and `100svh` heights to lock the viewport while internal elements animate.
- **Grid Systems**:
  - **Archive Grid**: A 5-column layout for feature showcases.
  - **Field Editorial Grid**: An asymmetrical 1.15fr / 0.85fr layout.
  - **Floating Navigation**: Centered, rounded bar with a backdrop blur.

## Elevation & Depth
- **Glassmorphism**: Extensive use of `backdrop-filter: blur(18px)` and `inset` white borders to simulate glass.
- **Ambient Glows**: Large, low-opacity radial gradients (cyan and lavender) behind content layers.
- **Shadows**: Deep, soft shadows (e.g., `0 30px 90px rgba(0,0,0,0.42)`) create high separation from the dark background.

## Shapes
- **Pill Shapes**: Used for buttons, navigation containers, and tags.
- **Large Radii**: Component corners are soft, typically ranging from `28px` to `36px` for cards.
- **Orbitals**: Perfect circles used as decorative background elements with glow effects.

## Components
- **Floating Nav**: A fixed, rounded-full bar with `bg-black/35` and `backdrop-blur-2xl`.
- **Magnetic Card**: Interactive cards that translate -8px on hover with enhanced box-shadows.
- **Story Card**: Deep-shadowed, vertical containers used in the horizontal scroll section.
- **Cinema Frame**: Floating image containers with 3D rotation (`rotateY`, `rotateZ`) and scale effects.
- **Field Tags**: Small, pill-shaped labels with a cyan dot indicator.

## Page Sections
### Loading Intro
A high-z-index overlay with a radial gradient and a centering brand mark. Animates a progress line and brand title using blur-to-clear transitions.

### Hero Section
Full-screen (100dvh) visual with a "reveal" layer system.
- **Content**: Left-aligned oversized H1 with dual-font treatment (Sans/Playfair Italic).
- **Visuals**: Background images use a zoom animation (`scale(1.12)` to `1`).
- **Scrim**: Complex radial and linear gradients ensure text legibility over photography.

### Story Scroll
A horizontal scrolling showcase of "Chapters". Features a progress bar at the bottom and a vertical "Orbit" graphic that rotates and scales based on scroll depth.

### Scroll Cinema
A narrative section where three frames (`online booking`, `digital intake`, `checkout`) float in 3D space over a blurred background. Includes a step-indicator at the bottom (01-04) that activates based on scroll.

### Gather Section
A cinematic text effect where scattered words (`Every`, `tool`, `gathered`, `into`, `one`, `platform`) move from random X/Y coordinates into a unified sentence at the center of the screen.

### Feature Archive
A responsive grid of images that expands and contracts. Uses CSS variables (`--tile-x`, `--tile-y`) to control the spread of the grid tiles.

### Field Notes
An editorial-style section with a featured large card and a side stack of smaller "Note" cards. Features a marquee-style text track at the bottom.

## Motion & Interaction
- **Scroll Progress**: A vertical rail on the right side of the screen tracks the total page scroll.
- **Parallax Media**: Media elements use `scale(1.06)` and `translate3d` to create depth during scroll.
- **Hover States**: Links and cards use `cubic-bezier(.16, 1, .3, 1)` for snappy yet fluid transitions.
- **Text Masks**: Headings reveal via vertical translation (`translateY(110%)` to `0`).

## Do's and Don'ts
- **Do**: Use high-contrast between white text and black backgrounds.
- **Do**: Maintain generous whitespace between section components.
- **Don't**: Use sharp corners; always use radii above 20px for major containers.
- **Don't**: Use heavy solid colors for backgrounds; prefer gradients and blurs.

## Accessibility
- **Reduced Motion**: All animations include `prefers-reduced-motion` overrides that set durations to 0s and remove transforms.
- **Color Contrast**: High-contrast white text on black background ensures readability.
- **Semantic HTML**: Uses `nav`, `main`, `section`, and `article` landmarks.

## Assets
1. **Background Images**:
   - Base: `https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=3840&q=90`
   - Reveal: `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=3840&q=90`
   - Floral: `https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2200&q=90`
   - Vision: `https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=90`
2. **Product Shots**:
   - Product 1: `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=90`
   - Product 2: `https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1400&q=90`
   - Product 3: `https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1400&q=90`
3. **Scripts**:
   - Tailwind: `https://cdn.tailwindcss.com`
   - Icons: `https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js`
4. **Fonts**:
   - Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600&display=swap`
