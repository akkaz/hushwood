# Hushwood social teaser

Ready-to-upload file: [`public/media/hushwood-teaser.mp4`](../public/media/hushwood-teaser.mp4).

20-second vertical MP4 (540 × 960, 9:16, H.264, 24 fps, YUV420p, fast-start). Approximately 300 KB. Designed to work without sound; there is deliberately no audio track. English text is baked in and the entire story can be understood muted. Social networks may transcode the upload.

The five four-second scenes introduce the classroom companion, a quiet streak, XP and growth, the school cup, and the public-game call to action. Sound levels, progress and creature animations are original illustrative graphics, not a recording of a classroom or a claim of measured educational outcomes. The streak is explicitly labeled an illustrative demo. No real teacher/student identities, testimonials, school rankings, or classroom footage appear.

The end slate uses `hushwood.akkaz.chatgpt.site`. Verify that this remains the actual public address before sharing; a changed address requires re-rendering. Posting to social media is separate from preparing this file.

## Reproduce

From the repository root, with Python 3, Pillow and FFmpeg installed:

```sh
python3 scripts/render-teaser.py
```

Optional visual review sheet (not needed for publishing):

```sh
python3 scripts/render-teaser.py --contact-sheet /tmp/hushwood-review.png
```

Frames stream directly into FFmpeg without a directory of temporary frame files. The script uses the bundled Fraunces and DM Sans fonts. Creature geometry, cup illustration, motion, page layout and captions were created for this project; no stock video, copied game assets, music or third-party character was used.

Validation: FFprobe confirms H.264, 540 × 960, 24 fps, YUV420p and exactly 20 seconds. A five-scene contact sheet was visually inspected for crop, text legibility, layout and CTA. The render is an illustrative social teaser, not browser QA of the deployed application.

Suggested post copy:

> A little quiet. A lot of growth. 🌱 Hushwood turns classroom focus into a shared adventure: a companion, quiet streaks, XP and a school cup. Open source, made for schools. Try it: https://hushwood.akkaz.chatgpt.site
