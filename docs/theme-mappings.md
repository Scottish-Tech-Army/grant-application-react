# Brand Palette Utility Mappings

Use these mappings if you want Tailwind utilities or simple CSS utility classes.

## Tailwind (Suggested)

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#005BBB",
          primaryLight: "#2DA8FF",
          accent: "#FFB300",
          highlight: "#FFD45A",
          white: "#FFFFFF",
          text: "#00325F",
          textMuted: "#3F5F85",
        },
      },
      boxShadow: {
        brandSm: "0 6px 18px rgba(0, 91, 187, 0.12)",
        brandMd: "0 12px 26px rgba(0, 91, 187, 0.18)",
      },
    },
  },
};
```

**Examples**
- Primary button: `bg-brand-primary text-white hover:bg-brand-primaryLight`
- Secondary button: `bg-brand-accent text-white hover:bg-brand-highlight`
- Link: `text-brand-primary hover:text-brand-primaryLight`

## CSS Utility Classes (Optional)

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.btn-secondary {
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.text-link {
  color: var(--color-link);
}

.text-link:hover {
  color: var(--color-link-hover);
}

.card {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
```
