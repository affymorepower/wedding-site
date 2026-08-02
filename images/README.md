Drop the hero photo in here as hero.jpg.

It is loaded by index.html as images/hero.jpg. Landscape, wide, with the water
low in the frame. The boat illustration floats just above the waterline.
Aim for roughly 2400px wide and under ~600KB once compressed.
Until it exists the hero falls back to a gradient, so nothing looks broken.

## What's in here

```
hero.jpg          the dam and the snow-capped Swartberg, behind the hero
flowers/          web-ready cut-outs, 256px webp, transparent, what the page loads
source/           full-resolution transparent PNGs of the same flowers
photos/           photographs of the two of us
photos/venue/     Buffelsdrift, alternative heroes, all unused
*.png (loose)     the original flower renders, on their baked-in dark backgrounds
```

**Swapping the hero** is a file swap, not a code change: copy something out of
`photos/venue/` over `hero.jpg`. Two things decide whether a photo works there.
It needs open water low in the frame, because the boat illustration is
positioned to sit on the waterline. `--boat-top` in the `:root` block is the
dial for that, as a percentage of the viewport. And it wants to be at least
2000px wide and under ~600KB; the current one is 2000x1324 at 555KB.

`photos/venue/` currently holds the elephants at the dam, hippos, the lodge at
dusk, and the earlier first-light shot of the dam that used to be the hero.

**flowers/** is what the site actually uses. `picnic`, `holud` and `wedding` are
wired to the timeline stops in `index.html` through the `--stem` custom
property. The other three (`protea-crimson`, `marigold`, `pincushion-yellow`)
are a newer set and are not used anywhere yet; swapping one in is a one-line
change per stop.

**source/** holds those three newer flowers at full size with transparency, for
anything print-shaped: stationery, save the dates, signage.

Everything in `flowers/` and `source/` has had its background removed. The
original renders arrive on solid dark backgrounds *despite* carrying an alpha
channel, so they cannot be dropped onto the linen ground as they come.
