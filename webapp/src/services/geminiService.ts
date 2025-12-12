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

function elementToNode(el: HTMLElement): any {
    // Determine type
    const isText = el.tagName.match(/^H[1-6]$|^P$|^SPAN$|^BUTTON$|^A$/) || (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE);
    const hasImage = el.tagName === 'IMG';

    // Parse styles
    let classes = "";
    if (typeof el.className === 'string') {
        classes = el.className;
    } else if (el.getAttribute) {
        classes = el.getAttribute('class') || "";
    }

    const node: any = {
        type: "FRAME", // Default
        name: el.tagName,
        children: []
    };

    // Color Logic - Design System Token Mapping
    const bgMatch = classes.match(/bg-\[#([0-9a-fA-F]+)\]/);
    if (bgMatch) {
        node.fills = [{ type: "SOLID", color: hexToRgb(bgMatch[1]) }];
    } else if (classes.includes('bg-background')) {
        node.fills = [{ type: "SOLID", color: hexToRgb('1a1a1a') }];
    } else if (classes.includes('bg-card')) {
        node.fills = [{ type: "SOLID", color: hexToRgb('2d2d2d') }];
    } else if (classes.includes('bg-primary')) {
        node.fills = [{ type: "SOLID", color: hexToRgb('10a37f') }];
    } else if (classes.includes('bg-secondary')) {
        node.fills = [{ type: "SOLID", color: hexToRgb('27272a') }];
    } else if (classes.includes('bg-muted')) {
        node.fills = [{ type: "SOLID", color: hexToRgb('27272a') }];
    } else if (classes.includes('bg-white')) {
        node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    } else if (classes.includes('bg-black')) {
        node.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    } else if (classes.includes('bg-transparent')) {
        node.fills = [];
    }

    // Border Logic
    if (classes.includes('border')) {
        node.strokes = [{ type: "SOLID", color: hexToRgb('4a4a4a') }]; // border-border
        node.strokeWeight = 1;
        if (classes.includes('border-white/5')) {
            node.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.05 }];
        } else if (classes.includes('border-white/10')) {
            node.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
        }
    }

    // Layout Logic
    if (classes.includes('flex')) {
        node.layoutMode = classes.includes('flex-col') ? "VERTICAL" : "HORIZONTAL";
        node.primaryAxisAlignItems = classes.includes('justify-center') ? "CENTER" : classes.includes('justify-between') ? "SPACE_BETWEEN" : classes.includes('justify-end') ? "MAX" : "MIN";
        node.counterAxisAlignItems = classes.includes('items-center') ? "CENTER" : classes.includes('items-end') ? "MAX" : "MIN";

        // Gap
        const gapMatch = classes.match(/gap-(\d+)/);
        if (gapMatch) node.itemSpacing = parseInt(gapMatch[1]) * 4;

        // Padding
        const pMatch = classes.match(/p-(\d+)/);
        if (pMatch) {
            const p = parseInt(pMatch[1]) * 4;
            node.paddingTop = node.paddingBottom = node.paddingLeft = node.paddingRight = p;
        } else {
            // Individual padding
            const pxMatch = classes.match(/px-(\d+)/);
            const pyMatch = classes.match(/py-(\d+)/);
            const ptMatch = classes.match(/pt-(\d+)/);
            const pbMatch = classes.match(/pb-(\d+)/);

            if (pxMatch) node.paddingLeft = node.paddingRight = parseInt(pxMatch[1]) * 4;
            if (pyMatch) node.paddingTop = node.paddingBottom = parseInt(pyMatch[1]) * 4;
            if (ptMatch) node.paddingTop = parseInt(ptMatch[1]) * 4;
            if (pbMatch) node.paddingBottom = parseInt(pbMatch[1]) * 4;
        }
    }

    // Corner Radius
    if (classes.includes('rounded-full')) node.cornerRadius = 999;
    else if (classes.includes('rounded-3xl')) node.cornerRadius = 24;
    else if (classes.includes('rounded-xl')) node.cornerRadius = 12;
    else if (classes.includes('rounded-lg')) node.cornerRadius = 8;
    else if (classes.includes('rounded-md')) node.cornerRadius = 6;

    if (hasImage) {
        node.type = "RECTANGLE";
        node.name = "Image";
        node.fills = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
    } else if (isText) {
        node.type = "TEXT";
        node.characters = el.textContent || "";
        node.fills = [];

        // Text Color
        const textMatch = classes.match(/text-\[#([0-9a-fA-F]+)\]/);
        if (textMatch) {
            node.fills = [{ type: "SOLID", color: hexToRgb(textMatch[1]) }];
        } else if (classes.includes('text-foreground')) {
            node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // White
        } else if (classes.includes('text-muted-foreground')) {
            node.fills = [{ type: "SOLID", color: hexToRgb('b3b3b3') }];
        } else if (classes.includes('text-primary')) {
            node.fills = [{ type: "SOLID", color: hexToRgb('10a37f') }];
        } else if (classes.includes('text-white')) {
            node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        } else if (classes.includes('text-black')) {
            node.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
        } else {
            node.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        }

        // Font Size
        if (classes.includes('text-xs')) node.fontSize = 12;
        else if (classes.includes('text-sm')) node.fontSize = 14;
        else if (classes.includes('text-base')) node.fontSize = 16;
        else if (classes.includes('text-lg')) node.fontSize = 18;
        else if (classes.includes('text-xl')) node.fontSize = 20;
        else if (classes.includes('text-2xl')) node.fontSize = 24;
        else if (classes.includes('text-3xl')) node.fontSize = 30;
        else node.fontSize = 16;

        // Font Weight
        if (classes.includes('font-bold')) node.fontName = { family: "Inter", style: "Bold" };
        else if (classes.includes('font-medium')) node.fontName = { family: "Inter", style: "Medium" };
        else node.fontName = { family: "Inter", style: "Regular" };

    } else {
        // Recursively add children
        const children = Array.from(el.children).map(child => elementToNode(child as HTMLElement));
        node.children = children;
    }

    return node;
}

function hexToRgb(hex: string) {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r: r / 255, g: g / 255, b: b / 255 };
}
