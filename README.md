# TILMail

A 3D interactive envelope decoration application where users can create and share personalized digital postcards.

## Tech Stack

- **Frontend**: Next.js 14 (React) + CSS Modules (no Tailwind). Uses react-three-fiber + drei for 3D.
- **Backend**: Firebase (Firestore + Storage).
- **Optional services**: Twilio (SMS), SendGrid (email) for share/send. Short links via Firestore ID.

## Features

- Blank white background, centered rotatable 3D envelope (touch + mouse drag, full 360°).
- Side/bottom toolbar with:
  - Stickers (preloaded PNGs)
  - Draggable text box tool (editable)
  - Minimal pen/crayon drawing (small canvas overlay with undo)
- Ability to decorate outside front/back of envelope (apply stickers/text/draw).
- Animated open envelope (3D) revealing a postcard card that can be decorated with same tools.
- Close animation: postcard slides in, envelope closes.
- Save state (JSON) and generate a public shareable link. Option to send link via phone/email.
- Quick signup: one-step — user supplies phone OR email only (no password). Persist identifier to session/localStorage.
- Minimal, accessible UI, responsive, keyboard accessible where possible.

## Project Structure

```
tilmail/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main editor page
│   ├── card/[id]/         # Public viewer page
│   └── api/               # API routes
│       ├── send-email/    # Email sending endpoint
│       └── send-sms/      # SMS sending endpoint
├── components/            # React components
│   ├── EnvelopeScene.tsx  # Main 3D scene
│   ├── Envelope.tsx       # 3D envelope mesh
│   ├── Postcard.tsx       # 3D postcard mesh
│   ├── EnvelopeFace.tsx   # Face decoration renderer
│   ├── EnvelopeClickHandler.tsx # Click/touch handler
│   ├── Toolbar.tsx        # Main toolbar
│   ├── StickerPicker.tsx # Sticker selection
│   ├── TextTool.tsx       # Text tool
│   ├── DrawTool.tsx       # Drawing tool
│   └── SendModal.tsx      # Send/share modal
├── store/                 # State management
│   └── appStore.ts        # Zustand store
├── lib/                   # Utilities
│   ├── firebase.ts        # Firebase config & functions
│   └── send.ts            # Send card functions
└── public/                # Static assets
    └── stickers/          # Sticker images
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project (for production)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd tilmail
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. **Add sticker images (optional):**
   Place PNG sticker images in `public/stickers/`:
   - `heart.png`
   - `star.png`
   - `smile.png`
   - `flower.png`
   - `balloon.png`

   The app will work without these (using placeholders), but stickers will display better with actual images.

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup

1. **Create a Firebase project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Storage

2. **Get Firebase config:**
   - Go to Project Settings > General
   - Scroll to "Your apps" and add a web app
   - Copy the config values to `.env.local`

3. **Set up Firestore rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /cards/{cardId} {
         allow read: if true;  // Public read
         allow write: if true;  // Public write (restrict in production)
       }
     }
   }
   ```

4. **Set up Storage rules:**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /images/{allPaths=**} {
         allow read: if true;
         allow write: if true;  // Restrict in production
       }
     }
   }
   ```

### Optional: Email/SMS Integration

#### SendGrid (Email)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY=your-api-key
   ```
4. Update `app/api/send-email/route.ts` to use SendGrid SDK

#### Twilio (SMS)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token
3. Add to `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=your-phone-number
   ```
4. Update `app/api/send-sms/route.ts` to use Twilio SDK

## Usage

### Creating a Card

1. **Decorate the envelope front:**
   - Select "Front" mode
   - Use Sticker, Text, or Draw tools
   - Click on the envelope to place decorations

2. **Decorate the envelope back:**
   - Select "Back" mode
   - Add decorations as above

3. **Open and decorate the postcard:**
   - Click "Open" to open the envelope
   - Select "Card" mode
   - Decorate the postcard

4. **Save and send:**
   - Click "Save" to save your design
   - Click "Send" to generate a shareable link or send via email/SMS

### Viewing a Shared Card

Visit `/card/[id]` where `[id]` is the card ID from the share link. The envelope will automatically open to show the postcard.

## Deployment

### Vercel (Recommended for Next.js)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import project in Vercel:**
   - Go to [Vercel](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy

3. **Configure environment variables in Vercel dashboard:**
   - Add all `NEXT_PUBLIC_*` variables
   - Add optional `SENDGRID_API_KEY`, `TWILIO_*` variables

### Firebase Hosting (Static Export)

For static export, you'll need to modify `next.config.js`:

1. **Update next.config.js:**
   ```javascript
   const nextConfig = {
     reactStrictMode: true,
     output: 'export',
     images: {
       unoptimized: true,
     },
   }
   ```

2. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase:**
   ```bash
   firebase login
   ```

4. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `out`
   - Configure as single-page app: Yes
   - Set up automatic builds: No

5. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

   **Note:** Static export won't support dynamic API routes. For full functionality, use Vercel or Firebase Functions.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **EnvelopeScene**: Main 3D scene with camera and controls
- **Envelope**: 3D envelope mesh with animated lid
- **Postcard**: 3D postcard that slides out when envelope opens
- **EnvelopeFace**: Renders decorations on envelope/postcard faces using canvas textures
- **Toolbar**: Main UI for tools and actions
- **StickerPicker/TextTool/DrawTool**: Individual decoration tools

## Constraints

- White background, minimal aesthetic
- No Tailwind CSS
- CSS Modules for styling
- Mobile-friendly touch gestures
- react-three-fiber for all 3D rendering
- Canvas textures for decorations mapped onto 3D meshes

## Future Enhancements

- Drag-and-drop sticker placement
- Text editing on 3D surface
- More sticker options
- Export as image
- User accounts and saved designs
- Animation previews
- Sound effects

## License

MIT
