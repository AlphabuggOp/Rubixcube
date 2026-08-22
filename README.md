# RUBIX

A 3D Rubik’s Cube studio: turn a physical-feeling cube, then solve it one face at a time.

## What’s here

- Interactive 3×3 rendered with Three.js — orbit the studio, drag a sticker to turn a layer, or use the move pad and keyboard
- Accurate Western color scheme (white opposite yellow, red opposite orange, blue opposite green)
- Phase-based solver: paint **one face**, lock it, then the next phase. No dumping the whole cube in at once
- Guided beginner solution (daisy → yellow cross → corners → middle → white last layer) with play / step / jump
- Optional Kociemba short path once the worker warms up
- Undo, scramble, timer, and a solved flourish

## Hold for painting

White on top, green toward you, red on the right. Faces are asked in order: Up, Right, Front, Down, Left, Back.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # cube engine + 30 random solves
npm run build
```

## Deploy on Vercel

`vercel.json` is set up for this Vite app (build `npm run build`, output `dist`, SPA fallback).

1. Import the GitHub repo in [Vercel](https://vercel.com/new) or run `npx vercel`.
2. Keep the detected **Vite** framework, build command, and `dist` output.
3. Deploy.

```bash
npx vercel
```

## Keys

`U R F D L B` clockwise · `Shift` prime · `Z` undo · `Space` scramble · `?` help
