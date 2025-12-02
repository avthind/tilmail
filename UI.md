# UI Design System

Implement the following UI design system for the envelope/postcard web app.

## 🎨 Color Palette (Minimal + Cute + Modern)

Use these as design tokens / CSS variables:

```css
--pure-white: #FFFFFF;
--soft-sand: #F6F1EB;
--blush-pink: #F7C9D4;
--peach-cream: #FFEDE1;
--baby-blue: #BEE3F8;

--grey-900: #3A3A3A;
--grey-600: #6F6F6F;
--grey-200: #E4E4E4;

--mint: #C5F3DA;
```

### Usage:
- Main background: pure white
- Toolbars + drawers: soft sand (with 75% opacity + blur)
- Primary accent: blush pink
- Secondary accent: peach cream
- Subtle highlight: baby blue
- Success/confirmation: mint

Keep the entire UI airy, warm, pastel, and minimal.

## 🔤 Typography

Use these fonts (Google Fonts):
- Main UI: Inter or SF Pro
- Cute headers / friendly labels: Nunito or Quicksand
- Handwritten text option: Kalam or Architect's Daughter

Typography is simple, rounded, soft.

## 🧩 Layout Structure

### Main Screen
- Full white background `#FFFFFF`
- Centered 3D envelope (react-three-fiber)
- Soft shadow around envelope (40–60px blur, 5% opacity)

### Bottom Toolbar (primary controls)
- Positioned at bottom, horizontally
- Style:
  - `background: rgba(246, 241, 235, 0.75)` (soft sand)
  - `backdrop-filter: blur(12px)`
  - `border-radius: 16px 16px 0 0`
  - `padding: 12–16px`
- Icons equally spaced
- Selected icon underlined with blush pink
- Icon interaction:
  - soft bounce animation (scale 1 → 1.1 → 1)
  - color shift: grey → blush pink

### Toolbar buttons:
- Stickers
- Text
- Draw
- View (Front/Back/Card)
- Open/Close Envelope
- Send

### Floating Action Button (optional)
- Position: bottom-right
- Color: blush pink `#F7C9D4`
- Icon color: white
- Shadow: `0 4px 20px rgba(0,0,0,0.08)`

## 🌸 Drawers & Popovers

### Sticker/Text Drawer
- Side drawer from left or bottom
- Background: pure white OR peach cream `#FFEDE1`
- Rounded corners: 16px
- Soft shadows
- Sticker grid: 3 columns, rounded tiles

### Tool Settings Popover
- Background: `#FFF8F9` (very soft pink)
- Border radius: 12px
- Shadow: `0 10px 30px rgba(0,0,0,0.05)`
- Minimal UI controls

## 💌 Envelope Animations
- Soft ease-out animation
- Light bounce on open/close
- Add peach glow on open:
  - `box-shadow: 0 0 40px rgba(255, 237, 225, 0.8);`

## 🎀 Aesthetic Principles

Implement the UI using:
- Minimal whitespace-forward layout
- Pastel, warm hues
- Soft rounded corners
- Subtle shadows
- Translucent floating surfaces
- Clean iconography
- Friendly interactions and micro-animations

### Overall vibe:
minimal + cute + modern + airy + stationery-core
