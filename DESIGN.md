---
name: Hushwood
description: A nature-club activity journal for a calmer classroom.
colors:
  ink: "#193b2c"
  paper: "#f8f5ec"
  muted: "#596a57"
  line: "#d9dfcf"
  lime: "#d7ef83"
  habitat: "#e8edda"
  orange: "#dc794e"
typography:
  display:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(3rem, 5.6vw, 5.4rem)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  heading:
    fontFamily: "Fraunces, serif"
    fontSize: "2.4rem"
    fontWeight: 500
    lineHeight: 1.16
    letterSpacing: "-0.035em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "8px"
  panel: "14px"
spacing:
  small: "8px"
  group: "20px"
  section: "45px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "13px 19px"
    height: "49px"
  button-light:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 19px"
---
# Hushwood design system

## Overview
The nature-club activity journal combines confident editorial headings with an original geometric creature habitat. Landing is a persuasive, interactive proof. The school dashboard is a restrained operating surface with class rows, forms and score tables. The live classroom view foregrounds the companion and readable sound feedback.

## Colors
Cream paper and forest ink carry all reading. Sage backgrounds identify the creature habitat and active session. Lime marks the school invitation; muted orange signifies sound above threshold, always alongside text and the meter. The six creature palettes are defined in src/Creature.tsx.

## Typography
Local variable Fraunces supplies display and headings; local DM Sans supplies forms, controls and explanations. Headings balance automatically. Numeric times use tabular numerals. No decorative uppercase labels or eyebrow headings.

## Layout
A 1360px maximum page uses 5% side gutters. Desktop landing pairs editorial copy with a working sound simulation. A horizontal companion selector leads to a three-column explanatory passage. At 720px the layout becomes a single column, while dashboard rows wrap their action below the class identity. At 1000px the game and controls compress. Projector mode fills the viewport.

## Elevation & Depth
Surface color and fine rules establish hierarchy; the interface has no box shadows. Creature ground ellipses belong to the character geometry. Focus is a visible 3px warm orange outline with 4px offset.

## Shapes
Controls use 7–8px corners; grouped surfaces use 12–16px corners. The original companions use capsule bodies, circles, ellipses and authored geometric paths. They are not photographic illustrations. No stock imagery or icon emoji.

## Components
Primary buttons are forest with cream text and explicit hover, focus and disabled states. Forms use persistent labels. The sound meter exposes meter semantics and a threshold marker. A screen-reader status announces mood without continuous numeric announcements. The simulation is labeled and cannot submit scores. Live sessions distinguish pause, calibration, completion, save failure and retry. Lucide icons use one stroke system.

## Do's and Don'ts
Use creature breathing and blinking as the single authored motion system; reduced-motion disables it. Keep earned XP stable through noisy moments. Preserve visible language and microphone privacy controls. Do not use student identities, punitive red scores, ornamental gradients or dashboard card grids. Do not claim calibrated decibels or verified competition measurements. Browser-render verification remains the orchestrator's responsibility; source documentation does not claim visual QA.
