# DiwaliVerse 2026 🪔
*Illuminate Your World. Celebrate the Light.*

A cinematic Diwali website: 3D diya (Three.js), fireworks, rangoli creator, greeting studio, lantern release, quiz, 3 themes, ambient sound. Vanilla HTML/CSS/JS, no backend.

## Wish your beloved
Open the site, type their name on the first screen, then in the final section press **Copy personal link**. Sharing `https://smiling-coder.github.io/DiwaliVerse-2026/?to=Their%20Name` shows the site personalised for them. Use the Greeting Studio to download a card PNG and send it too.

## Deploy on GitHub Pages
1. Create a repo named `DiwaliVerse-2026` on GitHub and upload all files (keep `index.html` in the root).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Choose branch `main`, folder `/ (root)`, Save.
4. After ~1 minute, visit `https://smiling-coder.github.io/DiwaliVerse-2026/`.

Three.js loads from the cdnjs CDN, so the 3D diya needs internet. If it fails, the site still works without it.

## Testing checklist
- [ ] Diya appears, drags/rotates, tap lights and extinguishes; Enter works
- [ ] Click/tap launches fireworks; auto fireworks run; Replay works
- [ ] Rangoli sliders, palette, Random and PNG download work
- [ ] Greeting card updates live, themes change, PNG downloads
- [ ] Lantern floats up with the wish text
- [ ] Quiz: answers, score, review list, replay
- [ ] Theme choice stays after refresh; sound toggle starts silent
- [ ] Works on phone width; keyboard Tab/Space/Arrows; no console errors

## Future backend ideas
Shared lantern wall (Firebase/Supabase), saved cards, real wish guestbook, scheduled personal messages.

## Notes
`assets/` is empty on purpose: everything (diya, flame, sound) is generated in code. Add your own photos in `assets/images/` if you like.
