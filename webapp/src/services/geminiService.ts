import OpenAI from 'openai';
import { DeviceType } from "../types";

// Initialize OpenRouter (via OpenAI SDK)
// IMPORTANT: Ensure NEXT_PUBLIC_OPENROUTER_API_KEY is set in your .env.local file
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "",
    dangerouslyAllowBrowser: true, // Allow running in browser for this demo
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "Time AI Design", // Optional. Shows in rankings on openrouter.ai.
    }
});

const SYSTEM_INSTRUCTION = `
# LAYER 1: CONTEXT & FOUNDATION
You are an expert UI/UX Designer and Frontend Engineer (Google Antigravity Team).
Your goal is to generate **pixel-perfect, accessible, and production-ready** mobile app screens.
You DO NOT write explanations. You speak in **Valid JSON** only.

**CONSTRAINTS (THE WALL):**
- **Platform:** Mobile (iOS/Android Hybrid Standard) - 375px Width Reference.
- **Framework:** Tailwind CSS + HTML (Flexbox).
- **Aesthetics:** "Vibe Coding" (Modern, Deep, Glassmorphism, Neon Accents).
- **Icons:** Inline SVG (Lucide style) ONLY. No React libraries.

---

**CORE MOBILE CONSTRAINTS (CRITICAL):**
*   **Safe Areas (Non-Negotiable):**
    *   **Top (Status Bar):** All main containers MUST have \`pt-14\` to avoid the notch.
    *   **Bottom (Home Indicator):** All scrollable views MUST have \`pb-10\` to clear the home bar.
    *   **Edges:** Use \`px-4\` or \`px-6\` for standard horizontal padding.
*   **Pattern Adherence:** You must STRICTLY follow the component patterns (e.g., Cards, Lists, Forms) defined in the **Local Component Library**. Do not invent new structures if a standard one exists.

---

# LAYER 2: DESIGN SYSTEM REFERENCE (STRICT COMPLIANCE)

**1. COLOR TOKENS (DYNAMIC THEME COMPLIANCE):**
*   **Theme Strategy:** You MUST selct a **Shadcn Base** (Zinc, Slate, Stone, Neutral, Gray) and an **Accent** (Violet, Blue, Rose, Orange, Emerald) based on the "Visual Direction".
*   **Backgrounds (Apply Theme):**
    *   Main: \`bg-{theme}-950\` (e.g., \`bg-slate-950\`, \`bg-zinc-950\`)
    *   Card: \`bg-{theme}-900/50 border border-white/5\`
    *   Glass: \`backdrop-blur-xl bg-white/5\`
*   **Text:**
    *   Primary: \`text-white\`
    *   Secondary: \`text-{theme}-400\`
    *   Brand: \`text-{accent}-400\` (e.g., \`text-violet-400\`)
*   **Interactive:**
    *   Button Primary: \`bg-<accent>-600 hover:bg-<accent>-500 text-white shadow-lg shadow-<accent>-500/30\`
    *   Button Ghost: \`hover:bg-white/5 text-{theme}-300\`

**2. TYPOGRAPHY (Inter):**
*   **Heading 1:** \`text-3xl font-bold tracking-tight text-white\`
*   **Heading 2:** \`text-xl font-semibold tracking-tight text-zinc-100\`
*   **Body:** \`text-sm leading-relaxed text-zinc-400\`
*   **Caption:** \`text-[10px] uppercase tracking-widest text-zinc-600 font-bold\`

**3. IMAGES (STRICT COMPLIANCE):**
*   **Source:** Use \`https://image.pollinations.ai/prompt/...\` ONLY.
*   **Prohibited:** NEVER use \`cdn.pollinations.ai\` or \`seed\` paths.
*   **Syntax:** \`https://image.pollinations.ai/prompt/{encoded_description}?width=800&height=600&nologo=true&model=flux\`
*   **Style:** \`rounded-2xl object-cover shadow-2xl\`

**4. AESTHETICS (THE "WOW" FACTOR):**
*   **Gradients:** ALWAYS add a background gradient blob: 
    \`<div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>\`
*   **Borders:** Use subtle, high-quality borders: \`border border-white/10\`.
*   **Shadows:** Use colored shadows for buttons: \`shadow-lg shadow-emerald-500/20\`.

---

**5. DESIGN PRACTICE GUIDELINES (STRICT):**
*   **Auto Layout:** ALWAYS use Flexbox (\`flex\`, \`flex-col\`, \`items-center\`, \`justify-between\`) for the main content.
    *   **Exceptions:** You MAY use \`fixed\` or \`absolute\` positioning ONLY for:
        *   **Bottom Navigation Bars** (\`fixed bottom-0 w-full\`)
        *   **Floating Action Buttons (FABs)** (\`fixed bottom-20 right-4\`)
        *   **Overlays/Modals** (\`fixed inset-0\`)
*   **Spacing:** Use the 4pt Grid System (multiples of 4).
    *   Small: \`gap-1\` (4px), \`gap-2\` (8px).
    *   Medium: \`gap-4\` (16px), \`gap-6\` (24px).
    *   Large: \`gap-8\` (32px), \`gap-12\` (48px).
*   **Typography:** Follow the scale.
    *   Headings: \`text-3xl\`, \`text-xl\`.
    *   Body: \`text-sm\`, \`text-base\`.
    *   Captions: \`text-xs\`.
*   **Color Usage:**
    *   60% Neutral (Zinc-950/900).
    *   30% Secondary (Zinc-800/400).
    *   10% Brand Accent (Emerald-500 or Indigo-500).
*   **Design Tokens:** Reuse existing Tailwind classes as tokens. Do not invent arbitrary hex values inline. Use \`bg-zinc-950\` not \`bg-[#09090b]\`.

**6. COMPONENT INTELLIGENCE (SPEC & BEHAVIOR):**
*   **Truth Sources (Reference These):**
    *   UI Components: \`https://www.shadcn.io/ui\`
    *   Templates/Patterns: \`https://www.shadcn.io/template\`
    *   Advanced Patterns: \`https://www.shadcn.io/patterns\`
    *   Theme & Colors: \`https://www.shadcn.io/theme\` (Use for proper theme generation)
*   **Research & Apply:** Actively emulate the "Design Specs" found in these docs (Height, Padding, States).
*   **Examples:**
    *   *Buttons:* Height 40px (sm) to 48px (lg). Padding px-4 py-2. Focused ring-2.
    *   *Inputs:* Height 44px for touch (Mobile Standard). Border-input. Ring-offset-background.
    *   *Cards:* P-6, Rounded-xl, Border-border.
    *   *Navigation:* Mobile Bottom Nav should be \`fixed bottom-0 w-full h-16 bg-zinc-900/90 backdrop-blur border-t border-white/5 flex justify-around items-center\`.
*   **Consistency:** All form elements must match in height and corner radius.

**7. LOCAL COMPONENT LIBRARY (SHADCN IMPLEMENTATION):**
You MUST mimic the exact HTML structure and Tailwind classes of our local component library.
*   **Available Components:** Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toggle, Tooltip.

*   **Reference Implementations (Use These Classes):**
    *   **Button (Primary):** \`<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(16,185,129,0.3)]">\`
    *   **Card:** \`<div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-white/10 shadow-sm p-6">\`
    *   **Sidebar (Container):** \`<div class="bg-sidebar text-sidebar-foreground flex h-full w-[16rem] flex-col border-r border-sidebar-border">\`
    *   **Input:** \`<input class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">\`


---

# LAYER 3: WORKFLOW INSTRUCTIONS

1.  **INTERPRET:** Analyze the user request for intent.
2.  **GENERATE:** Build the HTML structure.
3.  **POLISH:**
    *   **Force Background Gradient:** Insert the mesh gradient blob container absolutely positioned at the top.
    *   **Check Contrast:** Ensure text is readable on dark backgrounds.
    *   **Mobile Safe Areas:** Keep \`pt-14\` and \`pb-10\`.

---

# LAYER 4: OUTPUT FORMAT SPECIFICATION

**8. QUALITY CHECKLIST (VERIFY BEFORE OUTPUT):**
✓ Colors match the design system palette (no arbitrary hex values)
✓ Spacing follows 4pt grid system (gap-1, gap-2, gap-4, gap-6, gap-8)
✓ Typography is readable (text-sm minimum for body, text-xs for captions)
✓ All text has sufficient contrast (white on dark backgrounds)
✓ Layout is mobile-first (375px viewport reference)
✓ Components are consistent across the design
✓ Hover states are defined for interactive elements
✓ No broken placeholder text - use realistic content
✓ Code is clean, semantic HTML with Tailwind classes
✓ Safe areas are respected (pt-14 top, pb-10 bottom)

**9. SVG/FIGMA EXPORT COMPATIBILITY:**
*   **Avoid CSS Not Supported in SVG:**
    *   ❌ \`backdrop-blur\` (use solid backgrounds instead)
    *   ❌ \`bg-gradient-to-*\` on text (use on containers only)
    *   ❌ Complex \`filter\` effects
*   **Preferred for SVG Export:**
    *   ✓ Solid background colors (\`bg-zinc-900\`)
    *   ✓ Simple borders (\`border border-white/10\`)
    *   ✓ Inline SVG icons (not icon fonts)
    *   ✓ Explicit width/height on containers
*   **For Best Results:**
    *   Keep layout simple (single-level flex)
    *   Use explicit dimensions where possible
    *   Prefer \`gap-*\` over margin for spacing

Return a **SINGLE VALID JSON OBJECT**:
{
  "title": "Short Screen Name",
  "description": "Brief explanation",
  "html": "<div class=\\"relative h-full w-full bg-zinc-950 overflow-hidden font-sans\\"> [GRADIENT_BLOB] [CONTENT] </div>"
}
`;

