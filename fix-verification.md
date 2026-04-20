# Category Card Hover Line Fix - Verification

## Root Cause
The previous card design had two stacked areas: an image container (h-48) and a content div below it.
The global CSS rule `* { @apply border-border }` set `border-color` on all elements (even with 0px width).
On hover, the `card-hover` class applied `translateY(-3px)`, which caused subpixel rendering artifacts
at the boundary between the image container and content area, making the border-color visible as a thin line.

## Fix Applied
Completely redesigned the card to use a **single container** approach:
- The card is a single `relative h-72 rounded-2xl overflow-hidden` div
- The image is `absolute inset-0` covering the entire card as a background
- A gradient overlay `absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent` darkens the bottom
- Content is `absolute inset-x-0 bottom-0 p-5` pinned to the bottom over the gradient

## Why This Eliminates the Bug
- There are **no stacked/adjacent block elements** that could create a seam
- All child elements are absolutely positioned within the same container
- The `overflow-hidden` on the single container clips everything cleanly
- No `translateY` hover effect is used (removed `card-hover` class)
- Hover only changes `shadow` and `ring`, which don't cause subpixel artifacts

## Structure Verification
```
<Link> (block group outline-none)
  <div> (relative h-72 rounded-2xl overflow-hidden shadow-md ...)
    <img> (absolute inset-0 w-full h-full object-cover)  ← background image
    <div> (absolute inset-0 bg-gradient-to-t ...)         ← gradient overlay
    <div> (absolute inset-x-0 bottom-0 p-5)              ← content at bottom
  </div>
</Link>
```
No adjacent block-level siblings = no seam possible.
