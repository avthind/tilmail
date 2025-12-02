# RIGHT TOOLBAR (TOOLS)

Purpose: Editing tools for envelope/postcard.

Contains:
- 🖼 Stickers
- ✏️ Text
- 🖍 Draw

## WEB — Right Toolbar (Vertical)

```
 ------------------------------------
|  Stickers (icon)                   |
|  Text (icon)                       | 
|  Draw (icon)                       |
 ------------------------------------
```

### Behavior
- Always visible on right side
- On hover → small tooltip label
- On click:
  - Stickers → opens a side drawer from right
  - Text → places a text box
  - Draw → activates draw mode

### Accessibility
- Click outside closes drawers
- ESC exits active modes

## MOBILE — Right Toolbar (Floating / Edge Button)

• Stickers • Text • Draw (floating right strip)

### Behavior
- Small pill on right edge
- Tapping one expands a mini horizontal menu:
  ```
  [ Stickers ] [ Text ] [ Draw ]
  ```
- Tools adapt for touch:
  - Stickers panel slides from bottom
  - Text auto-focus opens keyboard
  - Draw enables finger drawing

---

# BOTTOM TOOLBAR (CANVAS SWITCHING)

Purpose: Switch between envelope sides + card + send.

Buttons:
- Front (envelope front)
- Back (envelope back)
- Card (postcard that slides out)
- Send (opens sign-in/share flow)

## 🌐 WEB — Bottom Toolbar (Fixed + Centered)

```
 ---------------------------------------------------------
|   Front   |   Back   |    Card    |      Send (pink)   |
 ---------------------------------------------------------
```

### Behavior
- Buttons highlight the active canvas
- Send button stands out with accent color (#F4A9C4)
- Clicking "Card" animates envelope opening

## 📱 MOBILE — Bottom Toolbar (Sticky Footer)

```
[ Front ] [ Back ] [ Card ]      [ SEND ]
```

### Behavior
- First 3 = equal width
- "SEND" = larger, right-aligned pill
- Sticky at bottom, slightly elevated shadow
- Big enough for thumb reach