export interface GeneratedDesign {
    title: string;
    description: string;
    html: string; // The HTML string with Tailwind
    figmaJson: any; // The Node structure
}

// ============================================
// STEP 1: VISUAL DIRECTION (Prompt Expansion)
// ============================================
async function expandPrompt(originalPrompt: string): Promise<string> {
    const EXPANSION_SYSTEM_PROMPT = `
    You are a Lead UI/UX Designer setting the "Visual Direction" for a project.
    Your goal is to define the ESTHETIC VIBE based on the user's request.
    
    RETURN ONLY A PARAGRAPH describing the visual style.
    Include:
    - **Shadcn Theme**: Choose a Base (Zinc, Slate, Stone, Neutral, Gray) and Accent (Violet, Blue, Rose, Orange, Emerald, Cyan) that fits the mood.
    - **Color Palette**: Hex codes (Deep Dark Base, Vibrant Accent).
    - **Mood**: e.g., "Futuristic", "Clean", "Playful", "Corporate".
    - **Styling Details**: Glassmorphism, Brutalism, Neumorphism, etc.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: EXPANSION_SYSTEM_PROMPT },
                { role: "user", content: `Define the visual direction for: "${originalPrompt}"` }
            ],
            max_tokens: 300,
        });
        return completion.choices[0].message.content || originalPrompt;
    } catch (e) {
        console.warn("Step 1 failed:", e);
        return originalPrompt;
    }
}

// ============================================
// STEP 2: UX RESEARCH & ANALYSIS
// ============================================
async function analyzeUxRequirements(prompt: string, device: DeviceType, image?: string): Promise<string> {
    const RESEARCH_SYSTEM_PROMPT = `
    You are a Senior UX Researcher and Product Manager.
    Your task is to analyze the user's request and create a "UX Requirement Brief".
    
    Think deeply about:
    1.  **User Goal**: What is the user trying to achieve?
    2.  **Platform Standard**: What are the best patterns for ${device} (iOS/Android vs Web)?
    3.  **Necessary Components**: List EVERY interactive element needed for this screen to work (e.g., Back button, Profile, List items, FAB).
    4.  **Component Specs & Ref**: Refer to the **Local Component Library** (e.g., Sidebar, Button, Card, Input) AND \`https://www.shadcn.io/ui\`. Specify the best-practice "Design Specs" (Heights, States, Patterns, Theme) matching our local implementation.
    5.  **Safe Area Strategy**: Explicitly state how the layout handles the Top Notch (\`pt-14\`) and Bottom Indicator (\`pb-10\`).
    6.  **Layout Strategy**: How should things be arranged? (e.g., "Split screen", "Feed view", "Dashboard grid").

    IF AN IMAGE IS PROVIDED:
    - Analyze the image structure deeply.
    - Identify what works and what can be improved.
    - Reverse - engineer the layout.

    OUTPUT FORMAT:
    Return a concise Bulleted List summarizing the Requirements & Component Specs.
    `;

    let userContent: any = `Analyze requirements for: "${prompt}"`;

    if (image) {
        userContent = [
            { type: "text", text: `Analyze the UX requirements for a design based on this prompt: "${prompt}".\n\nAlso, analyze the attached reference image for layout patterns and structure.` },
            { type: "image_url", image_url: { url: image } }
        ];
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: RESEARCH_SYSTEM_PROMPT },
                { role: "user", content: userContent }
            ],
            max_tokens: 800,
        });
        return completion.choices[0].message.content || "";
    } catch (e) {
        console.warn("Step 2 failed:", e);
        return "Standard layout requirements apply.";
    }
}

