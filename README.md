# Time AI

**Generate UI Design to Figma** - แอปพลิเคชัน AI ที่ช่วยสร้าง UI Design จาก prompt และส่งออกไป Figma

## ✨ Features

- 🤖 สร้าง UI Design จาก text prompt ด้วย AI (Google Gemini)
- 📱 รองรับทั้ง Mobile (375px) และ Desktop (1440px)
- 🎨 Preview SVG แบบ real-time
- 📋 Copy design ไปยัง Figma clipboard ในรูปแบบ native format
- 💾 บันทึก Recent Projects

## 🚀 Quick Start

```bash
# ติดตั้ง dependencies
cd webapp
npm install

# รัน development server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) บน browser

## 📁 Project Structure

```
time-design/
├── webapp/              # Next.js Webapp (main application)
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # Utility libraries
│   │   └── services/    # API services
│   └── public/          # Static assets
├── tools/               # Development utilities
└── package.json
```

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TailwindCSS
- **AI**: Google Gemini via OpenRouter API
- **Figma Export**: Kiwi Protocol encoding

## 📝 License

ISC
