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

  "craveproductviu.mp4": {
    hero: true,
    eyebrow: "Crave ProductViu\u2122",
    title: "Crave ProductViu\u2122",
    desc: "The reel: product films Crave has made — real installs, studio renders and exploded views across kiosks, engines, fibre, peripherals and enclosures.",
    notes: [
      "A showreel rather than one product, so the chapters are its segments",
    ],
    // 72.6s reel. Chapter marks are the actual scene cuts, detected from the
    // footage rather than guessed.
    chapters: [
      { at: 0.000, title: "Kiosk",         text: "A self-service kiosk going in on site — the real install, not a render." },
      { at: 0.110, title: "Engine",        text: "A complete engine assembly, every belt and pulley in place." },
      { at: 0.220, title: "Engine apart",  text: "The same engine opened out — block, crank, manifold, ancillaries." },
      { at: 0.331, title: "Fibre",         text: "Cross-section of a fibre trunk cable, the core bundles exposed." },
      { at: 0.441, title: "Rugged device", text: "A field device on the bench, shell and boards separated." },
      { at: 0.526, title: "Machinery",     text: "A conveyor line rendered clean for a spec sheet." },
      { at: 0.580, title: "Peripherals",   text: "Keyboards and laptop shot as a working desk." },
      { at: 0.629, title: "Mouse apart",   text: "A mouse exploded into shell, switches, board and sensor." },
      { at: 0.740, title: "Inspection",    text: "A fibre connector under the microscope." },
      { at: 0.850, title: "Transceivers",  text: "SFP modules, top and bottom, on a dark bench." },
      { at: 0.923, title: "Enclosure",     text: "A sealed outdoor enclosure in the field." },
      { at: 0.976, title: "Wall unit",     text: "A wall-mounted unit, installed and running." },
    ],
  },

  "washingmachine.mp4": {
    eyebrow: "Exploded View",
    title: "Washing Machine",
    desc: "A front-loader taken down to drum, motor, pump and chassis, then built back up.",
    // dark set; internals macro ~4.2s, fully exploded ~5.6-7.0s, whole by ~8.4s
    chapters: [
      { at: 0.00, title: "Whole",      text: "The machine as it stands, lit against a dark room." },
      { at: 0.14, title: "Front",      text: "Closer on the control panel and the door glass." },
      { at: 0.28, title: "Panels",     text: "The side panel releases and the drum comes into view." },
      { at: 0.42, title: "Drivetrain", text: "Macro across the motor, pump and hoses on the chassis base." },
      { at: 0.56, title: "Exploded",   text: "Front panel, tub and drum, motor, control board and side panel, all apart." },
      { at: 0.70, title: "Full stack", text: "The wide view — every assembly suspended in order." },
      { at: 0.84, title: "Assembled",  text: "Closed back up into the finished machine." },
    ],
  },

  "powerbank.mp4": {
    eyebrow: "Exploded View",
    title: "Power Bank",
    desc: "A 20,000mAh power bank opened out into shell, cell stack, board and port cluster, then closed again.",
    notes: [
      "Shot on dark marble — the only clip lit low-key rather than on white",
    ],
    // 8s clip. Shell opens from ~1.6s, fully exploded and holding 3.6-5.2s,
    // drawing back together from ~5.8s, sealed again by ~7.2s.
    chapters: [
      { at: 0.00, title: "Sealed",    text: "The finished unit — brushed aluminium shell, status window, single side button." },
      { at: 0.16, title: "Shell",     text: "The front shell releases and lifts clear of the body." },
      { at: 0.32, title: "Cells",     text: "The cell stack comes into view — cylindrical cells behind the board." },
      { at: 0.46, title: "Exploded",  text: "Every layer apart: both shells, cell stack, control board and the port cluster." },
      { at: 0.58, title: "Ports",     text: "USB-A and USB-C on their own carrier, ribbon back to the board." },
      { at: 0.72, title: "Closing",   text: "The layers draw back down into the frame." },
      { at: 0.88, title: "Sealed",    text: "Closed up again — one solid unit, exactly where it started." },
    ],
  },

  "monitor.mp4": {
    eyebrow: "Exploded View",
    title: "Desktop Monitor",
    desc: "A monitor on a lit set, opening at the rear panel to the controller board and back again.",
    notes: [
      "Cuts to a macro pass over the board partway through, then returns wide",
    ],
    // 10s clip. Rear panel separates ~2.5-4s, macro on the controller board
    // 5-7s, back to the wide set-up by ~8s, whole again at the end.
    chapters: [
      { at: 0.00, title: "Set",        text: "The monitor on its stand, screen dark, lit wall behind." },
      { at: 0.18, title: "Rear",       text: "The back panel releases and swings clear of the chassis." },
      { at: 0.34, title: "Open",       text: "Panel, frame and rear housing held apart — internals exposed." },
      { at: 0.50, title: "Board",      text: "Macro across the controller board: processor, capacitors, video inputs." },
      { at: 0.66, title: "Inputs",     text: "The HDMI and DisplayPort cluster along the board edge." },
      { at: 0.80, title: "Closing",    text: "The housing draws back onto the panel." },
      { at: 0.92, title: "Assembled",  text: "Whole again — the finished monitor on its stand." },
    ],
  },

  "smartwatch.mp4": {
    eyebrow: "Exploded View",
    title: "Smartwatch",
    desc: "A smartwatch opened into display, logic board, battery, sensor back and crown, then closed again.",
    // shot on a dark set; explode holds ~4.2-7.0s, back together by ~8.4s
    chapters: [
      { at: 0.00, title: "Crown",      text: "Opening macro on the digital crown and the case side button." },
      { at: 0.14, title: "Whole",      text: "The finished watch, face lit, strap attached." },
      { at: 0.28, title: "Display",    text: "The screen lifts away from the case and the internals appear." },
      { at: 0.42, title: "Exploded",   text: "Display, logic board, battery, sensor back and crown, all apart." },
      { at: 0.56, title: "Internals",  text: "Macro across the board, speaker and haptic engine inside the case." },
      { at: 0.70, title: "Full stack", text: "The wide view again, every layer suspended in order." },
      { at: 0.84, title: "Assembled",  text: "Closed back up — the finished watch." },
    ],
  },

  "camera.mp4": {
    eyebrow: "Exploded View",
    title: "Mirrorless Camera",
    desc: "A camera and its lens separated into optical groups, mount, sensor, boards and body shell.",
    // bright studio set; fully exploded ~4.2s, macro on the sensor ~5.6s,
    // reassembled by ~8.4s
    chapters: [
      { at: 0.00, title: "Front element", text: "Opening macro on the front of the lens, coatings catching the light." },
      { at: 0.14, title: "Whole",         text: "The complete camera, lens mounted." },
      { at: 0.28, title: "Lens",          text: "Hood and optical groups draw forward off the mount." },
      { at: 0.42, title: "Exploded",      text: "Lens groups, mount, sensor, boards, screen and top plate all apart." },
      { at: 0.56, title: "Sensor",        text: "Macro on the imaging sensor behind the last optical elements." },
      { at: 0.70, title: "Full stack",    text: "Back to the wide view, the whole camera laid out in order." },
      { at: 0.84, title: "Assembled",     text: "Everything draws back in — the finished camera." },
    ],
  },

  "sedan.mp4": {
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

  "smartphone.mp4": {
    eyebrow: "Exploded View",
    title: "Smartphone",
    desc: "A phone opened out into display, logic board, battery and rear housing, with macro cut-ins on the camera stack and charging coil.",
    notes: [
      "This clip cuts to close-ups partway through — the chapters follow those cuts",
    ],
    // 12.2s clip. Wide explode holds ~4.4-5.9s, then macro cut-ins on the
    // camera, board and charging coil, back to wide at ~8.9s, closed by ~11s.
    chapters: [
      { at: 0.00, title: "Edge",       text: "Opening macro along the frame — buttons, antenna band, speaker grille." },
      { at: 0.11, title: "Whole",      text: "The finished phone, screen dark, floating free." },
      { at: 0.24, title: "Display",    text: "The screen lifts away and the internals come into view." },
      { at: 0.36, title: "Exploded",   text: "Three layers apart: display, board and battery, rear housing." },
      { at: 0.48, title: "Camera",     text: "Macro on the camera module — the lens elements separated out." },
      { at: 0.57, title: "Logic board",text: "Macro on the board: processor, connectors and shielding." },
      { at: 0.65, title: "Coil",       text: "The copper wireless-charging coil behind the rear housing." },
      { at: 0.73, title: "Full stack", text: "Back to the wide view, every layer suspended in order." },
      { at: 0.83, title: "Closing",    text: "The layers draw back together into the housing." },
      { at: 0.91, title: "Assembled",  text: "Whole again — the finished phone." },
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