// ============================================
// STEP 0 (NEW): FLOW PLANNING (Product Manager)
// ============================================
export interface ScreenPlan {
    title: string;
    description: string;
}

export async function planUserFlow(prompt: string): Promise<ScreenPlan[]> {
    const PM_SYSTEM_PROMPT = `
    You are an expert Product Manager.
    Your goal is to break down a user request into a logical "User Flow" of 1 to 3 screens.
    
    If the request is simple(e.g. "Login Page"), generate related screens(e.g.Login, Sign Up, Forgot Password).
    If the request is complex(e.g. "Dashboard"), break it down(e.g.Dashboard Home, Analytics Detail, Settings).
    
    CRITICAL RULES:
    1. Maximum 3 screens.
    2. Minimum 1 screen.
    3. Return purely valid JSON array of objects.
    4. Each object must have "title"(short name) and "description"(detailed intent).
    
    EXAMPLE OUTPUT:
    [
        { "title": "Login", "description": "A clean login screen with email, password, and social auth." },
        { "title": "Sign Up", "description": "Registration screen with name, email, password fields." },
        { "title": "Forgot Password", "description": "Email recovery input form." }
    ]
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: PM_SYSTEM_PROMPT },
                { role: "user", content: `Plan a user flow for: "${prompt}"` }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || "[]";
        try {
            // Some models might wrap array in object key "screens" or just return array
            // We'll try to parse and standardize
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed;
            if (parsed.screens && Array.isArray(parsed.screens)) return parsed.screens;
            // Fallback if structure is weird but has keys
            return Object.values(parsed).filter(x => typeof x === 'object') as ScreenPlan[];
        } catch (e) {
            console.error("JSON parse error in planUserFlow", e);
            return [{ title: "Design", description: prompt }];
        }
    } catch (e) {
        console.warn("Flow Planning failed:", e);
        return [{ title: "Design", description: prompt }];
    }
}

// ============================================
// STEP 3: HIGH-FIDELITY GENERATION
// ============================================

// Helper to fix and beautify HTML
function sanitizeGeneratedHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Fix Image URLs
    const images = doc.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let src = img.getAttribute('src') || '';

        // Fix Pollinations Domain/Path Hallucinations
        if (src.includes('pollinations')) {
            // Extract description prompt
            let prompt = 'modern abstract';
            const match = src.match(/prompt\/([^?]+)/) || src.match(/seed\/[^?]+\/([^?]+)/);
            if (match && match[1]) {
                prompt = match[1]; // Keep it encoded if it is, or raw
            } else if (img.getAttribute('alt')) {
                prompt = encodeURIComponent(img.getAttribute('alt') || 'modern ui');
            }

            // Reconstruct valid URL
            // Ensure reasonable dimensions (e.g. 800x600 for high quality)
            const newSrc = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true&model=flux`;
            img.setAttribute('src', newSrc);
        }

        // Ensure styling
        img.classList.add('object-cover');
        if (!img.classList.contains('rounded-full')) {
            img.classList.add('rounded-2xl');
        }
    }

    // 2. Ensure Background Gradient if missing (The "Wow" fix)
    const rootDiv = doc.body.firstElementChild as HTMLElement;
    if (rootDiv && !rootDiv.innerHTML.includes('blur-[100px]')) {
        const gradient = doc.createElement('div');
        gradient.className = "absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0";
        rootDiv.insertBefore(gradient, rootDiv.firstChild);

        // Ensure root has z-0 context or relative
        if (!rootDiv.className.includes('relative')) rootDiv.classList.add('relative');
        if (!rootDiv.className.includes('overflow-hidden')) rootDiv.classList.add('overflow-hidden');
    }

    return doc.body.innerHTML;
}

