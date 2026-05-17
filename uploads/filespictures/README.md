# PediatricScene — deployment

Three files. Drop them into your existing React site.

## Files

| File | Where to put it |
| --- | --- |
| `PediatricScene.jsx` | Anywhere in your components folder (e.g. `src/components/`) |
| `scene-base.webp` | In your public/static folder so it serves at `/scene-base.webp` |
| `scene-hand.webp` | In your public/static folder so it serves at `/scene-hand.webp` |

Common public folder locations:
- **Create React App** → `public/`
- **Vite** → `public/`
- **Next.js** → `public/`
- **Remix** → `public/`

## Use it

```jsx
import PediatricScene from "./components/PediatricScene";

export default function Home() {
  return (
    <section style={{ height: 640 }}>
      <PediatricScene />
    </section>
  );
}
```

## If the images live somewhere other than `/`

Pass paths as props:

```jsx
<PediatricScene
  baseImg="/assets/scene-base.webp"
  handImg="/assets/scene-hand.webp"
/>
```

## Customization

The component accepts `className` and `style` props if you need to constrain
or theme the container. The scene fills its parent and preserves the
illustration's aspect ratio.

## What's inside

- The doctor's hand places the stethoscope on the child's chest on mount,
  then maintains a gentle auscultation rhythm
- Two 3D-tilting glass tabs: "Care with compassion" and "Evidence based treatment"
- Four drifting medical icon chips (stethoscope, pill, cross, sparkle)
- Pulse rings emanating from the stethoscope contact point
- Soft cream sun + indigo halo backdrop, ambient particle dots
- Mouse parallax across all layers at differential depths
- Respects `prefers-reduced-motion`

## Dependencies

Just React. No framer-motion, no Tailwind, no extra packages.
