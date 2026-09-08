/* ─────────────────────────────────────────────────────────────
   Descriptions for the videos in  videos/

   The page lists every video file it finds in the videos/ folder
   on its own. This file only adds the words around them.

   Key = exact filename. Anything left out falls back to the
   filename as the title, with no description.

   ── Motion scene ──────────────────────────────────────────────
   Add `hero: true` to make a video the big scroll-driven scene at
   the top of the page. Only one video gets it — move the flag to
   whichever product should lead. (Without it, the first file wins.)

   `chapters` drive that scene: `at` is a position from 0 to 1
   through the video — 0 is the first frame, 1 the last. Each one
   becomes a caption and a clickable tick on the right-hand rail.
   Edit the wording freely; the timings are what matter.

   Order below = order on the page.
   ───────────────────────────────────────────────────────────── */
const VIDEO_META = {

  "Automotive_product_film_producti…_202609081523.mp4": {
    hero: true,
    eyebrow: "Exploded View",
    title: "Sedan — Full Vehicle",
    desc: "A complete car separated into body, panels and rolling chassis, then rebuilt.",
    notes: [
      "Scroll the scene to drive the animation",
      "Drag the car left or right to scrub by hand",
      "Click any chapter on the rail to jump",
    ],
    // checked against the footage: panels release from ~2.5s, fully exploded
    // by 5s, holds to ~6.4s, reassembles and is whole again by ~7.5s
    chapters: [
      { at: 0.00, title: "Detail",     text: "Opening on the headlamp — the finish before anything comes apart." },
      { at: 0.11, title: "Reveal",     text: "The complete vehicle, three-quarter view." },
      { at: 0.25, title: "Hood",       text: "The bonnet lifts and the first panels release from the body." },
      { at: 0.37, title: "Panels",     text: "Front fascia, doors and wheels draw away from the shell." },
      { at: 0.50, title: "Exploded",   text: "Body shell suspended above the rolling chassis, every layer clear." },
      { at: 0.60, title: "Powertrain", text: "Engine, transmission, exhaust line and suspension on the platform." },
      { at: 0.70, title: "Reassembly", text: "The shell settles back down and the panels close in." },
      { at: 0.84, title: "Assembled",  text: "Whole again — finished car, exactly where it started." },
    ],
  },

  "hardisk.mp4": {
    eyebrow: "Exploded View",
    title: "Hard Disk Drive",
    desc: "A 3.5-inch drive taken apart layer by layer, then put back together.",
    notes: [
      "Move `hero: true` here to make this the scroll scene instead",
    ],
    // holds fully exploded from about 4.2s to 7.2s, sealed again by 8.8s
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