export async function generateDesign(prompt: string, device: DeviceType, image?: string): Promise<GeneratedDesign> {

    // ... (Log Steps 1 & 2) ...
    console.log("🚀 Step 3: Generating Final Design...");

    // Using Updated System Prompt
    const finalPrompt = `
    TASK: Create a ${device} UI Design for: "${prompt}"
    VISUAL DIRECTION: ${await expandPrompt(prompt)}
    UX CONTEXT: ${await analyzeUxRequirements(prompt, device, image)}
    
    IMPORTANT: 
    - Use the DEFINED Shadcn Theme (Base/Accent) from Visual Direction.
    - Insert the background gradient blob using the Accent color.
    - Images MUST use https://image.pollinations.ai/prompt/...
    `;

    // ... (Payload construction) ...
    let generationContent: any = finalPrompt;
    if (image) {
        generationContent = [
            { type: "text", text: finalPrompt },
            { type: "image_url", image_url: { url: image } }
        ];
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: generationContent },
            ],
            response_format: { type: "json_object" },
            max_tokens: 10000,
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error("No content received");

        let cleanJson = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

        // ... (JSON Parsing logic) ...
        try {
            const parsed = JSON.parse(cleanJson);
            if (!parsed.html) throw new Error("Missing html");

            // --- REPAIR & POLISH ---
            console.log("🔧 Sanitizing HTML & Fixing Images...");
            parsed.html = sanitizeGeneratedHtml(parsed.html);
            // -----------------------

            try {
                const figmaJson = htmlToFigmaNodes(parsed.html);
                parsed.figmaJson = figmaJson;
            } catch (conversionError) {
                console.error("Figma conversion failed", conversionError);
                parsed.figmaJson = { type: "FRAME", name: "Error", children: [] };
            }

            return parsed as GeneratedDesign;

        } catch (parseError) {
            console.error("JSON Error", parseError);
            throw new Error("Failed to parse JSON");
        }

    } catch (error) {
        console.error("Generation Error:", error);
        throw error;
    }
}

// ============================================
// HTML -> Figma Node Converter
// ============================================

export function htmlToFigmaNodes(htmlString: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const root = doc.body.firstElementChild;

    if (!root) return { type: "FRAME", name: "Empty", children: [] };

    return elementToNode(root as HTMLElement);
}

// ============================================
// Tailwind Color Palette (Zinc, Slate, Emerald, etc.)
// ============================================
const TAILWIND_COLORS: { [key: string]: string } = {
    // Zinc
    'zinc-50': 'fafafa', 'zinc-100': 'f4f4f5', 'zinc-200': 'e4e4e7', 'zinc-300': 'd4d4d8',
    'zinc-400': 'a1a1aa', 'zinc-500': '71717a', 'zinc-600': '52525b', 'zinc-700': '3f3f46',
    'zinc-800': '27272a', 'zinc-900': '18181b', 'zinc-950': '09090b',
    // Slate
    'slate-50': 'f8fafc', 'slate-100': 'f1f5f9', 'slate-200': 'e2e8f0', 'slate-300': 'cbd5e1',
    'slate-400': '94a3b8', 'slate-500': '64748b', 'slate-600': '475569', 'slate-700': '334155',
    'slate-800': '1e293b', 'slate-900': '0f172a', 'slate-950': '020617',
    // Emerald (Primary)
    'emerald-400': '34d399', 'emerald-500': '10b981', 'emerald-600': '059669',
    // Violet (Accent)
    'violet-400': 'a78bfa', 'violet-500': '8b5cf6', 'violet-600': '7c3aed',
    // Indigo
    'indigo-400': '818cf8', 'indigo-500': '6366f1', 'indigo-600': '4f46e5',
    // Rose
    'rose-400': 'fb7185', 'rose-500': 'f43f5e', 'rose-600': 'e11d48',
    // Cyan
    'cyan-400': '22d3ee', 'cyan-500': '06b6d4', 'cyan-600': '0891b2',
    // Orange
    'orange-400': 'fb923c', 'orange-500': 'f97316', 'orange-600': 'ea580c',
    // Blue
    'blue-400': '60a5fa', 'blue-500': '3b82f6', 'blue-600': '2563eb',
    // Green
    'green-400': '4ade80', 'green-500': '22c55e', 'green-600': '16a34a',
    // Red
    'red-400': 'f87171', 'red-500': 'ef4444', 'red-600': 'dc2626',
    // Yellow
    'yellow-400': 'facc15', 'yellow-500': 'eab308', 'yellow-600': 'ca8a04',
    // Gray
    'gray-50': 'f9fafb', 'gray-100': 'f3f4f6', 'gray-200': 'e5e7eb', 'gray-300': 'd1d5db',
    'gray-400': '9ca3af', 'gray-500': '6b7280', 'gray-600': '4b5563', 'gray-700': '374151',
    'gray-800': '1f2937', 'gray-900': '111827', 'gray-950': '030712',
    // Neutral
    'neutral-50': 'fafafa', 'neutral-100': 'f5f5f5', 'neutral-200': 'e5e5e5', 'neutral-300': 'd4d4d4',
    'neutral-400': 'a3a3a3', 'neutral-500': '737373', 'neutral-600': '525252', 'neutral-700': '404040',
    'neutral-800': '262626', 'neutral-900': '171717', 'neutral-950': '0a0a0a',
    // Stone
    'stone-50': 'fafaf9', 'stone-100': 'f5f5f4', 'stone-200': 'e7e5e4', 'stone-300': 'd6d3d1',
    'stone-400': 'a8a29e', 'stone-500': '78716c', 'stone-600': '57534e', 'stone-700': '44403c',
    'stone-800': '292524', 'stone-900': '1c1917', 'stone-950': '0c0a09',
};

