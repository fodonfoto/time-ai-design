# System Prompt Architecture สำหรับ AI UI Generation ✨

จากการวิเคราะห์หลักการของ **Google Stitch**, **Figma Make**, **Seek.design** และงานวิจัยล่าสุด เอกสารนี้อธิบายวิธีสร้างระบบหลังบ้าน (Backend Architecture) ให้ AI สร้าง UI ที่สวยงาม เป็นระเบียบ และตรงตามหลักการออกแบบ

---

## 1️⃣ **สัญชาติญาณพื้นฐาน: Generative UI = Co-creation Process**

ไม่ใช่เพียงแค่ "AI สร้าง UI" แต่เป็น **computational co-creation** ระหว่าง AI กับ human intent

```
Human Intent 
    ↓
[System Prompt Layer]  ← คอนโทรลอย่างแม่นยำ
    ↓
[Constraint Layer]     ← Design System Tokens
    ↓
[Generation Layer]     ← AI Model (Claude, Gemini)
    ↓
[Validation Layer]     ← Pattern Matching & QA
    ↓
Beautiful UI Output
```

---

## 2️⃣ **System Prompt Architecture (4 Layers)**

### **Layer 1: Context & Foundation**
```markdown
# Role Definition
You are an expert UI/UX designer and frontend developer. 
Your role is to create pixel-perfect, accessible, 
and performant user interfaces based on user specifications.

# Constraints (The Wall)
- Platform: [iOS/Android/Web]
- Screen Count: Maximum 6 screens per generation
- Device Size: [Specify: 375px width for mobile]
- Accessibility: WCAG 2.1 AA compliant
- Response Time: < 30 seconds for generation
```

**ทำไมต้องมี Constraints?**  
ความชัดเจนเกี่ยวกับขีดจำกัด ช่วยให้ AI มี focus และสร้างผลลัพธ์ที่คาดเดาได้

---

### **Layer 2: Design System Reference**

นี่คือ **ส่วนที่สำคัญที่สุด** ของระบบ

```yaml
DESIGN_SYSTEM:
  
  # Color Tokens
  colors:
    primary: "#2088D9"
    secondary: "#1E88E5"
    error: "#D32F2F"
    success: "#388E3C"
    neutral:
      50: "#F5F5F5"
      100: "#EEEEEE"
      900: "#212121"
  
  # Typography Tokens
  typography:
    heading_1: 
      font_size: 32px
      font_weight: 700
      line_height: 1.2
      family: "Inter"
    heading_2:
      font_size: 24px
      font_weight: 600
      line_height: 1.3
      family: "Inter"
    body:
      font_size: 14px
      font_weight: 400
      line_height: 1.5
      family: "Inter"
  
  # Spacing System (8px base)
  spacing:
    xs: 4px    # 0.5x
    sm: 8px    # 1x
    md: 16px   # 2x
    lg: 24px   # 3x
    xl: 32px   # 4x
    2xl: 48px  # 6x
  
  # Component Patterns
  components:
    button:
      sizes: ["sm", "md", "lg"]
      variants: ["primary", "secondary", "ghost"]
      border_radius: 8px
      padding: "8px 16px"
    
    card:
      border_radius: 12px
      shadow: "0 2px 8px rgba(0,0,0,0.1)"
      padding: 16px
    
    input:
      border_radius: 6px
      border_width: 1px
      height: 40px
      padding: "8px 12px"
  
  # Grid & Layout
  layout:
    grid_columns: 12
    gap: 16px
    breakpoints:
      mobile: 375px
      tablet: 768px
      desktop: 1024px
```

**ทำไม Token-based Design System?**
- ✅ ลดความไม่สอดคล้องกัน (Consistency)
- ✅ ง่ายต่อการแก้ไขหลาย ๆ จอพร้อมกัน
- ✅ AI เข้าใจกฎเกณฑ์ที่ชัดเจน
- ✅ Maintainability ทีมพัฒนา

---

### **Layer 3: Workflow Instructions**

สร้างขั้นตอนการทำงาน step-by-step

