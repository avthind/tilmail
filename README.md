# TILmail

A web application for creating and sharing digital postcards. Create personalized cards with stickers, drawings, and text, then share them with friends and family via shareable links.

## Features

### Card Editor
- **Sticker Library**: Decorate cards with a variety of stickers organized by category (animals, food, Christmas, and more)
- **Drawing Tools**: Freehand drawing with customizable brush
- **Text Tool**: Add custom messages with text editing capabilities
- **Dual Sides**: Create both front and back of your postcard
- **Interactive Elements**: 
  - Rotate, resize, and position decorations
  - Undo/redo functionality
  - Copy, paste, and duplicate decorations
  - Select and remove decorations

### Card Viewer
- View shared cards in read-only mode
- Flip between front and back sides
- Responsive design for mobile and desktop

### Sharing
- Generate unique shareable links for each card
- Copy link to clipboard
- Native share API support (mobile devices)
- Cards are stored in Firebase and accessible via unique URLs

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18
- **3D Graphics**: Three.js with React Three Fiber and Drei
- **State Management**: Zustand
- **Backend**: Firebase
  - Firestore for card data storage
  - Storage for asset management
- **Error Tracking**: Sentry (optional)
- **Deployment**: Firebase Hosting

## License

Private project - All rights reserved

## Attribution

Brought to you by [theinvitelab.com](https://theinvitelab.com)

Stickers sourced from [blush.design](https://blush.design)

