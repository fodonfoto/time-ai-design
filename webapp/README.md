# Time AI Webapp

Next.js application สำหรับ **Time AI - Generate UI Design to Figma**

## 🚀 Development

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## 📁 Structure

```
src/
├── app/              # App Router pages
├── components/       # React components
│   ├── Canvas.tsx    # Design preview canvas
│   ├── Sidebar.tsx   # Project sidebar
│   └── ...
├── lib/              # Utilities
│   ├── figma-encoder.ts    # Figma clipboard encoding
│   ├── html-to-figma/      # HTML to Figma converter
│   └── figma-schema.ts     # Figma type definitions
└── services/
    └── geminiService.ts    # AI API integration
```

## 🔧 Configuration

สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key
```

## 📦 Build

```bash
npm run build
npm run start
```

## 🛠 Tech Stack

- Next.js 16 + React 19
- TailwindCSS
- Google Gemini API
- Radix UI Components
