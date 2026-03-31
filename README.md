# Pioneer DDJ-RZX — Mixxx Mapping

Community MIDI mapping for the **Pioneer DDJ-RZX** 4-deck controller under [Mixxx](https://mixxx.org/).

## Status

| Feature | Status |
|---|---|
| Deck 1–4 Play / Pause / Cue | ✅ |
| Pitch Fader (all decks) | ✅ |
| Scratch / Vinyl Mode (all decks) | ✅ |
| Jog Wheel (pitch bend + scratch) | ✅ |
| Browser Encoder | ✅ |
| Loop controls | ✅ |
| FX Units | ✅ |
| Performance Pads (Hot Cue, Loop, etc.) | ✅ |
| LED Illumination (Play/Pause/Cue/Load) | ✅ |
| Jog Ring LED (lit when track loaded) | ✅ |
| Jog Ring LED rotation | ❌ hardware-driven by audio signal |
| VU Meters (hardware) | ❌ hardware-driven by audio signal |
| DDJ-RZX built-in audio interface | ❌ proprietary USB protocol, no Linux driver |

## Audio Interface

The DDJ-RZX uses a **proprietary USB audio protocol** (Vendor Specific class) that is not supported by the standard Linux `snd-usb-audio` driver. There are no PCM devices exposed under ALSA.

**You need an external USB audio interface** to get sound from Mixxx. Any USB Audio Class compliant interface works. Recommendations:

- Behringer UMC202HD (~50€)
- Focusrite Scarlett Solo 3rd gen (~90€) ← recommended
- Focusrite Scarlett 2i2 3rd gen (~130€)

Configure in Mixxx → Preferences → Sound Hardware:
- Master output → your external interface, channels 1-2
- Headphone output → your external interface, channels 3-4 (if available)

The DDJ-RZX headphone jack on the mixer requires audio to pass through the controller via USB — this does not work on Linux.

## Installation

1. Copy both files to your Mixxx controller directory:
   ```
   ~/.mixxx/controllers/
   ```
2. Start Mixxx → Preferences → Controllers → Enable **Pioneer DDJ-RZX**
3. The mapping loads automatically

## Tested on

- Ubuntu 24.04
- Mixxx 2.3 (apt)
- Pioneer DDJ-RZX (USB ID 2b73:0014)

## MIDI Details

- MIDI port: `DDJ-RZX MIDI 1` (ALSA hw:x,0)
- Channels: Deck 1–4 = ch 1–4, MIDI-OUT illumination = ch 12
- djAppConnect handshake sent on init (`0x9B 0x09 0x7F`) — required for LED illumination

## Notes

- Jog ring LED lights up correctly but **does not rotate** — rotation is driven by the audio signal through the hardware mixer, not controllable via MIDI (confirmed from official Pioneer MIDI spec)
- VU meters on the controller are analog hardware — they require audio signal through the DDJ-RZX mixer channel, which is not possible without the proprietary driver
- The USBLAN port (2b73:000f) is a CDC ECM Ethernet interface for Pro DJ Link — not an audio interface

## Contributing

Issues and pull requests welcome.