```markdown
WORKFLOW:

1. INTERPRET USER REQUEST
   - Is this single screen or multiple screens?
   - Extract: purpose, features, target users, vibe
   - If ambiguous → Ask clarifying questions
   - If clear → Proceed to step 2

2. PROPOSE STRUCTURE (for multi-screen apps)
   - List proposed screens as bullet points
   - Format: "Screen name - Description"
   - Wait for user confirmation before proceeding
   - Example:
     • Login Screen - Email/password input
     • Dashboard - Overview stats & charts
     • Settings - User preferences

3. GENERATE DESIGN
   - Create each screen respecting Design Tokens
   - Ensure component hierarchy
   - Apply color scheme consistently
   - Use spacing tokens for margins/padding
   - Add interactive states (hover, active, disabled)

4. HANDLE EDGE CASES
   - Empty states: Show helpful illustration
   - Error states: Use error color + message
   - Loading states: Show skeleton loaders
   - Long content: Implement proper scrolling

5. ITERATE WITH FEEDBACK
   - After generation: "Would you like any changes?"
   - Handle specific, incremental changes
   - Format: "On [screen], change [element] to [description]"
   - Maintain consistency across all screens
```

---

### **Layer 4: Output Format Specification**

กำหนด output ให้ชัดเจน

```json
OUTPUT_FORMAT:

{
  "metadata": {
    "screens_count": 1,
    "estimated_tokens": 2000,
    "generated_at": "ISO-8601",
    "model_used": "claude-sonnet-4"
  },
  
  "screens": [
    {
      "screen_id": "login-01",
      "screen_name": "Login Screen",
      "layout": "flex-column",
      "components": [
        {
          "id": "logo",
          "type": "image",
          "src": "descriptive-placeholder",
          "width": 120,
          "height": 40,
          "margin_bottom": "lg"
        },
        {
          "id": "email-input",
          "type": "input",
          "label": "Email Address",
          "placeholder": "name@example.com",
          "token_style": "input",
          "required": true
        },
        {
          "id": "submit-btn",
          "type": "button",
          "text": "Sign In",
          "variant": "primary",
          "size": "md",
          "margin_top": "lg",
          "on_click": "validate_and_submit"
        }
      ],
      "accessibility": {
        "semantic_html": true,
        "aria_labels": ["email-input", "password-input"],
        "keyboard_navigation": true,
        "color_contrast": "WCAG_AA"
      }
    }
  ],
  
  "styles_used": ["primary", "body", "md-spacing"],
  "components_used": ["button", "input", "card"],
  "next_suggested_steps": [...]
}
```

---

## 3️⃣ **Specific Prompting Strategies (จากการ Leak ของ Google Stitch)**

### **A. Front-load Details in First Prompt**

❌ **ไม่ดี:**
> "สร้าง app ออนไลน์ช็อปปิง"

✅ **ดี:**
> "สร้าง product detail page สำหรับ e-commerce app:
> - Product image carousel (4 images)
> - Product title, rating (5 stars)
> - Price with discount badge
> - Color & size selector
> - Add to cart button (primary blue)
> - Stock status indicator
> - Description & reviews section
> 
> Style: Modern & clean
> Colors: Primary blue #2088D9, neutral grays
> Font: Inter
> Target: Mobile (375px width)
> Mood: Trustworthy, premium e-commerce"

**ประกอบด้วย:**
- **Task**: อะไรที่ต้องสร้าง
- **Context**: ใช้ที่ไหน
- **Key elements**: Features สำคัญ
- **Expected behaviors**: เมื่อกดแล้ว?
- **Constraints**: Device, styling, vibe

### **B. Chain Prompting (Iterative Refinement)**

**Iteration 1:**
> "ปรับหน้า login ให้มี social login buttons (Google, Apple)"

**Iteration 2:**
> "เพิ่ม 'Forgot Password' link ใต้ password field"

**Iteration 3:**
> "เปลี่ยนสีปุ่ม submit จาก blue เป็น green"

**ไม่เขียนใหม่ทั้งหมด** → ปรับ incremental เท่านั้น

### **C. Context Reference Pattern**

