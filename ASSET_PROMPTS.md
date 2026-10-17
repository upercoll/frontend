# RBstars 3D Asset Prompts (Midjourney / Flux / Firefly / GPT-image)

> Learned 2026-10-10. Use these to generate art that matches the "RoGoat"
> design system (see `DESIGN_SYSTEM.md`): glossy, rounded, toy-like 3D
> renders with warm key light + cool blue rim light, on the brand navy.

---

## Shared style suffix — append to EVERY prompt

```
glossy stylized 3D render, soft rounded toy-like forms, Pixar-like lighting, warm key light with cool blue rim light, isolated on a plain dark navy (#121a2e) background, centered, no text, 4k
```

## Background removal (every asset)

1. remove.bg, Photoroom, or Photopea "Select subject"
2. Export **transparent PNG** (no background, no text)

---

## Murder-mystery style knives and weapons (original designs)

- `fantasy collectible knife with a green crystal blade and spiked bio-mechanical handle`
- `pink heart-themed ornate dagger with angel wings guard`
- `frozen ice battle axe with a skull and glowing blue eyes`
- `colorful toy water gun with orange tank and rainbow grip`
- `dark crystal crossbow with green glowing limbs`

## Bedwars style (original)

- `floating sky island with colorful bed, wool blocks, tiny voxel towers, emerald and diamond generators`
- `voxel diamond sword, golden apple, emerald pile, glossy`
- `cute blocky knight avatar with iron armor holding a wool block`

## Jailbreak style (original) ← current live game on the backend

- `cute blocky police car and getaway sports car, glossy, 3/4 view`
- `toy bank vault door open with gold bars, cartoon`
- `blocky cartoon helicopter and small jetpack, glossy`

## General marketplace props

- `stack of shiny gold coins and a glossy green gem, cartoon 3D`
- `wooden treasure chest overflowing with crystals, voxel style`
- `blocky avatar character in orange hoodie with sunglasses, 3D toy render`
- `wizard with crystal staff and chest, voxel cartoon style`
- `floating island with waterfalls, tree, rocks and a cartoon goat`
- `puffy white cloud, glossy 3D`
- `little cartoon bat flying`
- `large voxel tree with rocks and grass, cropped at edge` (page-edge decoration)

---

## Usage notes

- **Item renders** (product cards): 1:1-ish transparent PNG, soft drop
  shadow, centered. Match the 204×203 product card frame.
- **Hero scenes**: wide floating composition; the reference hero
  (`public/rogoat/hero.png`) is the bar — Pixar-like, soft studio light,
  glossy rounded forms.
- **Page-edge props**: generate slightly off-center/cropped so they can bleed
  off the canvas edge (design system art direction).
- **Characters**: the brand is a Roblox item marketplace — blocky/cartoon
  characters fit better than realistic ones.