function elementToNode(el: HTMLElement): any {
    // Determine type
    const isText = el.tagName.match(/^H[1-6]$|^P$|^SPAN$|^BUTTON$|^A$|^LABEL$/) ||
        (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && el.textContent?.trim());
    const hasImage = el.tagName === 'IMG';
    const isSvg = el.tagName === 'SVG' || el.tagName === 'svg';

    // Parse styles
    let classes = "";
    if (typeof el.className === 'string') {
        classes = el.className;
    } else if (el.getAttribute) {
        classes = el.getAttribute('class') || "";
    }

    const node: any = {
        type: "FRAME", // Default
        name: el.getAttribute('data-name') || el.tagName,
        children: [],
        visible: true
    };

    // ============================================
    // SIZE EXTRACTION (Width/Height)
    // ============================================
    // Fixed Width
    const wMatch = classes.match(/w-\[(\d+)px\]/) || classes.match(/w-(\d+)/);
    if (wMatch) {
        node.width = wMatch[0].includes('px') ? parseInt(wMatch[1]) : parseInt(wMatch[1]) * 4;
    }
    // Fixed Height
    const hMatch = classes.match(/h-\[(\d+)px\]/) || classes.match(/h-(\d+)/);
    if (hMatch) {
        node.height = hMatch[0].includes('px') ? parseInt(hMatch[1]) : parseInt(hMatch[1]) * 4;
    }
    // Full width/height
    if (classes.includes('w-full')) node.layoutSizingHorizontal = 'FILL';
    if (classes.includes('h-full')) node.layoutSizingVertical = 'FILL';

    // ============================================
    // GRADIENT DETECTION (bg-gradient-to-...)
    // ============================================
    const gradientMatch = classes.match(/bg-gradient-to-(r|l|t|b|tr|tl|br|bl)/);
    const fromMatch = classes.match(/from-(\w+-\d+)/);
    const toMatch = classes.match(/to-(\w+-\d+)/);
    const viaMatch = classes.match(/via-(\w+-\d+)/);

    if (gradientMatch && fromMatch) {
        const direction = gradientMatch[1];
        const fromColor = TAILWIND_COLORS[fromMatch[1]] || 'ffffff';
        const toColor = toMatch ? (TAILWIND_COLORS[toMatch[1]] || '000000') : '000000';

        // Map Tailwind direction to Figma gradient handles
        let gradientHandles: { start: [number, number], end: [number, number] } = { start: [0, 0.5], end: [1, 0.5] };
        switch (direction) {
            case 'r': gradientHandles = { start: [0, 0.5], end: [1, 0.5] }; break;
            case 'l': gradientHandles = { start: [1, 0.5], end: [0, 0.5] }; break;
            case 't': gradientHandles = { start: [0.5, 1], end: [0.5, 0] }; break;
            case 'b': gradientHandles = { start: [0.5, 0], end: [0.5, 1] }; break;
            case 'tr': gradientHandles = { start: [0, 1], end: [1, 0] }; break;
            case 'tl': gradientHandles = { start: [1, 1], end: [0, 0] }; break;
            case 'br': gradientHandles = { start: [0, 0], end: [1, 1] }; break;
            case 'bl': gradientHandles = { start: [1, 0], end: [0, 1] }; break;
        }

        const gradientStops = [
            { position: 0, color: { ...hexToRgb(fromColor), a: 1 } }
        ];
        if (viaMatch) {
            const viaColor = TAILWIND_COLORS[viaMatch[1]] || '888888';
            gradientStops.push({ position: 0.5, color: { ...hexToRgb(viaColor), a: 1 } });
        }
        gradientStops.push({ position: 1, color: { ...hexToRgb(toColor), a: 1 } });

        node.fills = [{
            type: "GRADIENT_LINEAR",
            visible: true,
            opacity: 1,
            blendMode: "NORMAL",
            gradientStops: gradientStops,
            gradientTransform: [
                [gradientHandles.end[0] - gradientHandles.start[0], 0, gradientHandles.start[0]],
                [0, gradientHandles.end[1] - gradientHandles.start[1], gradientHandles.start[1]]
            ]
        }];
    }
    // ============================================
    // SOLID COLOR DETECTION (bg-...)
    // ============================================
    else {
        // Arbitrary hex color
        const bgHexMatch = classes.match(/bg-\[#([0-9a-fA-F]{3,6})\]/);
        if (bgHexMatch) {
            node.fills = [{ type: "SOLID", color: hexToRgb(bgHexMatch[1]), visible: true, opacity: 1 }];
        }
        // Tailwind palette colors (bg-zinc-900, bg-emerald-500, etc.)
        else {
            const bgPaletteMatch = classes.match(/bg-(\w+-\d+)/);
            if (bgPaletteMatch && TAILWIND_COLORS[bgPaletteMatch[1]]) {
                node.fills = [{ type: "SOLID", color: hexToRgb(TAILWIND_COLORS[bgPaletteMatch[1]]), visible: true, opacity: 1 }];
            }
            // Design System Tokens
            else if (classes.includes('bg-background')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('09090b'), visible: true }]; // zinc-950
            } else if (classes.includes('bg-card')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('18181b'), visible: true }]; // zinc-900
            } else if (classes.includes('bg-primary')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('10b981'), visible: true }]; // emerald-500
            } else if (classes.includes('bg-secondary')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('27272a'), visible: true }]; // zinc-800
            } else if (classes.includes('bg-muted')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('27272a'), visible: true }];
            } else if (classes.includes('bg-white')) {
                node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, visible: true }];
            } else if (classes.includes('bg-black')) {
                node.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, visible: true }];
            } else if (classes.includes('bg-transparent')) {
                node.fills = [];
            }
        }
    }

    // ============================================
    // OPACITY (opacity-XX)
    // ============================================
    const opacityMatch = classes.match(/opacity-(\d+)/);
    if (opacityMatch) {
        node.opacity = parseInt(opacityMatch[1]) / 100;
    }
    // bg-color/opacity pattern (e.g., bg-white/10)
    const bgOpacityMatch = classes.match(/bg-(\w+)\/(\d+)/);
    if (bgOpacityMatch && node.fills && node.fills.length > 0) {
        node.fills[0].opacity = parseInt(bgOpacityMatch[2]) / 100;
    }

    // ============================================
    // SHADOW DETECTION (shadow-sm, shadow-lg, etc.)
    // ============================================
    if (classes.includes('shadow')) {
        const shadowEffects: any[] = [];
        if (classes.includes('shadow-2xl')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.25 }, offset: { x: 0, y: 25 }, radius: 50, spread: -12 });
        } else if (classes.includes('shadow-xl')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.2 }, offset: { x: 0, y: 20 }, radius: 25, spread: -5 });
        } else if (classes.includes('shadow-lg')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 10 }, radius: 15, spread: -3 });
        } else if (classes.includes('shadow-md')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 6, spread: -1 });
        } else if (classes.includes('shadow-sm')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0 });
        } else if (classes.includes('shadow')) {
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0 });
        }
        // Colored shadows (shadow-emerald-500/30)
        const coloredShadowMatch = classes.match(/shadow-(\w+-\d+)\/(\d+)/);
        if (coloredShadowMatch && TAILWIND_COLORS[coloredShadowMatch[1]]) {
            const shadowColor = hexToRgb(TAILWIND_COLORS[coloredShadowMatch[1]]);
            const shadowOpacity = parseInt(coloredShadowMatch[2]) / 100;
            shadowEffects.push({ type: 'DROP_SHADOW', visible: true, color: { ...shadowColor, a: shadowOpacity }, offset: { x: 0, y: 10 }, radius: 20, spread: 0 });
        }
        if (shadowEffects.length > 0) {
            node.effects = shadowEffects;
        }
    }

    // ============================================
    // BLUR EFFECTS (blur, backdrop-blur)
    // ============================================
    if (classes.includes('blur-')) {
        const blurMatch = classes.match(/blur-\[(\d+)px\]/) || classes.match(/blur-(sm|md|lg|xl|2xl|3xl)/);
        if (blurMatch) {
            let blurRadius = 8;
            if (blurMatch[1] === 'sm') blurRadius = 4;
            else if (blurMatch[1] === 'md') blurRadius = 12;
            else if (blurMatch[1] === 'lg') blurRadius = 16;
            else if (blurMatch[1] === 'xl') blurRadius = 24;
            else if (blurMatch[1] === '2xl') blurRadius = 40;
            else if (blurMatch[1] === '3xl') blurRadius = 64;
            else if (!isNaN(parseInt(blurMatch[1]))) blurRadius = parseInt(blurMatch[1]);

            node.effects = node.effects || [];
            node.effects.push({ type: 'LAYER_BLUR', visible: true, radius: blurRadius });
        }
    }
    if (classes.includes('backdrop-blur')) {
        const backdropBlurMatch = classes.match(/backdrop-blur-(sm|md|lg|xl|2xl|3xl)/) || classes.match(/backdrop-blur-\[(\d+)px\]/);
        let blurRadius = 12;
        if (backdropBlurMatch) {
            if (backdropBlurMatch[1] === 'sm') blurRadius = 4;
            else if (backdropBlurMatch[1] === 'md') blurRadius = 12;
            else if (backdropBlurMatch[1] === 'lg') blurRadius = 16;
            else if (backdropBlurMatch[1] === 'xl') blurRadius = 24;
            else if (!isNaN(parseInt(backdropBlurMatch[1]))) blurRadius = parseInt(backdropBlurMatch[1]);
        }
        node.effects = node.effects || [];
        node.effects.push({ type: 'BACKGROUND_BLUR', visible: true, radius: blurRadius });
    }

    // ============================================
    // BORDER LOGIC
    // ============================================
    if (classes.includes('border')) {
        node.strokes = [{ type: "SOLID", color: hexToRgb('3f3f46'), visible: true }]; // zinc-700
        node.strokeWeight = 1;
        node.strokeAlign = 'INSIDE';

        // Specific border colors
        const borderColorMatch = classes.match(/border-(\w+-\d+)/);
        if (borderColorMatch && TAILWIND_COLORS[borderColorMatch[1]]) {
            node.strokes = [{ type: "SOLID", color: hexToRgb(TAILWIND_COLORS[borderColorMatch[1]]), visible: true }];
        }
        // Border opacity
        const borderOpacityMatch = classes.match(/border-white\/(\d+)/);
        if (borderOpacityMatch) {
            node.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, visible: true, opacity: parseInt(borderOpacityMatch[1]) / 100 }];
        }
        // Border width
        const borderWidthMatch = classes.match(/border-(\d+)/);
        if (borderWidthMatch) {
            node.strokeWeight = parseInt(borderWidthMatch[1]);
        }
    }

    // ============================================
    // LAYOUT (Flexbox -> Auto Layout)
    // ============================================
    if (classes.includes('flex')) {
        node.layoutMode = classes.includes('flex-col') ? "VERTICAL" : "HORIZONTAL";

        // Primary Axis (justify-*)
        if (classes.includes('justify-center')) node.primaryAxisAlignItems = "CENTER";
        else if (classes.includes('justify-between')) node.primaryAxisAlignItems = "SPACE_BETWEEN";
        else if (classes.includes('justify-around')) node.primaryAxisAlignItems = "SPACE_BETWEEN"; // Closest approximation
        else if (classes.includes('justify-evenly')) node.primaryAxisAlignItems = "SPACE_BETWEEN";
        else if (classes.includes('justify-end')) node.primaryAxisAlignItems = "MAX";
        else node.primaryAxisAlignItems = "MIN";

        // Counter Axis (items-*)
        if (classes.includes('items-center')) node.counterAxisAlignItems = "CENTER";
        else if (classes.includes('items-end')) node.counterAxisAlignItems = "MAX";
        else if (classes.includes('items-stretch')) node.counterAxisAlignItems = "STRETCH";
        else if (classes.includes('items-baseline')) node.counterAxisAlignItems = "BASELINE";
        else node.counterAxisAlignItems = "MIN";

        // Gap
        const gapMatch = classes.match(/gap-(\d+)/);
        if (gapMatch) node.itemSpacing = parseInt(gapMatch[1]) * 4;
        const gapXMatch = classes.match(/gap-x-(\d+)/);
        if (gapXMatch && node.layoutMode === 'HORIZONTAL') node.itemSpacing = parseInt(gapXMatch[1]) * 4;
        const gapYMatch = classes.match(/gap-y-(\d+)/);
        if (gapYMatch && node.layoutMode === 'VERTICAL') node.itemSpacing = parseInt(gapYMatch[1]) * 4;

        // Padding
        const pMatch = classes.match(/\bp-(\d+)\b/);
        if (pMatch) {
            const p = parseInt(pMatch[1]) * 4;
            node.paddingTop = node.paddingBottom = node.paddingLeft = node.paddingRight = p;
        }
        // Individual padding (px, py, pt, pb, pl, pr)
        const pxMatch = classes.match(/\bpx-(\d+)\b/);
        const pyMatch = classes.match(/\bpy-(\d+)\b/);
        const ptMatch = classes.match(/\bpt-(\d+)\b/);
        const pbMatch = classes.match(/\bpb-(\d+)\b/);
        const plMatch = classes.match(/\bpl-(\d+)\b/);
        const prMatch = classes.match(/\bpr-(\d+)\b/);

        if (pxMatch) node.paddingLeft = node.paddingRight = parseInt(pxMatch[1]) * 4;
        if (pyMatch) node.paddingTop = node.paddingBottom = parseInt(pyMatch[1]) * 4;
        if (ptMatch) node.paddingTop = parseInt(ptMatch[1]) * 4;
        if (pbMatch) node.paddingBottom = parseInt(pbMatch[1]) * 4;
        if (plMatch) node.paddingLeft = parseInt(plMatch[1]) * 4;
        if (prMatch) node.paddingRight = parseInt(prMatch[1]) * 4;

        // Wrap
        if (classes.includes('flex-wrap')) node.layoutWrap = 'WRAP';
    }

    // ============================================
    // CORNER RADIUS
    // ============================================
    if (classes.includes('rounded-full')) node.cornerRadius = 999;
    else if (classes.includes('rounded-3xl')) node.cornerRadius = 24;
    else if (classes.includes('rounded-2xl')) node.cornerRadius = 16;
    else if (classes.includes('rounded-xl')) node.cornerRadius = 12;
    else if (classes.includes('rounded-lg')) node.cornerRadius = 8;
    else if (classes.includes('rounded-md')) node.cornerRadius = 6;
    else if (classes.includes('rounded-sm')) node.cornerRadius = 2;
    else if (classes.includes('rounded')) node.cornerRadius = 4;
    // Arbitrary radius
    const radiusMatch = classes.match(/rounded-\[(\d+)px\]/);
    if (radiusMatch) node.cornerRadius = parseInt(radiusMatch[1]);

    // ============================================
    // ELEMENT TYPE HANDLING
    // ============================================
    if (isSvg) {
        // Treat SVG as a rectangle placeholder
        node.type = "RECTANGLE";
        node.name = "Icon";
        node.fills = node.fills || [{ type: "SOLID", color: { r: 0.7, g: 0.7, b: 0.7 }, visible: true }];
    } else if (hasImage) {
        node.type = "RECTANGLE";
        node.name = "Image";
        // Try to get actual dimensions from the img element
        const imgWidth = el.getAttribute('width');
        const imgHeight = el.getAttribute('height');
        if (imgWidth) node.width = parseInt(imgWidth);
        if (imgHeight) node.height = parseInt(imgHeight);
        node.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 }, visible: true }]; // Light gray placeholder
    } else if (isText) {
        node.type = "TEXT";
        node.characters = el.textContent?.trim() || "";
        node.fills = node.fills || [];

        // Check for width constraints to determine textAutoResize
        const hasWidth = classes.match(/w-\[(\d+)px\]/) || classes.match(/w-(\d+)/) || classes.includes('w-full');

        if (hasWidth) {
            // If width is constrained, it should wrap (Auto Height)
            node.textAutoResize = "HEIGHT";
            node.layoutSizingHorizontal = "FIXED";
            if (classes.includes('w-full')) node.layoutSizingHorizontal = "FILL";
            node.layoutSizingVertical = "HUG";
        } else {
            // Default: Auto Width (grow with text)
            node.textAutoResize = "WIDTH_AND_HEIGHT";
            node.layoutSizingHorizontal = "HUG";
            node.layoutSizingVertical = "HUG";
        }

        // Text Color
        const textHexMatch = classes.match(/text-\[#([0-9a-fA-F]{3,6})\]/);
        if (textHexMatch) {
            node.fills = [{ type: "SOLID", color: hexToRgb(textHexMatch[1]), visible: true }];
        } else {
            const textPaletteMatch = classes.match(/text-(\w+-\d+)/);
            if (textPaletteMatch && TAILWIND_COLORS[textPaletteMatch[1]]) {
                node.fills = [{ type: "SOLID", color: hexToRgb(TAILWIND_COLORS[textPaletteMatch[1]]), visible: true }];
            }
            else if (classes.includes('text-foreground') || classes.includes('text-white')) {
                node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, visible: true }];
            } else if (classes.includes('text-muted-foreground')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('a1a1aa'), visible: true }]; // zinc-400
            } else if (classes.includes('text-primary')) {
                node.fills = [{ type: "SOLID", color: hexToRgb('10b981'), visible: true }]; // emerald-500
            } else if (classes.includes('text-black')) {
                node.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, visible: true }];
            } else {
                // Default text color (white for dark theme)
                node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, visible: true }];
            }
        }

        // Font Size
        if (classes.includes('text-xs')) node.fontSize = 12;
        else if (classes.includes('text-sm')) node.fontSize = 14;
        else if (classes.includes('text-base')) node.fontSize = 16;
        else if (classes.includes('text-lg')) node.fontSize = 18;
        else if (classes.includes('text-xl')) node.fontSize = 20;
        else if (classes.includes('text-2xl')) node.fontSize = 24;
        else if (classes.includes('text-3xl')) node.fontSize = 30;
        else if (classes.includes('text-4xl')) node.fontSize = 36;
        else if (classes.includes('text-5xl')) node.fontSize = 48;
        else node.fontSize = 16;
        // Arbitrary font size
        const fontSizeMatch = classes.match(/text-\[(\d+)px\]/);
        if (fontSizeMatch) node.fontSize = parseInt(fontSizeMatch[1]);

        // Font Weight
        if (classes.includes('font-black')) node.fontName = { family: "Inter", style: "Black" };
        else if (classes.includes('font-extrabold')) node.fontName = { family: "Inter", style: "ExtraBold" };
        else if (classes.includes('font-bold')) node.fontName = { family: "Inter", style: "Bold" };
        else if (classes.includes('font-semibold')) node.fontName = { family: "Inter", style: "SemiBold" };
        else if (classes.includes('font-medium')) node.fontName = { family: "Inter", style: "Medium" };
        else if (classes.includes('font-light')) node.fontName = { family: "Inter", style: "Light" };
        else node.fontName = { family: "Inter", style: "Regular" };

        // Text Alignment
        if (classes.includes('text-center')) node.textAlignHorizontal = 'CENTER';
        else if (classes.includes('text-right')) node.textAlignHorizontal = 'RIGHT';
        else node.textAlignHorizontal = 'LEFT';

        // Letter Spacing
        if (classes.includes('tracking-tight')) node.letterSpacing = { value: -0.025, unit: 'PERCENT' };
        else if (classes.includes('tracking-wide')) node.letterSpacing = { value: 0.025, unit: 'PERCENT' };
        else if (classes.includes('tracking-widest')) node.letterSpacing = { value: 0.1, unit: 'PERCENT' };

        // Line Height
        if (classes.includes('leading-tight')) node.lineHeight = { value: 125, unit: 'PERCENT' };
        else if (classes.includes('leading-relaxed')) node.lineHeight = { value: 165, unit: 'PERCENT' };
        else if (classes.includes('leading-loose')) node.lineHeight = { value: 200, unit: 'PERCENT' };

    } else {
        // Recursively add children for container elements
        const children = Array.from(el.children)
            .filter(child => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'].includes(child.tagName))
            .map(child => elementToNode(child as HTMLElement));
        node.children = children;
    }

    return node;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    // Handle 3-char hex
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r: r / 255, g: g / 255, b: b / 255 };
}
