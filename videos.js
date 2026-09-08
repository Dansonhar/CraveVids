/* ─────────────────────────────────────────────────────────────
   Descriptions for the videos in  videos/

   The page lists every video file it finds in the videos/ folder
   on its own. This file only adds the words around them.

   Key = exact filename. Anything left out falls back to the
   filename as the title, with no description.

   ── Motion scene ──────────────────────────────────────────────
   Add `hero: true` to make a video the big scroll-driven scene at
   the top of the page. (Without it, the first video is used.)

   `chapters` drive that scene: `at` is a position from 0 to 1
   through the video — 0 is the first frame, 1 the last. Each one
   becomes a caption and a clickable tick on the right-hand rail.
   Edit the wording freely; the timings are what matter.
   ───────────────────────────────────────────────────────────── */
const VIDEO_META = {

  "hardisk.mp4": {
    hero: true,
    eyebrow: "Exploded View",
    title: "Hard Disk Drive",
    desc: "A 3.5-inch drive taken apart layer by layer, then put back together.",
    notes: [
      "Scroll the scene to drive the animation",
      "Drag the device left or right to scrub by hand",
      "Click any chapter on the rail to jump",
    ],
    // timings checked against the footage: it holds fully exploded
    // from about 4.2s to 7.2s, then collapses back and is sealed by 8.8s
    chapters: [
      { at: 0.00, title: "Sealed",     text: "The drive as it ships — aluminium casing closed, SATA edge exposed." },
      { at: 0.14, title: "Cover",      text: "The screws release and the top cover lifts away from the chassis." },
      { at: 0.28, title: "Separate",   text: "Each layer draws apart: cover, platter, actuator, board, chassis." },
      { at: 0.44, title: "Platter",    text: "The mirror-finish platter and its spindle hub, fully clear of the body." },
      { at: 0.56, title: "Actuator",   text: "The voice-coil arm that swings the read/write head across the disk." },
      { at: 0.68, title: "Board",      text: "The controller board underneath — logic, cache and the SATA interface." },
      { at: 0.78, title: "Reassembly", text: "Every layer draws back down toward the chassis." },
      { at: 0.90, title: "Closed",     text: "Sealed up again — one solid unit, exactly where it started." },
    ],
  },

};
