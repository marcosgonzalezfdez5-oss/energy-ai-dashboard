# Design System – Solar Operations Intelligence

A premium enterprise SaaS design system inspired by Linear, Stripe, Vercel, and Arc Browser. Focused on clean, minimal, spacious, professional design with warm tones and excellent usability.

## Color Palette

### Core Colors
- **Background**: `#FAF8F4` – Warm beige, subtle and inviting
- **Surface**: `#FFFFFF` – Pure white for cards and surfaces
- **Primary**: `#F59E0B` – Warm amber/orange, used for CTAs and key interactions
- **Primary Hover**: `#EA9200` – Darker amber on hover states
- **Card Dark**: `#171717` – Dark charcoal for chart backgrounds

### Text & UI
- **Text Primary**: `#111111` – Near-black for main content
- **Text Secondary**: `#6B7280` – Warm gray for secondary content
- **Border**: `#E5E7EB` – Subtle borders and dividers
- **Success**: `#22C55E` – Green for positive states
- **Warning**: `#F59E0B` – Orange (same as primary) for warnings
- **Danger**: `#EF4444` – Red for errors and critical actions

## Typography

### Font Family
- **Primary**: Geist Sans (fallback to system fonts)
- **Monospace**: Monospace (for data and code)

### Type Scale

```
h1: 2.25rem (36px) – Font Weight: 700
h2: 1.875rem (30px) – Font Weight: 700
h3: 1.25rem (20px) – Font Weight: 600
body: 1rem (16px) – Font Weight: 400
small: 0.875rem (14px) – Font Weight: 500
xs: 0.75rem (12px) – Font Weight: 400
```

### Font Weights
- **700**: Titles and major headings
- **600**: Section titles and important labels
- **500**: Medium emphasis text and labels
- **400**: Body copy and descriptions

## Spacing

Using Tailwind's spacing scale throughout:
- `gap-3` / `gap-4` for component spacing
- `p-6` / `p-7` / `p-8` for padding
- `mb-8` / `mb-10` for section spacing
- `rounded-xl` (12px) for inputs and small elements
- `rounded-2xl` (16px) for cards

## Components

### Cards
- Background: `#FFFFFF` (white surfaces) or `#171717` (dark charts)
- Border radius: `rounded-2xl` (16px)
- Padding: `p-7` or `p-8`
- Shadow: Soft shadows with `shadow-lg` on hover
- Border: `border-[#E5E7EB]` for light surfaces

### Buttons
- **Primary**: `bg-[#F59E0B]` with hover scale and shadow
- **Secondary**: `bg-white` with border
- Border radius: `rounded-xl` (12px)
- Padding: `py-3.5` for comfort
- Transitions: Smooth 200ms duration
- Hover effects: Scale up slightly, enhanced shadow

### Inputs
- Border: `border-[#E5E7EB]`
- Padding: `px-4 py-3`
- Background: White with subtle focus highlight
- Focus ring: `ring-2 ring-amber-100` with border change to primary
- Border radius: `rounded-xl`

### Charts
- Background: `#171717` (dark charcoal)
- Accent line (actual): `#F59E0B` (primary orange)
- Secondary line (moving avg): `#60A5FA` (blue)
- Border radius: `rounded-2xl`
- Padding: `p-7`
- Tooltip: Dark background with subtle border

### Sidebar
- Width: `300px` (fixed)
- Background: White (`#FFFFFF`)
- Border: `border-r border-[#E5E7EB]`
- Nav items: Rounded corners with hover effect
- Active state: Light background with orange accent

## Patterns

### Floating Action Button
- Position: Fixed bottom-right
- Size: 16x16 rem (64x64px)
- Shape: Circular
- Color: Gradient from `#F59E0B` to darker amber
- Effect: Soft glow blur effect with opacity 20%
- Hover: Scale 110%, increase glow opacity, enhanced shadow

### Form Layout
- Label: Font weight 600, size 14px, color text-secondary
- Input: Rounded 12px, subtle border
- Focus: Border to primary, ring of 2px amber-100
- Helper text: Size 12px, gray color

### Data Display
- Table headers: Font weight 600, uppercase, smaller text
- Metric cards: Dark background with large values
- Chart area: Height 256px (h-64)
- Legend: Positioned below charts

## Animations

### Page Transitions
- Duration: 150-250ms
- Easing: ease-in-out

### Component Interactions
- Buttons: `scale-105` on hover, shadow enhancement
- Cards: Shadow grow on hover
- Dropdowns: Smooth open/close rotation
- Charts: Animated line drawing on load

### Specific Animations
```css
/* Button hover */
transition: all 0.2s ease;
hover:scale-105;
hover:shadow-xl;

/* Focus ring */
focus:ring-2 focus:ring-amber-100;
focus:border-[#F59E0B];

/* Smooth open */
transition-all duration-200;
```

## Layout Principles

### Mobile First
- Start with single column layouts
- Use grid for larger screens
- Breakpoints: `md:`, `lg:` for responsiveness

### Whitespace
- Generous padding and margins
- Breathing room between sections
- Not cramped or crowded

### Visual Hierarchy
- Large titles with ample contrast
- Secondary text in gray
- Action items prominent in primary color
- Clear visual separation between sections

## States

### Button States
- Normal: `bg-[#F59E0B]`
- Hover: `bg-[#EA9200]` with scale and shadow
- Active: Visual feedback with slight scale down
- Disabled: Reduced opacity with cursor-not-allowed

### Input States
- Normal: White background, subtle border
- Focus: Orange border, ring of amber-100
- Error: Red border, red background hint
- Disabled: Gray background, cursor-not-allowed

### Cards
- Normal: White or dark with subtle shadow
- Hover: Enhanced shadow, slight scale up
- Active: Highlighted border or background tint

## Accessibility

- All buttons and inputs have clear focus states
- Color contrast meets WCAG AA standards
- Text is legible (line-height 1.4-1.6)
- Icons have alt text or aria-labels
- Semantic HTML used throughout

## Usage Examples

### Creating a New Component

```tsx
export default function MyComponent() {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#E5E7EB]">
      <h2 className="text-2xl font-bold text-[#111111] mb-4">Title</h2>
      <p className="text-[#6B7280] mb-6">Description</p>
      
      <button className="bg-[#F59E0B] hover:bg-[#EA9200] text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105">
        Action
      </button>
    </div>
  );
}
```

### Chart Component

```tsx
<div className="bg-[#171717] rounded-2xl p-7 shadow-lg">
  <h3 className="text-white text-sm font-600">Metric Title</h3>
  <p className="text-4xl font-bold text-white mt-3">Value</p>
  
  <LineChart data={data}>
    <Line stroke="#F59E0B" />
    <Line stroke="#60A5FA" strokeDasharray="5 5" />
  </LineChart>
</div>
```

## Brand Voice

The design communicates:
- **Enterprise Reliability**: Professional, trustworthy
- **Clarity**: Clear hierarchy, purposeful spacing
- **Operational Intelligence**: Focused on decision-making
- **Premium Quality**: Refined interactions, smooth animations
- **Modern Tech**: Current, forward-thinking aesthetic

## Future Enhancements

- Dark mode toggle (inverse color scheme)
- Animation variants for different contexts
- Component library with Storybook
- Design tokens in multiple formats (CSS, JSON)
- Accessibility audit and refinements