> "ใช้ design system ของโปรเจกต์เดิม:
> - Primary color: brand blue
> - Font: Inter
> - Button style: 8px rounded, 16px padding
> - Spacing: 16px grid
> 
> สร้าง new screen นี้ให้ match กับ dashboard screen ที่มีอยู่"

**AI จะทำให้:**
- ✅ UI ใหม่ match สไตล์เดิม
- ✅ ไม่มี style inconsistency
- ✅ ง่ายต่อการ integrate

---

## 4️⃣ **Backend Implementation Pattern**

### **Pseudo-code Architecture**

```python
class AIUIGenerator:
    
    def __init__(self):
        self.design_system = load_design_tokens()
        self.system_prompt = build_system_prompt()
        self.llm = initialize_claude_sonnet()
    
    def build_system_prompt(self):
        """Assemble complete system prompt from layers"""
        return f"""
        {LAYER_1_CONTEXT}
        
        {LAYER_2_DESIGN_SYSTEM}
        {self.design_system.to_prompt_format()}
        
        {LAYER_3_WORKFLOW}
        
        {LAYER_4_OUTPUT_FORMAT}
        """
    
    def generate_ui(self, user_request):
        """Main generation method"""
        
        # Step 1: Parse & Validate
        interpretation = self.interpret_request(user_request)
        
        if not interpretation.is_valid():
            return self.ask_clarification()
        
        # Step 2: Propose Structure (if multi-screen)
        if interpretation.screen_count > 1:
            proposal = self.propose_screens(interpretation)
            return {"proposal": proposal, "status": "awaiting_confirmation"}
        
        # Step 3: Generate with constraints
        context = self.build_context(interpretation)
        
        generation_prompt = f"""
        User Request: {user_request}
        
        Context: {context}
        
        Generate the UI following the constraints above.
        """
        
        result = self.llm.complete(
            system_prompt=self.system_prompt,
            user_message=generation_prompt,
            temperature=0.3,  # Lower = more consistent
            max_tokens=4000
        )
        
        # Step 4: Validate & Return
        validated = self.validate_output(result)
        return self.format_response(validated)
    
    def validate_output(self, generated_output):
        """Quality assurance layer"""
        checks = [
            self.check_design_token_compliance(),
            self.check_accessibility(),
            self.check_component_hierarchy(),
            self.check_spacing_consistency(),
            self.check_color_contrast()
        ]
        
        if not all(checks):
            # Regenerate with stricter constraints
            return self.regenerate_with_corrections()
        
        return generated_output
    
    def handle_refinement(self, screen_id, change_request):
        """Incremental refinement (chain prompting)"""
        
        current_design = self.get_screen(screen_id)
        
        refinement_prompt = f"""
        Current design:
        {current_design}
        
        User request: {change_request}
        
        Make ONLY this specific change. Don't regenerate entire screen.
        """
        
        return self.llm.complete(
            system_prompt=self.system_prompt,
            user_message=refinement_prompt,
            temperature=0.2  # Even lower for small changes
        )
```

---

## 5️⃣ **Design Pattern Library (ให้ AI Reference)**

```yaml
PATTERN_LIBRARY:

# Navigation Patterns
navigation:
  - bottom_tab_bar: "[Mobile] Icons + labels, 4-5 items max"
  - top_app_bar: "[Mobile] Back button, title, optional icon"
  - sidebar: "[Desktop] Collapsible, icons + labels"
  - breadcrumb: "[Web] Path navigation, >> separator"

# List Patterns
lists:
  - simple_list: "Title + subtitle, no image"
  - card_list: "Images, title, subtitle, action button"
  - grouped_list: "Section headers, dividers between items"
  - infinite_scroll: "Loading indicator at bottom"

# Form Patterns
forms:
  - single_column: "Mobile: full width inputs"
  - two_column: "Desktop: side-by-side inputs"
  - validation: "Error message below input, red border"
  - success: "Green checkmark, success message"

# Empty States
empty_states:
  - no_results: "Illustration + 'No results found' + search tips"
  - no_data: "Icon + 'Get started' message + CTA button"
  - error: "Error icon + message + retry button"

# Loading States
loading:
  - skeleton: "Gray placeholders matching content shape"
  - spinner: "Centered loader with 'Loading...' text"
  - progress: "Horizontal progress bar for uploads"

# Modal Patterns
modals:
  - confirmation: "Title + message + [Cancel][Confirm] buttons"
  - input: "Title + input field + [Cancel][Submit] buttons"
  - bottom_sheet: "Dark overlay + content sliding up from bottom"
  - alert: "Icon + title + message + [OK] button"
```

---

## 6️⃣ **Key Principles สำหรับ High-Quality Output**

| Principle | Implementation | AI Prompt Instruction |
|-----------|-----------------|----------------------|
| **Consistency** | Centralized design tokens | "Use ONLY colors/fonts/spacing from design system" |
| **Hierarchy** | Clear visual priority | "Use heading_1 for main title, body for description" |
| **Accessibility** | WCAG 2.1 AA | "Add aria-labels, ensure 4.5:1 contrast ratio" |
| **Responsive** | Mobile-first layout | "Design for 375px first, then scale to desktop" |
| **Performance** | Minimal components | "Limit DOM elements to < 50 per screen" |
| **User Intent** | Front-loaded details | "Include all context in first prompt" |
| **Iterative** | Chain prompting | "Make small, incremental changes only" |
| **Predictability** | Lower temperature | "temperature: 0.2-0.3 for consistent results" |

---

## 7️⃣ **Advanced: Constraint System (UIDEC Model)**

อ้างอิงจาก research ล่าสุด

```markdown
CONSTRAINT_TYPES:

1. BRAND_CONSTRAINTS
   - Logo placement
   - Color palette (mandatory vs optional)
   - Typography family
   - Tone of voice

2. TECHNICAL_CONSTRAINTS
   - Platform (iOS/Android/Web)
   - API integration points
   - Performance budget
   - Browser support

3. USER_CONSTRAINTS
   - Target user personas
   - Accessibility needs
   - Language support
   - Device types

4. BUSINESS_CONSTRAINTS
   - Conversion goals
   - Compliance requirements (GDPR, etc.)
   - Industry standards
   - Competitor analysis

5. DESIGN_CONSTRAINTS
   - Design system compliance
   - Component reusability
   - Layout grid (12-column)
   - Motion principles
```

AI generation ต้อง **respects all constraints** เพื่อให้ได้ design ที่:
- ✅ On-brand
- ✅ Technically feasible
- ✅ User-appropriate
- ✅ Compliant
- ✅ Beautiful

---

## 🎯 **Prompt Template สำหรับคุณใช้เลย**

```markdown
=== SYSTEM PROMPT TEMPLATE ===

You are an expert UI/UX designer and frontend engineer.
Your task is to generate beautiful, consistent, accessible interfaces.

CONSTRAINTS:
- Platform: {PLATFORM}
- Max screens: {MAX_SCREENS}
- Response format: JSON with component hierarchy

DESIGN SYSTEM:
{INSERT_DESIGN_TOKENS_HERE}

WORKFLOW:
1. Interpret: What is being requested?
2. Validate: Is the request clear?
3. Reference: Check design system
4. Generate: Create components respecting tokens
5. Verify: Validate accessibility & consistency
6. Return: Formatted JSON output

OUTPUT FORMAT:
{
  "screens": [...],
  "components_used": [...],
  "styles_applied": [...]
}

=== END SYSTEM PROMPT ===
```

---

## 📚 **Resources & References**

1. [Google Stitch - Leaked system prompt analysis](https://dev.to/yang_ella_f2a3e16ccb54550/google-stitch-system-prompt-leaked-analysis-and-insights-23dp)
2. [Figma Make - 8 Essential Tips](https://www.figma.com/blog/8-ways-to-build-with-figma-make/)
3. [UIDEC Research - Ideating Under Constraints](https://arxiv.org/html/2501.18748v1)
4. [Generative UI Definition](https://arxiv.org/html/2505.15049v1)
5. [Token Optimization for Effective Prompts](https://developer.ibm.com/articles/awb-token-optimization-backbone-of-effective-prompt-engineering/)
6. [Next Generation Design Systems](https://www.rubrik.com/blog/architecture/20/9/next-generation-design-systems)
