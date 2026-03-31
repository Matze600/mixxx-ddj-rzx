////////////////////////////////////////////////////////////////////////
// JSHint configuration                                               //
////////////////////////////////////////////////////////////////////////
/* global engine                                                      */
/* global script                                                      */
/* global midi                                                        */
/* global bpm                                                         */
/* global components                                                  */
////////////////////////////////////////////////////////////////////////
var PioneerDDJRZX = function() {};

/*
	Author: 		DJMaxergy
	Version: 		1.19, 05/01/2018
	Description: 	Pioneer DDJ-RZX Controller Mapping for Mixxx
    Source: 		http://github.com/DJMaxergy/mixxx/tree/pioneerDDJRZX_mapping

    Copyright (c) 2018 DJMaxergy, licensed under GPL version 2 or later
    Copyright (c) 2014-2015 various contributors, base for this mapping, licensed under MIT license

    Contributors:
    - Michael Stahl (DG3NEC): original DDJ-SB2 mapping for Mixxx 2.0
    - Sophia Herzog: midiAutoDJ-scripts
    - Joan Ardiaca Jové (joan.ardiaca@gmail.com): Pioneer DDJ-SB mapping for Mixxx 2.0
    - wingcom (wwingcomm@gmail.com): start of Pioneer DDJ-SB mapping
      https://github.com/wingcom/Mixxx-Pioneer-DDJ-SB
    - Hilton Rudham: Pioneer DDJ-SR mapping
      https://github.com/hrudham/Mixxx-Pioneer-DDJ-SR

    GPL license notice for current version:
    This program is free software; you can redistribute it and/or modify it under the terms of the
    GNU General Public License as published by the Free Software Foundation; either version 2
    of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See
    the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with this program; if
    not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.


    MIT License for earlier versions:
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software
    and associated documentation files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or
    substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
    BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

///////////////////////////////////////////////////////////////
//                       USER OPTIONS                        //
///////////////////////////////////////////////////////////////

// Sets the jogwheels sensitivity. 1 is default, 2 is twice as sensitive, 0.5 is half as sensitive.
PioneerDDJRZX.jogwheelSensitivity = 1;

// Sets how much more sensitive the jogwheels get when holding shift.
// Set to 1 to disable jogwheel sensitivity increase when holding shift (default: 10).
PioneerDDJRZX.jogwheelShiftMultiplier = 10;

// If true, vu meters twinkle if AutoDJ is enabled (default: true).
PioneerDDJRZX.twinkleVumeterAutodjOn = true;
// If true, selected track will be added to AutoDJ queue-top on pressing shift + rotary selector,
// else track will be added to AutoDJ queue-bottom (default: false).
PioneerDDJRZX.autoDJAddTop = false;
// Sets the duration of sleeping between AutoDJ actions if AutoDJ is enabled [ms] (default: 1000).
PioneerDDJRZX.autoDJTickInterval = 1000;
// Sets the maximum adjustment of BPM allowed for beats to sync if AutoDJ is enabled [BPM] (default: 10).
PioneerDDJRZX.autoDJMaxBpmAdjustment = 10;
// If true, AutoDJ queue is being shuffled after skipping a track (default: false).
// When using a fixed set of tracks without manual intervention, some tracks may be unreachable,
// due to having an unfortunate place in the queue ordering. This solves the issue.
PioneerDDJRZX.autoDJShuffleAfterSkip = false;

// If true, by releasing rotary selector,
// track in preview player jumps forward to "jumpPreviewPosition"
// (default: jumpPreviewEnabled = true, jumpPreviewPosition = 0.3).
PioneerDDJRZX.jumpPreviewEnabled = true;
PioneerDDJRZX.jumpPreviewPosition = 0.3;

// If true, pad press in SAMPLER-PAD-MODE repeatedly causes sampler to play
// loaded track from cue-point, else it causes to play loaded track from the beginning (default: false).
PioneerDDJRZX.samplerCueGotoAndPlay = false;

// If true, PFL / Cue (headphone) is being activated by loading a track into certain deck (default: true).
PioneerDDJRZX.autoPFL = true;


///////////////////////////////////////////////////////////////
//               INIT, SHUTDOWN & GLOBAL HELPER              //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.shiftPressed = false;
PioneerDDJRZX.rotarySelectorChanged = false;
PioneerDDJRZX.blinkAutodjState = false;

// Deck selection: DDJ-RZX always sends on MIDI ch 0/1 (left/right side),
// deck select buttons signal which deck is active per side.
// sideDeck[0] = active deck index for left side (0=Deck1, 2=Deck3)
// sideDeck[1] = active deck index for right side (1=Deck2, 3=Deck4)
PioneerDDJRZX.sideDeck = [0, 1];

PioneerDDJRZX.getActiveDeckGroup = function(channel) {
    var side = channel % 2;
    return '[Channel' + (PioneerDDJRZX.sideDeck[side] + 1) + ']';
};

PioneerDDJRZX.deckSelectButton = function(channel, control, value, status, group) {
    if (value === 0) { return; }
    var side = channel % 2;
    PioneerDDJRZX.sideDeck[side] = channel; // channel 0→Deck1, 1→Deck2, 2→Deck3, 3→Deck4
};
PioneerDDJRZX.panels = [false, false]; // view state of effect and sampler panel
PioneerDDJRZX.shiftPanelSelectPressed = false;

PioneerDDJRZX.syncRate = [0, 0, 0, 0];
PioneerDDJRZX.gridAdjustSelected = [false, false, false, false];
PioneerDDJRZX.gridSlideSelected = [false, false, false, false];
PioneerDDJRZX.needleSearchTouched = [false, false, false, false];
PioneerDDJRZX.chFaderStart = [null, null, null, null];
PioneerDDJRZX.toggledBrake = [false, false, false, false];
PioneerDDJRZX.scratchMode = [true, true, true, true];
PioneerDDJRZX.setUpSpeedSliderRange = [0.08, 0.08, 0.08, 0.08];

// PAD mode storage:
PioneerDDJRZX.padModes = {
    'hotCue': 0,
    'loopRoll': 1,
    'slicer': 2,
    'sampler': 3,
    'group1': 4,
    'beatloop': 5,
    'group3': 6,
    'group4': 7
};
PioneerDDJRZX.activePadMode = [
    PioneerDDJRZX.padModes.hotCue,
    PioneerDDJRZX.padModes.hotCue,
    PioneerDDJRZX.padModes.hotCue,
    PioneerDDJRZX.padModes.hotCue
];
PioneerDDJRZX.samplerVelocityMode = [false, false, false, false];

// FX storage:
PioneerDDJRZX.fxKnobMSBValue = [0, 0];
PioneerDDJRZX.shiftFxKnobMSBValue = [0, 0];

// used for advanced auto dj features:
PioneerDDJRZX.blinkAutodjState = false;
PioneerDDJRZX.autoDJTickTimer = 0;
PioneerDDJRZX.autoDJSyncBPM = false;
PioneerDDJRZX.autoDJSyncKey = false;

// used for PAD parameter selection:
PioneerDDJRZX.selectedSamplerBank = 0;
PioneerDDJRZX.selectedLoopParam = [0, 0, 0, 0];
PioneerDDJRZX.selectedLoopRollParam = [2, 2, 2, 2];
PioneerDDJRZX.selectedLoopIntervals = [
    [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32],
    [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32],
    [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32],
    [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32]
];
PioneerDDJRZX.selectedLooprollIntervals = [
    [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8],
    [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8],
    [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8],
    [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8]
];
PioneerDDJRZX.loopIntervals = [
    [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32],
    [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16],
    [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8],
    [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4]
];
PioneerDDJRZX.selectedSlicerQuantizeParam = [1, 1, 1, 1];
PioneerDDJRZX.selectedSlicerQuantization = [1 / 4, 1 / 4, 1 / 4, 1 / 4];
PioneerDDJRZX.slicerQuantizations = [1 / 8, 1 / 4, 1 / 2, 1];
PioneerDDJRZX.selectedSlicerDomainParam = [0, 0, 0, 0];
PioneerDDJRZX.selectedSlicerDomain = [8, 8, 8, 8];
PioneerDDJRZX.slicerDomains = [8, 16, 32, 64];

// slicer storage:
PioneerDDJRZX.slicerBeatsPassed = [0, 0, 0, 0];
PioneerDDJRZX.slicerPreviousBeatsPassed = [0, 0, 0, 0];
PioneerDDJRZX.slicerActive = [false, false, false, false];
PioneerDDJRZX.slicerAlreadyJumped = [false, false, false, false];
PioneerDDJRZX.slicerButton = [0, 0, 0, 0];
PioneerDDJRZX.slicerModes = {
    'contSlice': 0,
    'loopSlice': 1
};
PioneerDDJRZX.activeSlicerMode = [
    PioneerDDJRZX.slicerModes.contSlice,
    PioneerDDJRZX.slicerModes.contSlice,
    PioneerDDJRZX.slicerModes.contSlice,
    PioneerDDJRZX.slicerModes.contSlice
];


PioneerDDJRZX.init = function(id) {
    print("DDJ-RZX init called - print() works!");
    PioneerDDJRZX.scratchSettings = {
        'alpha': 1.0 / 8,
        'beta': 1.0 / 8 / 32,
        'jogResolution': 2048,
        'vinylSpeed': 33 + 1 / 3,
    };

    PioneerDDJRZX.channelGroups = {
        '[Channel1]': 0x00,
        '[Channel2]': 0x01,
        '[Channel3]': 0x02,
        '[Channel4]': 0x03
    };

    PioneerDDJRZX.samplerGroups = {
        '[Sampler1]': 0x00,
        '[Sampler2]': 0x01,
        '[Sampler3]': 0x02,
        '[Sampler4]': 0x03,
        '[Sampler5]': 0x04,
        '[Sampler6]': 0x05,
        '[Sampler7]': 0x06,
        '[Sampler8]': 0x07
    };

    PioneerDDJRZX.fxUnitGroups = {
        '[EffectRack1_EffectUnit1]': 0x00,
        '[EffectRack1_EffectUnit2]': 0x01,
        '[EffectRack1_EffectUnit3]': 0x02,
        '[EffectRack1_EffectUnit4]': 0x03
    };

    PioneerDDJRZX.fxEffectGroups = {
        '[EffectRack1_EffectUnit1_Effect1]': 0x00,
        '[EffectRack1_EffectUnit1_Effect2]': 0x01,
        '[EffectRack1_EffectUnit1_Effect3]': 0x02,
        '[EffectRack1_EffectUnit2_Effect1]': 0x00,
        '[EffectRack1_EffectUnit2_Effect2]': 0x01,
        '[EffectRack1_EffectUnit2_Effect3]': 0x02
    };

    PioneerDDJRZX.ledGroups = {
        'hotCue': 0x00,
        'loopRoll': 0x10,
        'slicer': 0x20,
        'sampler': 0x30,
        'group1': 0x40,
        'group2': 0x50,
        'group3': 0x60,
        'group4': 0x70
    };

    PioneerDDJRZX.nonPadLeds = {
        'headphoneCue': 0x54,
        'shiftHeadphoneCue': 0x68,
        'cue': 0x0C,
        'shiftCue': 0x48,
        'keyLock': 0x1A,
        'shiftKeyLock': 0x60,
        'play': 0x0B,
        'shiftPlay': 0x47,
        'vinyl': 0x0D,
        'sync': 0x58,
        'shiftSync': 0x5C,
        'autoLoop': 0x14,
        'shiftAutoLoop': 0x50,
        'loopHalve': 0x12,
        'shiftLoopHalve': 0x61,
        'loopDouble': 0x13,
        'shiftLoopDouble': 0x62,
        'loopIn': 0x10,
        'shiftLoopIn': 0x4C,
        'loopOut': 0x11,
        'shiftLoopOut': 0x4D,
        'censor': 0x15,
        'shiftCensor': 0x38,
        'slip': 0x40,
        'shiftSlip': 0x63,
        'gridAdjust': 0x79,
        'shiftGridAdjust': 0x64,
        'gridSlide': 0x0A,
        'shiftGridSlide': 0x65,
        'takeoverPlus': 0x34,
        'takeoverMinus': 0x37,
        'fx1on': 0x47,
        'shiftFx1on': 0x63,
        'fx2on': 0x48,
        'shiftFx2on': 0x64,
        'fx3on': 0x49,
        'shiftFx3on': 0x65,
        'fxTab': 0x4A,
        'shiftFxTab': 0x66,
        'fx1assignDeck1': 0x4C,
        'shiftFx1assignDeck1': 0x70,
        'fx1assignDeck2': 0x4D,
        'shiftFx1assignDeck2': 0x71,
        'fx1assignDeck3': 0x4E,
        'shiftFx1assignDeck3': 0x72,
        'fx1assignDeck4': 0x4F,
        'shiftFx1assignDeck4': 0x73,
        'fx2assignDeck1': 0x50,
        'shiftFx2assignDeck1': 0x54,
        'fx2assignDeck2': 0x51,
        'shiftFx2assignDeck2': 0x55,
        'fx2assignDeck3': 0x52,
        'shiftFx2assignDeck3': 0x56,
        'fx2assignDeck4': 0x53,
        'shiftFx2assignDeck4': 0x57,
        'masterCue': 0x63,
        'shiftMasterCue': 0x62,
        'loadDeck1': 0x46,
        'shiftLoadDeck1': 0x58,
        'loadDeck2': 0x47,
        'shiftLoadDeck2': 0x59,
        'loadDeck3': 0x48,
        'shiftLoadDeck3': 0x60,
        'loadDeck4': 0x49,
        'shiftLoadDeck4': 0x61,
        'hotCueMode': 0x1B,
        'shiftHotCueMode': 0x69,
        'rollMode': 0x1E,
        'shiftRollMode': 0x6B,
        'slicerMode': 0x20,
        'shiftSlicerMode': 0x6D,
        'samplerMode': 0x22,
        'shiftSamplerMode': 0x6F,
        'longPressSamplerMode': 0x41,
        'parameterLeftHotCueMode': 0x24,
        'shiftParameterLeftHotCueMode': 0x01,
        'parameterLeftRollMode': 0x25,
        'shiftParameterLeftRollMode': 0x02,
        'parameterLeftSlicerMode': 0x26,
        'shiftParameterLeftSlicerMode': 0x03,
        'parameterLeftSamplerMode': 0x27,
        'shiftParameterLeftSamplerMode': 0x04,
        'parameterLeftGroup1Mode': 0x28,
        'shiftParameterLeftGroup1Mode': 0x05,
        'parameterLeftGroup2Mode': 0x29,
        'shiftParameterLeftGroup2Mode': 0x06,
        'parameterLeftGroup3Mode': 0x2A,
        'shiftParameterLeftGroup3Mode': 0x07,
        'parameterLeftGroup4Mode': 0x2B,
        'shiftParameterLeftGroup4Mode': 0x08,
        'parameterRightHotCueMode': 0x2C,
        'shiftParameterRightHotCueMode': 0x09,
        'parameterRightRollMode': 0x2D,
        'shiftParameterRightRollMode': 0x7A,
        'parameterRightSlicerMode': 0x2E,
        'shiftParameterRightSlicerMode': 0x7B,
        'parameterRightSamplerMode': 0x2F,
        'shiftParameterRightSamplerMode': 0x7C,
        'parameterRightGroup1Mode': 0x30,
        'shiftParameterRightGroup1Mode': 0x7D,
        'parameterRightGroup2Mode': 0x31,
        'shiftParameterRightGroup2Mode': 0x7E,
        'parameterRightGroup3Mode': 0x32,
        'shiftParameterRightGroup3Mode': 0x7F,
        'parameterRightGroup4Mode': 0x33,
        'shiftParameterRightGroup4Mode': 0x00
    };

    PioneerDDJRZX.illuminationControl = {
        'loadedDeck1': 0x00,
        'loadedDeck2': 0x01,
        'loadedDeck3': 0x02,
        'loadedDeck4': 0x03,
        'unknownDeck1': 0x04,
        'unknownDeck2': 0x05,
        'unknownDeck3': 0x06,
        'unknownDeck4': 0x07,
        'playPauseDeck1': 0x0C,
        'playPauseDeck2': 0x0D,
        'playPauseDeck3': 0x0E,
        'playPauseDeck4': 0x0F,
        'cueDeck1': 0x10,
        'cueDeck2': 0x11,
        'cueDeck3': 0x12,
        'cueDeck4': 0x13,
        'djAppConnect': 0x09
    };

    PioneerDDJRZX.wheelLedCircle = {
        'minVal': 0x00,
        'maxVal': 0x48
    };

    PioneerDDJRZX.valueVuMeter = {
        '[Channel1]_current': 0,
        '[Channel2]_current': 0,
        '[Channel3]_current': 0,
        '[Channel4]_current': 0,
        '[Channel1]_enabled': 1,
        '[Channel2]_enabled': 1,
        '[Channel3]_enabled': 1,
        '[Channel4]_enabled': 1
    };

    // set 32 Samplers as default:
    if (engine.getValue("[App]", "num_samplers") < 32) {
        engine.setValue("[App]", "num_samplers", 32);
    }

    // activate vu meter timer for Auto DJ twinkle:
    if (PioneerDDJRZX.twinkleVumeterAutodjOn) {
        PioneerDDJRZX.vuMeterTimer = engine.beginTimer(200, PioneerDDJRZX.vuMeterTwinkle);
    }

    // bind controls and init deck parameters:
    PioneerDDJRZX.bindNonDeckControlConnections(true);
    for (var index in PioneerDDJRZX.channelGroups) {
        if (PioneerDDJRZX.channelGroups.hasOwnProperty(index)) {
            PioneerDDJRZX.initDeck(index);
        }
    }

    // init effects section:
    PioneerDDJRZX.effectUnit = [];
    PioneerDDJRZX.effectUnit[1] = new components.EffectUnit([1, 3]);
    PioneerDDJRZX.effectUnit[2] = new components.EffectUnit([2, 4]);
    PioneerDDJRZX.effectUnit[1].enableButtons[1].midi = [0x94, PioneerDDJRZX.nonPadLeds.fx1on];
    PioneerDDJRZX.effectUnit[1].enableButtons[2].midi = [0x94, PioneerDDJRZX.nonPadLeds.fx2on];
    PioneerDDJRZX.effectUnit[1].enableButtons[3].midi = [0x94, PioneerDDJRZX.nonPadLeds.fx3on];
    PioneerDDJRZX.effectUnit[1].effectFocusButton.midi = [0x94, PioneerDDJRZX.nonPadLeds.fxTab];
    PioneerDDJRZX.effectUnit[1].dryWetKnob.input = function(channel, control, value, status, group) {
        this.inSetParameter(this.inGetParameter() + PioneerDDJRZX.getRotaryDelta(value) / 30);
    };
    PioneerDDJRZX.effectUnit[1].init();
    PioneerDDJRZX.effectUnit[2].enableButtons[1].midi = [0x95, PioneerDDJRZX.nonPadLeds.fx1on];
    PioneerDDJRZX.effectUnit[2].enableButtons[2].midi = [0x95, PioneerDDJRZX.nonPadLeds.fx2on];
    PioneerDDJRZX.effectUnit[2].enableButtons[3].midi = [0x95, PioneerDDJRZX.nonPadLeds.fx3on];
    PioneerDDJRZX.effectUnit[2].effectFocusButton.midi = [0x95, PioneerDDJRZX.nonPadLeds.fxTab];
    PioneerDDJRZX.effectUnit[2].dryWetKnob.input = function(channel, control, value, status, group) {
        this.inSetParameter(this.inGetParameter() + PioneerDDJRZX.getRotaryDelta(value) / 30);
    };
    PioneerDDJRZX.effectUnit[2].init();

    // Send full illumination init after all bindings are in place
    PioneerDDJRZX.ledInit();
};

PioneerDDJRZX.shutdown = function() {
    if (PioneerDDJRZX.vuMeterTimer) {
        engine.stopTimer(PioneerDDJRZX.vuMeterTimer);
    }
    PioneerDDJRZX.resetDeck("[Channel1]");
    PioneerDDJRZX.resetDeck("[Channel2]");
    PioneerDDJRZX.resetDeck("[Channel3]");
    PioneerDDJRZX.resetDeck("[Channel4]");

    PioneerDDJRZX.resetNonDeckLeds();
};


///////////////////////////////////////////////////////////////
//                      VU - METER                           //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.vuMeterTwinkle = function() {
    if (engine.getValue("[AutoDJ]", "enabled")) {
        PioneerDDJRZX.blinkAutodjState = !PioneerDDJRZX.blinkAutodjState;
    }
    PioneerDDJRZX.valueVuMeter["[Channel1]_enabled"] = PioneerDDJRZX.blinkAutodjState ? 1 : 0;
    PioneerDDJRZX.valueVuMeter["[Channel3]_enabled"] = PioneerDDJRZX.blinkAutodjState ? 1 : 0;
    PioneerDDJRZX.valueVuMeter["[Channel2]_enabled"] = PioneerDDJRZX.blinkAutodjState ? 1 : 0;
    PioneerDDJRZX.valueVuMeter["[Channel4]_enabled"] = PioneerDDJRZX.blinkAutodjState ? 1 : 0;
};

// Note: DDJ-RZX jog wheel ring LEDs and VU meters are hardware-controlled.
// The MIDI-OUT spec (page 9) has no CC messages for ring position — only
// illumination on/off (Note on 0x9B). No software LED rotation is possible.


///////////////////////////////////////////////////////////////
//                        AUTO DJ                            //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.autodjToggle = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl("[AutoDJ]", "enabled");
    }
};

PioneerDDJRZX.autoDJToggleSyncBPM = function(channel, control, value, status, group) {
    if (value) {
        PioneerDDJRZX.autoDJSyncBPM = !PioneerDDJRZX.autoDJSyncBPM;
        PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck1, PioneerDDJRZX.autoDJSyncBPM);
    }
};

PioneerDDJRZX.autoDJToggleSyncKey = function(channel, control, value, status, group) {
    if (value) {
        PioneerDDJRZX.autoDJSyncKey = !PioneerDDJRZX.autoDJSyncKey;
        PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck2, PioneerDDJRZX.autoDJSyncKey);
    }
};

PioneerDDJRZX.autoDJTimer = function(value, group, control) {
    if (value) {
        PioneerDDJRZX.autoDJTickTimer = engine.beginTimer(PioneerDDJRZX.autoDJTickInterval, PioneerDDJRZX.autoDJControl);
    } else if (PioneerDDJRZX.autoDJTickTimer) {
        engine.stopTimer(PioneerDDJRZX.autoDJTickTimer);
        PioneerDDJRZX.autoDJTickTimer = 0;
    }
    engine.setValue("[Channel1]", "quantize", value);
    engine.setValue("[Channel2]", "quantize", value);
};

PioneerDDJRZX.autoDJControl = function() {
    var prev = 1,
        next = 2,
        prevPos = 0,
        nextPos = 0,
        nextPlaying = 0,
        prevBpm = 0,
        nextBpm = 0,
        diffBpm = 0,
        diffBpmDouble = 0,
        keyOkay = 0,
        prevKey = 0,
        nextKey = 0,
        diffKey = 0;

    if (!PioneerDDJRZX.autoDJSyncBPM && !PioneerDDJRZX.autoDJSyncKey) {
        return;
    }

    prevPos = engine.getValue("[Channel" + prev + "]", "playposition");
    nextPos = engine.getValue("[Channel" + next + "]", "playposition");
    if (prevPos < nextPos) {
        var tmp = nextPos;
        nextPos = prevPos;
        prevPos = tmp;
        next = 1;
        prev = 2;
    }
    nextPlaying = engine.getValue("[Channel" + next + "]", "play_indicator");
    prevBpm = engine.getValue("[Channel" + prev + "]", "visual_bpm");
    nextBpm = engine.getValue("[Channel" + next + "]", "visual_bpm");
    diffBpm = Math.abs(nextBpm - prevBpm);
    // diffBpm, with bpm of ONE track doubled
    // Note: Where appropriate, Mixxx will automatically match two beats of one.
    if (nextBpm < prevBpm) {
        diffBpmDouble = Math.abs(2 * nextBpm - prevBpm);
    } else {
        diffBpmDouble = Math.abs(2 * prevBpm - nextBpm);
    }

    // Next track is playing --> Fade in progress
    // Note: play_indicator is falsely true, when analysis is needed and similar
    if (nextPlaying && (nextPos > 0.0)) {
        // Bpm synced up --> disable sync before new track loaded
        // Note: Sometimes, Mixxx does not sync close enough for === operator
        if (diffBpm < 0.01 || diffBpmDouble < 0.01) {
            engine.setValue("[Channel" + prev + "]", "sync_mode", 0.0);
            engine.setValue("[Channel" + next + "]", "sync_mode", 0.0);
        } else { // Synchronize
            engine.setValue("[Channel" + prev + "]", "sync_mode", 1.0); // First,  set prev to follower
            engine.setValue("[Channel" + next + "]", "sync_mode", 2.0); // Second, set next to master
        }

        // Only adjust key when approaching the middle of fading
        if (PioneerDDJRZX.autoDJSyncKey) {
            var diffFader = Math.abs(engine.getValue("[Master]", "crossfader") - 0.5);
            if (diffFader < 0.25) {
                nextKey = engine.getValue("[Channel" + next + "]", "key");
                engine.setValue("[Channel" + prev + "]", "key", nextKey);
            }
        }
    } else if (!nextPlaying) { // Next track is stopped --> Disable sync and refine track selection
        // First, disable sync; should be off by now, anyway
        engine.setValue("[Channel" + prev + "]", "sync_mode", 0.0); // Disable sync, else loading new track...
        engine.setValue("[Channel" + next + "]", "sync_mode", 0.0); // ...or skipping tracks would break things.

        // Second, refine track selection
        var skip = 0;
        if (diffBpm > PioneerDDJRZX.autoDJMaxBpmAdjustment && diffBpmDouble > PioneerDDJRZX.autoDJMaxBpmAdjustment) {
            skip = 1;
        }
        // Mixing in key:
        //     1  the difference is exactly 12 (harmonic switch of tonality), or
        //     2  both are of same tonality, and
        //     2a difference is 0, 1 or 2 (difference of up to two semitones: equal key or energy mix)
        //     2b difference corresponds to neighbours in the circle of fifth (harmonic neighbours)
        //   If neither is the case, we skip.
        if (PioneerDDJRZX.autoDJSyncKey) {
            keyOkay = 0;
            prevKey = engine.getValue("[Channel" + prev + "]", "visual_key");
            nextKey = engine.getValue("[Channel" + next + "]", "visual_key");
            diffKey = Math.abs(prevKey - nextKey);
            if (diffKey === 12.0) {
                keyOkay = 1; // Switch of tonality
            }
            // Both of same tonality:
            if ((prevKey < 13 && nextKey < 13) || (prevKey > 12 && nextKey > 12)) {
                if (diffKey < 3.0) {
                    keyOkay = 1; // Equal or Energy
                }
                if (diffKey === 5.0 || diffKey === 7.0) {
                    keyOkay = 1; // Neighbours in Circle of Fifth
                }
            }
            if (!keyOkay) {
                skip = 1;
            }
        }

        if (skip) {
            engine.setValue("[AutoDJ]", "skip_next", 1.0);
            engine.setValue("[AutoDJ]", "skip_next", 0.0); // Have to reset manually
            if (PioneerDDJRZX.autoDJShuffleAfterSkip) {
                engine.setValue("[AutoDJ]", "shuffle_playlist", 1.0);
                engine.setValue("[AutoDJ]", "shuffle_playlist", 0.0); // Have to reset manually
            }
        }
    }
};


///////////////////////////////////////////////////////////////
//                      CONTROL BINDING                      //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.bindDeckControlConnections = function(channelGroup, bind) {
    var i,
        index,
        deck = PioneerDDJRZX.channelGroups[channelGroup],
        controlsToFunctions = {
            'play_indicator': 'PioneerDDJRZX.playLed',
            'cue_indicator': 'PioneerDDJRZX.cueLed',
            'pfl': 'PioneerDDJRZX.headphoneCueLed',
            'bpm_tap': 'PioneerDDJRZX.shiftHeadphoneCueLed',
            'VuMeter': 'PioneerDDJRZX.VuMeterLeds',
            'keylock': 'PioneerDDJRZX.keyLockLed',
            'slip_enabled': 'PioneerDDJRZX.slipLed',
            'quantize': 'PioneerDDJRZX.quantizeLed',
            'loop_in': 'PioneerDDJRZX.loopInLed',
            'loop_out': 'PioneerDDJRZX.loopOutLed',
            'loop_enabled': 'PioneerDDJRZX.autoLoopLed',
            'loop_double': 'PioneerDDJRZX.loopDoubleLed',
            'loop_halve': 'PioneerDDJRZX.loopHalveLed',
            'reloop_andstop': 'PioneerDDJRZX.shiftLoopInLed',
            'beatjump_1_forward': 'PioneerDDJRZX.loopShiftFWLed',
            'beatjump_1_backward': 'PioneerDDJRZX.loopShiftBKWLed',
            'beatjump_forward': 'PioneerDDJRZX.hotCueParameterRightLed',
            'beatjump_backward': 'PioneerDDJRZX.hotCueParameterLeftLed',
            'reverse': 'PioneerDDJRZX.reverseLed',
            'duration': 'PioneerDDJRZX.loadLed',
            'sync_enabled': 'PioneerDDJRZX.syncLed',
            'beat_active': 'PioneerDDJRZX.slicerBeatActive'
        };

    for (i = 1; i <= 8; i++) {
        controlsToFunctions["hotcue_" + i + "_enabled"] = "PioneerDDJRZX.hotCueLeds";
    }

    for (index in PioneerDDJRZX.selectedLoopIntervals[deck]) {
        if (PioneerDDJRZX.selectedLoopIntervals[deck].hasOwnProperty(index)) {
            controlsToFunctions["beatloop_" + PioneerDDJRZX.selectedLoopIntervals[deck][index] + "_enabled"] = "PioneerDDJRZX.beatloopLeds";
        }
    }

    for (index in PioneerDDJRZX.selectedLooprollIntervals[deck]) {
        if (PioneerDDJRZX.selectedLooprollIntervals[deck].hasOwnProperty(index)) {
            controlsToFunctions["beatlooproll_" + PioneerDDJRZX.selectedLooprollIntervals[deck][index] + "_activate"] = "PioneerDDJRZX.beatlooprollLeds";
        }
    }

    script.bindConnections(channelGroup, controlsToFunctions, !bind);

    for (index in PioneerDDJRZX.fxUnitGroups) {
        if (PioneerDDJRZX.fxUnitGroups.hasOwnProperty(index)) {
            if (PioneerDDJRZX.fxUnitGroups[index] < 2) {
                engine.connectControl(index, "group_" + channelGroup + "_enable", "PioneerDDJRZX.fxAssignLeds", !bind);
                if (bind) {
                    engine.trigger(index, "group_" + channelGroup + "_enable");
                }
            }
        }
    }
};

PioneerDDJRZX.bindNonDeckControlConnections = function(bind) {
    var index;

    for (index in PioneerDDJRZX.samplerGroups) {
        if (PioneerDDJRZX.samplerGroups.hasOwnProperty(index)) {
            engine.connectControl(index, "duration", "PioneerDDJRZX.samplerLeds", !bind);
            engine.connectControl(index, "play", "PioneerDDJRZX.samplerLedsPlay", !bind);
            if (bind) {
                engine.trigger(index, "duration");
            }
        }
    }

    engine.connectControl("[Master]", "headSplit", "PioneerDDJRZX.shiftMasterCueLed", !bind);
    if (bind) {
        engine.trigger("[Master]", "headSplit");
    }

    engine.connectControl("[AutoDJ]", "enabled", "PioneerDDJRZX.autoDJTimer", !bind);
};


///////////////////////////////////////////////////////////////
//                     DECK INIT / RESET                     //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.initDeck = function(group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    // save set up speed slider range from the Mixxx settings:
    PioneerDDJRZX.setUpSpeedSliderRange[deck] = engine.getValue(group, "rateRange");

    PioneerDDJRZX.bindDeckControlConnections(group, true);

    PioneerDDJRZX.updateParameterStatusLeds(
        group,
        PioneerDDJRZX.selectedLoopRollParam[deck],
        PioneerDDJRZX.selectedLoopParam[deck],
        PioneerDDJRZX.selectedSamplerBank,
        PioneerDDJRZX.selectedSlicerQuantizeParam[deck],
        PioneerDDJRZX.selectedSlicerDomainParam[deck]
    );
    PioneerDDJRZX.triggerVinylLed(deck);

    PioneerDDJRZX.illuminateFunctionControl(
        PioneerDDJRZX.illuminationControl["loadedDeck" + (deck + 1)],
        false
    );
    PioneerDDJRZX.illuminateFunctionControl(
        PioneerDDJRZX.illuminationControl["unknownDeck" + (deck + 1)],
        false
    );
    PioneerDDJRZX.wheelLedControl(group, PioneerDDJRZX.wheelLedCircle.minVal);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.hotCueMode, true); // set HOT CUE Pad-Mode
};

PioneerDDJRZX.resetDeck = function(group) {
    PioneerDDJRZX.bindDeckControlConnections(group, false);

    PioneerDDJRZX.VuMeterLeds(0x00, group, 0x00); // reset VU meter Leds
    PioneerDDJRZX.wheelLedControl(group, PioneerDDJRZX.wheelLedCircle.minVal); // reset jogwheel Leds
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.hotCueMode, true); // reset HOT CUE Pad-Mode
    // pad Leds:
    for (var i = 0; i < 8; i++) {
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.hotCue, i, false, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.loopRoll, i, false, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.slicer, i, false, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.sampler, i, false, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.group2, i, false, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.hotCue, i, true, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.loopRoll, i, true, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.slicer, i, true, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.sampler, i, true, false);
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.group2, i, true, false);
    }
    // non pad Leds:
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.headphoneCue, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftHeadphoneCue, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.cue, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftCue, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.keyLock, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftKeyLock, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.play, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftPlay, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.vinyl, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.sync, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftSync, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.autoLoop, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftAutoLoop, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopHalve, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopHalve, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopIn, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopIn, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopOut, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopOut, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.censor, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftCensor, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.slip, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftSlip, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.gridAdjust, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftGridAdjust, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.gridSlide, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftGridSlide, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftRollMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftSlicerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterLeftSlicerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftSamplerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftGroup2Mode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightRollMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightSlicerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterRightSlicerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightSamplerMode, false);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightGroup2Mode, false);
};


///////////////////////////////////////////////////////////////
//            HIGH RESOLUTION MIDI INPUT HANDLERS            //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.highResMSB = {
    '[Channel1]': {},
    '[Channel2]': {},
    '[Channel3]': {},
    '[Channel4]': {},
    '[Master]': {},
    '[Samplers]': {}
};

PioneerDDJRZX.tempoSliderMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].tempoSlider = value;
};

PioneerDDJRZX.tempoSliderLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].tempoSlider << 7) + value,
        sliderRate = 1 - (fullValue / 0x3FFF),
        deck = PioneerDDJRZX.channelGroups[group];

    engine.setParameter(group, "rate", sliderRate);

    if (PioneerDDJRZX.syncRate[deck] !== 0) {
        if (PioneerDDJRZX.syncRate[deck] !== engine.getValue(group, "rate")) {
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, 0);
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, 0);
            PioneerDDJRZX.syncRate[deck] = 0;
        }
    }
};

PioneerDDJRZX.gainKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].gainKnob = value;
};

PioneerDDJRZX.gainKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].gainKnob << 7) + value;
    engine.setParameter(group, "pregain", fullValue / 0x3FFF);
};

PioneerDDJRZX.filterHighKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].filterHigh = value;
};

PioneerDDJRZX.filterHighKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].filterHigh << 7) + value;
    engine.setParameter("[EqualizerRack1_" + group + "_Effect1]", "parameter3", fullValue / 0x3FFF);
};

PioneerDDJRZX.filterMidKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].filterMid = value;
};

PioneerDDJRZX.filterMidKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].filterMid << 7) + value;
    engine.setParameter("[EqualizerRack1_" + group + "_Effect1]", "parameter2", fullValue / 0x3FFF);
};

PioneerDDJRZX.filterLowKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].filterLow = value;
};

PioneerDDJRZX.filterLowKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].filterLow << 7) + value;
    engine.setParameter("[EqualizerRack1_" + group + "_Effect1]", "parameter1", fullValue / 0x3FFF);
};

PioneerDDJRZX.deckFaderMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].deckFader = value;
};

PioneerDDJRZX.deckFaderLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].deckFader << 7) + value;

    if (PioneerDDJRZX.shiftPressed &&
        engine.getValue(group, "volume") === 0 &&
        fullValue !== 0 &&
        engine.getValue(group, "play") === 0
    ) {
        PioneerDDJRZX.chFaderStart[channel] = engine.getValue(group, "playposition");
        engine.setValue(group, "play", 1);
    } else if (
        PioneerDDJRZX.shiftPressed &&
        engine.getValue(group, "volume") !== 0 &&
        fullValue === 0 &&
        engine.getValue(group, "play") === 1 &&
        PioneerDDJRZX.chFaderStart[channel] !== null
    ) {
        engine.setValue(group, "play", 0);
        engine.setValue(group, "playposition", PioneerDDJRZX.chFaderStart[channel]);
        PioneerDDJRZX.chFaderStart[channel] = null;
    }
    engine.setParameter(group, "volume", fullValue / 0x3FFF);
};

PioneerDDJRZX.filterKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].filterKnob = value;
};

PioneerDDJRZX.filterKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].filterKnob << 7) + value;
    engine.setParameter("[QuickEffectRack1_" + group + "]", "super1", fullValue / 0x3FFF);
};

PioneerDDJRZX.crossfaderCurveKnobMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].crossfaderCurveKnob = value;
};

PioneerDDJRZX.crossfaderCurveKnobLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].crossfaderCurveKnob << 7) + value;
    script.crossfaderCurve(fullValue, 0x00, 0x3FFF);
};

PioneerDDJRZX.samplerVolumeFaderMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].samplerVolumeFader = value;
};

PioneerDDJRZX.samplerVolumeFaderLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].samplerVolumeFader << 7) + value;
    for (var i = 1; i <= 32; i++) {
        engine.setParameter("[Sampler" + i + "]", "volume", fullValue / 0x3FFF);
    }
};

PioneerDDJRZX.crossFaderMSB = function(channel, control, value, status, group) {
    PioneerDDJRZX.highResMSB[group].crossFader = value;
};

PioneerDDJRZX.crossFaderLSB = function(channel, control, value, status, group) {
    var fullValue = (PioneerDDJRZX.highResMSB[group].crossFader << 7) + value;
    engine.setParameter(group, "crossfader", fullValue / 0x3FFF);
};


///////////////////////////////////////////////////////////////
//           SINGLE MESSAGE MIDI INPUT HANDLERS              //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.shiftButton = function(channel, control, value, status, group) {
    var index = 0;
    PioneerDDJRZX.shiftPressed = (value === 0x7F);
    for (index in PioneerDDJRZX.chFaderStart) {
        if (typeof index === "number") {
            PioneerDDJRZX.chFaderStart[index] = null;
        }
    }
    if (value) {
        PioneerDDJRZX.effectUnit[1].shift();
        PioneerDDJRZX.effectUnit[2].shift();
    }
    if (!value) {
        PioneerDDJRZX.effectUnit[1].unshift();
        PioneerDDJRZX.effectUnit[2].unshift();
    }
};

PioneerDDJRZX.playButton = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group],
        playing = engine.getValue(group, "play");

    if (value) {
        if (playing) {
            script.brake(channel, control, value, status, group);
            PioneerDDJRZX.toggledBrake[deck] = true;
        } else {
            script.toggleControl(group, "play");
        }
    } else {
        if (PioneerDDJRZX.toggledBrake[deck]) {
            script.brake(channel, control, value, status, group);
            script.toggleControl(group, "play");
            PioneerDDJRZX.toggledBrake[deck] = false;
        }
    }
};

PioneerDDJRZX.playStutterButton = function(channel, control, value, status, group) {
    engine.setValue(group, "play_stutter", value ? 1 : 0);
};

PioneerDDJRZX.cueButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "cue_default");
};

PioneerDDJRZX.jumpToBeginningButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "start_stop");
};

PioneerDDJRZX.headphoneCueButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "pfl");
    }
};

PioneerDDJRZX.headphoneShiftCueButton = function(channel, control, value, status, group) {
    if (value) {
        bpm.tapButton(PioneerDDJRZX.channelGroups[group] + 1);
    }
};

PioneerDDJRZX.headphoneSplitCueButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "headSplit");
    }
};

PioneerDDJRZX.toggleHotCueMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    //HOTCUE
    if (value) {
        PioneerDDJRZX.activePadMode[deck] = PioneerDDJRZX.padModes.hotCue;
        PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.contSlice;
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.hotCueMode, value);
    }
};

PioneerDDJRZX.toggleBeatloopRollMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    //ROLL
    if (value) {
        PioneerDDJRZX.activePadMode[deck] = PioneerDDJRZX.padModes.loopRoll;
        PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.contSlice;
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.rollMode, value);
    }
};

PioneerDDJRZX.toggleSlicerMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    //SLICER
    if (value) {
        if (PioneerDDJRZX.activePadMode[deck] === PioneerDDJRZX.padModes.slicer &&
            PioneerDDJRZX.activeSlicerMode[deck] === PioneerDDJRZX.slicerModes.contSlice) {
            PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.loopSlice;
            engine.setValue(group, "slip_enabled", true);
        } else {
            PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.contSlice;
            engine.setValue(group, "slip_enabled", false);
        }
        PioneerDDJRZX.activePadMode[deck] = PioneerDDJRZX.padModes.slicer;
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.slicerMode, value);
    }
};

PioneerDDJRZX.toggleSamplerMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    //SAMPLER
    if (value) {
        PioneerDDJRZX.activePadMode[deck] = PioneerDDJRZX.padModes.sampler;
        PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.contSlice;
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.samplerMode, value);
    }
};

PioneerDDJRZX.toggleSamplerVelocityMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group],
        index = 0;
    PioneerDDJRZX.samplerVelocityMode[deck] = value ? true : false;
    if (value) {
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.longPressSamplerMode, value);
        for (index = 1; index <= 32; index++) {
            engine.setParameter("[Sampler" + index + "]", "volume", 0);
        }
    } else {
        for (index = 1; index <= 32; index++) {
            engine.setParameter("[Sampler" + index + "]", "volume", 1);
        }
    }
};

PioneerDDJRZX.toggleBeatloopMode = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    //GROUP2
    if (value) {
        PioneerDDJRZX.activePadMode[deck] = PioneerDDJRZX.padModes.beatloop;
        PioneerDDJRZX.activeSlicerMode[deck] = PioneerDDJRZX.slicerModes.contSlice;
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftRollMode, value);
    }
};

PioneerDDJRZX.hotCueButtons = function(channel, control, value, status, group) {
    var index = control + 1;
    script.toggleControl(group, "hotcue_" + index + "_activate");
};

PioneerDDJRZX.clearHotCueButtons = function(channel, control, value, status, group) {
    var index = control - 0x08 + 1;
    script.toggleControl(group, "hotcue_" + index + "_clear");
};

PioneerDDJRZX.beatloopButtons = function(channel, control, value, status, group) {
    var index = control - 0x50,
        deck = PioneerDDJRZX.channelGroups[group];
    script.toggleControl(
        group,
        "beatloop_" + PioneerDDJRZX.selectedLoopIntervals[deck][index] + "_toggle"
    );
};

PioneerDDJRZX.slicerButtons = function(channel, control, value, status, group) {
    var index = control - 0x20,
        deck = PioneerDDJRZX.channelGroups[group],
        domain = PioneerDDJRZX.selectedSlicerDomain[deck],
        beatsToJump = 0;

    if (PioneerDDJRZX.activeSlicerMode[deck] === PioneerDDJRZX.slicerModes.loopSlice) {
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.slicer, index, false, !value);
    } else {
        PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.slicer, index, false, value);
    }
    PioneerDDJRZX.slicerActive[deck] = value ? true : false;
    PioneerDDJRZX.slicerButton[deck] = index;

    if (value) {
        beatsToJump = (PioneerDDJRZX.slicerButton[deck] * (domain / 8)) - ((PioneerDDJRZX.slicerBeatsPassed[deck] % domain) + 1);
        if (PioneerDDJRZX.slicerButton[deck] === 0 && beatsToJump === -domain) {
            beatsToJump = 0;
        }
        if (PioneerDDJRZX.slicerBeatsPassed[deck] >= Math.abs(beatsToJump) &&
            PioneerDDJRZX.slicerPreviousBeatsPassed[deck] !== PioneerDDJRZX.slicerBeatsPassed[deck]) {
            PioneerDDJRZX.slicerPreviousBeatsPassed[deck] = PioneerDDJRZX.slicerBeatsPassed[deck];
            if (Math.abs(beatsToJump) > 0) {
                engine.setValue(group, "beatjump", beatsToJump);
            }
        }
    }

    if (PioneerDDJRZX.activeSlicerMode[deck] === PioneerDDJRZX.slicerModes.contSlice) {
        engine.setValue(group, "slip_enabled", value);
        engine.setValue(group, "beatloop_size", PioneerDDJRZX.selectedSlicerQuantization[deck]);
        engine.setValue(group, "beatloop_activate", value);
    }
};

PioneerDDJRZX.beatloopRollButtons = function(channel, control, value, status, group) {
    var index = control - 0x10,
        deck = PioneerDDJRZX.channelGroups[group];
    script.toggleControl(
        group,
        "beatlooproll_" + PioneerDDJRZX.selectedLooprollIntervals[deck][index] + "_activate"
    );
};

PioneerDDJRZX.samplerButtons = function(channel, control, value, status, group) {
    var index = control - 0x30 + 1,
        deckOffset = PioneerDDJRZX.selectedSamplerBank * 8,
        sampleDeck = "[Sampler" + (index + deckOffset) + "]",
        playMode = PioneerDDJRZX.samplerCueGotoAndPlay ? "cue_gotoandplay" : "start_play";

    if (engine.getValue(sampleDeck, "track_loaded")) {
        engine.setValue(sampleDeck, playMode, value ? 1 : 0);
    } else {
        engine.setValue(sampleDeck, "LoadSelectedTrack", value ? 1 : 0);
    }
};

PioneerDDJRZX.stopSamplerButtons = function(channel, control, value, status, group) {
    var index = control - 0x38 + 1,
        deckOffset = PioneerDDJRZX.selectedSamplerBank * 8,
        sampleDeck = "[Sampler" + (index + deckOffset) + "]",
        trackLoaded = engine.getValue(sampleDeck, "track_loaded"),
        playing = engine.getValue(sampleDeck, "play");

    if (trackLoaded && playing) {
        script.toggleControl(sampleDeck, "stop");
    } else if (trackLoaded && !playing && value) {
        script.toggleControl(sampleDeck, "eject");
    }
};

PioneerDDJRZX.samplerVelocityVolume = function(channel, control, value, status, group) {
    var index = control - 0x30 + 1,
        deck = PioneerDDJRZX.channelGroups[group],
        deckOffset = PioneerDDJRZX.selectedSamplerBank * 8,
        sampleDeck = "[Sampler" + (index + deckOffset) + "]",
        vol = value / 0x7F;

    if (PioneerDDJRZX.samplerVelocityMode[deck]) {
        engine.setParameter(sampleDeck, "volume", vol);
    }
};

PioneerDDJRZX.changeParameters = function(group, ctrl, value) {
    var deck = PioneerDDJRZX.channelGroups[group],
        index,
        offset = 0,
        samplerIndex = 0,
        beatjumpSize = 0;

    //Hot Cue Mode:
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftHotCueMode) {
        engine.setValue(group, "beatjump_backward", value);
    }
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterRightHotCueMode) {
        engine.setValue(group, "beatjump_forward", value);
    }
    if (ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterLeftHotCueMode) {
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterLeftHotCueMode, value);
        if (value) {
            beatjumpSize = engine.getValue(group, "beatjump_size");
            engine.setValue(group, "beatjump_size", beatjumpSize / 2);
        }
    }
    if (ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterRightHotCueMode) {
        PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterRightHotCueMode, value);
        if (value) {
            beatjumpSize = engine.getValue(group, "beatjump_size");
            engine.setValue(group, "beatjump_size", beatjumpSize * 2);
        }
    }

    // ignore other cases if button is released:
    if (!value) {
        return;
    }

    //Roll Mode:
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftRollMode || ctrl === PioneerDDJRZX.nonPadLeds.parameterRightRollMode) {
        // unbind previous connected controls:
        for (index in PioneerDDJRZX.selectedLooprollIntervals[deck]) {
            if (PioneerDDJRZX.selectedLooprollIntervals[deck].hasOwnProperty(index)) {
                engine.connectControl(
                    group,
                    "beatlooproll_" + PioneerDDJRZX.selectedLooprollIntervals[deck][index] + "_activate",
                    "PioneerDDJRZX.beatlooprollLeds",
                    true
                );
            }
        }
        // change parameter set:
        if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftRollMode && PioneerDDJRZX.selectedLoopRollParam[deck] > 0) {
            PioneerDDJRZX.selectedLoopRollParam[deck] -= 1;
        } else if (ctrl === PioneerDDJRZX.nonPadLeds.parameterRightRollMode && PioneerDDJRZX.selectedLoopRollParam[deck] < 3) {
            PioneerDDJRZX.selectedLoopRollParam[deck] += 1;
        }
        PioneerDDJRZX.selectedLooprollIntervals[deck] = PioneerDDJRZX.loopIntervals[PioneerDDJRZX.selectedLoopRollParam[deck]];
        // bind new controls:
        for (index in PioneerDDJRZX.selectedLooprollIntervals[deck]) {
            if (PioneerDDJRZX.selectedLooprollIntervals[deck].hasOwnProperty(index)) {
                engine.connectControl(
                    group,
                    "beatlooproll_" + PioneerDDJRZX.selectedLooprollIntervals[deck][index] + "_activate",
                    "PioneerDDJRZX.beatlooprollLeds",
                    false
                );
            }
        }
    }

    //Group2 (Beatloop) Mode:
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftGroup2Mode || ctrl === PioneerDDJRZX.nonPadLeds.parameterRightGroup2Mode) {
        // unbind previous connected controls:
        for (index in PioneerDDJRZX.selectedLoopIntervals[deck]) {
            if (PioneerDDJRZX.selectedLoopIntervals[deck].hasOwnProperty(index)) {
                engine.connectControl(
                    group,
                    "beatloop_" + PioneerDDJRZX.selectedLoopIntervals[deck][index] + "_enabled",
                    "PioneerDDJRZX.beatloopLeds",
                    true
                );
            }
        }
        // change parameter set:
        if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftGroup2Mode && PioneerDDJRZX.selectedLoopParam[deck] > 0) {
            PioneerDDJRZX.selectedLoopParam[deck] -= 1;
        } else if (ctrl === PioneerDDJRZX.nonPadLeds.parameterRightGroup2Mode && PioneerDDJRZX.selectedLoopParam[deck] < 3) {
            PioneerDDJRZX.selectedLoopParam[deck] += 1;
        }
        PioneerDDJRZX.selectedLoopIntervals[deck] = PioneerDDJRZX.loopIntervals[PioneerDDJRZX.selectedLoopParam[deck]];
        // bind new controls:
        for (index in PioneerDDJRZX.selectedLoopIntervals[deck]) {
            if (PioneerDDJRZX.selectedLoopIntervals[deck].hasOwnProperty(index)) {
                engine.connectControl(
                    group,
                    "beatloop_" + PioneerDDJRZX.selectedLoopIntervals[deck][index] + "_enabled",
                    "PioneerDDJRZX.beatloopLeds",
                    false
                );
            }
        }
    }

    //Sampler Mode:
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftSamplerMode || ctrl === PioneerDDJRZX.nonPadLeds.parameterRightSamplerMode) {
        // unbind previous connected controls:
        for (index in PioneerDDJRZX.samplerGroups) {
            if (PioneerDDJRZX.samplerGroups.hasOwnProperty(index)) {
                offset = PioneerDDJRZX.selectedSamplerBank * 8;
                samplerIndex = (PioneerDDJRZX.samplerGroups[index] + 1) + offset;
                engine.connectControl(
                    "[Sampler" + samplerIndex + "]",
                    "duration",
                    "PioneerDDJRZX.samplerLeds",
                    true
                );
                engine.connectControl(
                    "[Sampler" + samplerIndex + "]",
                    "play",
                    "PioneerDDJRZX.samplerLedsPlay",
                    true
                );
            }
        }
        // change sampler bank:
        if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftSamplerMode && PioneerDDJRZX.selectedSamplerBank > 0) {
            PioneerDDJRZX.selectedSamplerBank -= 1;
        } else if (ctrl === PioneerDDJRZX.nonPadLeds.parameterRightSamplerMode && PioneerDDJRZX.selectedSamplerBank < 3) {
            PioneerDDJRZX.selectedSamplerBank += 1;
        }
        // bind new controls:
        for (index in PioneerDDJRZX.samplerGroups) {
            if (PioneerDDJRZX.samplerGroups.hasOwnProperty(index)) {
                offset = PioneerDDJRZX.selectedSamplerBank * 8;
                samplerIndex = (PioneerDDJRZX.samplerGroups[index] + 1) + offset;
                engine.connectControl(
                    "[Sampler" + samplerIndex + "]",
                    "duration",
                    "PioneerDDJRZX.samplerLeds",
                    false
                );
                engine.connectControl(
                    "[Sampler" + samplerIndex + "]",
                    "play",
                    "PioneerDDJRZX.samplerLedsPlay",
                    false
                );
                engine.trigger("[Sampler" + samplerIndex + "]", "duration");
            }
        }
    }

    //Slicer Mode:
    if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftSlicerMode || ctrl === PioneerDDJRZX.nonPadLeds.parameterRightSlicerMode) {
        // change parameter set:
        if (ctrl === PioneerDDJRZX.nonPadLeds.parameterLeftSlicerMode && PioneerDDJRZX.selectedSlicerQuantizeParam[deck] > 0) {
            PioneerDDJRZX.selectedSlicerQuantizeParam[deck] -= 1;
        } else if (ctrl === PioneerDDJRZX.nonPadLeds.parameterRightSlicerMode && PioneerDDJRZX.selectedSlicerQuantizeParam[deck] < 3) {
            PioneerDDJRZX.selectedSlicerQuantizeParam[deck] += 1;
        }
        PioneerDDJRZX.selectedSlicerQuantization[deck] = PioneerDDJRZX.slicerQuantizations[PioneerDDJRZX.selectedSlicerQuantizeParam[deck]];
    }
    //Slicer Mode + SHIFT:
    if (ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterLeftSlicerMode || ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterRightSlicerMode) {
        // change parameter set:
        if (ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterLeftSlicerMode && PioneerDDJRZX.selectedSlicerDomainParam[deck] > 0) {
            PioneerDDJRZX.selectedSlicerDomainParam[deck] -= 1;
        } else if (ctrl === PioneerDDJRZX.nonPadLeds.shiftParameterRightSlicerMode && PioneerDDJRZX.selectedSlicerDomainParam[deck] < 3) {
            PioneerDDJRZX.selectedSlicerDomainParam[deck] += 1;
        }
        PioneerDDJRZX.selectedSlicerDomain[deck] = PioneerDDJRZX.slicerDomains[PioneerDDJRZX.selectedSlicerDomainParam[deck]];
    }

    // update parameter status leds:
    PioneerDDJRZX.updateParameterStatusLeds(
        group,
        PioneerDDJRZX.selectedLoopRollParam[deck],
        PioneerDDJRZX.selectedLoopParam[deck],
        PioneerDDJRZX.selectedSamplerBank,
        PioneerDDJRZX.selectedSlicerQuantizeParam[deck],
        PioneerDDJRZX.selectedSlicerDomainParam[deck]
    );
};

PioneerDDJRZX.parameterLeft = function(channel, control, value, status, group) {
    PioneerDDJRZX.changeParameters(group, control, value);
};

PioneerDDJRZX.parameterRight = function(channel, control, value, status, group) {
    PioneerDDJRZX.changeParameters(group, control, value);
};

PioneerDDJRZX.shiftParameterLeft = function(channel, control, value, status, group) {
    PioneerDDJRZX.changeParameters(group, control, value);
};

PioneerDDJRZX.shiftParameterRight = function(channel, control, value, status, group) {
    PioneerDDJRZX.changeParameters(group, control, value);
};

PioneerDDJRZX.vinylButton = function(channel, control, value, status, group) {
    PioneerDDJRZX.toggleScratch(channel, control, value, status, group);
};

PioneerDDJRZX.slipButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "slip_enabled");
    }
};

PioneerDDJRZX.keyLockButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "keylock");
    }
};

PioneerDDJRZX.shiftKeyLockButton = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group],
        range = engine.getValue(group, "rateRange");

    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftKeyLock, value);

    if (range === 0.90) {
        range = PioneerDDJRZX.setUpSpeedSliderRange[deck];
    } else if ((range * 2) > 0.90) {
        range = 0.90;
    } else {
        range = range * 2;
    }

    if (value) {
        engine.setValue(group, "rateRange", range);
    }
};

PioneerDDJRZX.tempoResetButton = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    if (value) {
        engine.setValue(group, "rate", 0);
        if (PioneerDDJRZX.syncRate[deck] !== engine.getValue(group, "rate")) {
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, 0);
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, 0);
            PioneerDDJRZX.syncRate[deck] = 0;
        }
    }
};

PioneerDDJRZX.autoLoopButton = function(channel, control, value, status, group) {
    if (value) {
        if (engine.getValue(group, "loop_enabled")) {
            engine.setValue(group, "reloop_toggle", true);
            engine.setValue(group, "reloop_toggle", false);
        } else {
            engine.setValue(group, "beatloop_activate", true);
            engine.setValue(group, "beatloop_activate", false);
        }
    }
};

PioneerDDJRZX.loopActiveButton = function(channel, control, value, status, group) {
    engine.setValue(group, "reloop_toggle", value);
};

PioneerDDJRZX.loopInButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "loop_in");
};

PioneerDDJRZX.shiftLoopInButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "reloop_andstop");
};

PioneerDDJRZX.loopOutButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "loop_out");
};

PioneerDDJRZX.loopExitButton = function(channel, control, value, status, group) {
    engine.setValue(group, "reloop_toggle", value);
};

PioneerDDJRZX.loopHalveButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "loop_halve");
};

PioneerDDJRZX.loopDoubleButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "loop_double");
};

PioneerDDJRZX.loopMoveBackButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "beatjump_1_backward");
};

PioneerDDJRZX.loopMoveForwardButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "beatjump_1_forward");
};

PioneerDDJRZX.loadButton = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "LoadSelectedTrack", true);
        if (PioneerDDJRZX.autoPFL) {
            for (var index in PioneerDDJRZX.channelGroups) {
                if (PioneerDDJRZX.channelGroups.hasOwnProperty(index)) {
                    if (index === group) {
                        engine.setValue(index, "pfl", true);
                    } else {
                        engine.setValue(index, "pfl", false);
                    }
                }
            }
        }
    }
};

PioneerDDJRZX.crossfaderAssignCenter = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "orientation", 1);
    }
};

PioneerDDJRZX.crossfaderAssignLeft = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "orientation", 0);
    }
};

PioneerDDJRZX.crossfaderAssignRight = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "orientation", 2);
    }
};

PioneerDDJRZX.reverseRollButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "reverseroll");
};

PioneerDDJRZX.reverseButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "reverse");
};

PioneerDDJRZX.gridAdjustButton = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    PioneerDDJRZX.gridAdjustSelected[deck] = value ? true : false;
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.gridAdjust, value);
};

PioneerDDJRZX.gridSetButton = function(channel, control, value, status, group) {
    script.toggleControl(group, "beats_translate_curpos");
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftGridAdjust, value);
};

PioneerDDJRZX.gridSlideButton = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    PioneerDDJRZX.gridSlideSelected[deck] = value ? true : false;
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.gridSlide, value);
};

PioneerDDJRZX.syncButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "sync_enabled");
    }
};

PioneerDDJRZX.quantizeButton = function(channel, control, value, status, group) {
    if (value) {
        script.toggleControl(group, "quantize");
    }
};

PioneerDDJRZX.needleSearchTouch = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    if (engine.getValue(group, "play")) {
        PioneerDDJRZX.needleSearchTouched[deck] = PioneerDDJRZX.shiftPressed && (value ? true : false);
    } else {
        PioneerDDJRZX.needleSearchTouched[deck] = value ? true : false;
    }
};

PioneerDDJRZX.needleSearchStripPosition = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    if (PioneerDDJRZX.needleSearchTouched[deck]) {
        var position = value / 0x7F;
        engine.setValue(group, "playposition", position);
    }
};

PioneerDDJRZX.panelSelectButton = function(channel, control, value, status, group) {
    if (value) {
        if ((PioneerDDJRZX.panels[0] === false) && (PioneerDDJRZX.panels[1] === false)) {
            PioneerDDJRZX.panels[0] = true;
        } else if ((PioneerDDJRZX.panels[0] === true) && (PioneerDDJRZX.panels[1] === false)) {
            PioneerDDJRZX.panels[1] = true;
        } else if ((PioneerDDJRZX.panels[0] === true) && (PioneerDDJRZX.panels[1] === true)) {
            PioneerDDJRZX.panels[0] = false;
        } else if ((PioneerDDJRZX.panels[0] === false) && (PioneerDDJRZX.panels[1] === true)) {
            PioneerDDJRZX.panels[1] = false;
        }

        engine.setValue("[Samplers]", "show_samplers", PioneerDDJRZX.panels[0]);
        engine.setValue("[EffectRack1]", "show", PioneerDDJRZX.panels[1]);
    }
};

PioneerDDJRZX.shiftPanelSelectButton = function(channel, control, value, status, group) {
    var channelGroup;
    PioneerDDJRZX.shiftPanelSelectPressed = value ? true : false;

    for (var index in PioneerDDJRZX.fxUnitGroups) {
        if (PioneerDDJRZX.fxUnitGroups.hasOwnProperty(index)) {
            if (PioneerDDJRZX.fxUnitGroups[index] < 2) {
                for (channelGroup in PioneerDDJRZX.channelGroups) {
                    if (PioneerDDJRZX.channelGroups.hasOwnProperty(channelGroup)) {
                        engine.connectControl(index, "group_" + channelGroup + "_enable", "PioneerDDJRZX.fxAssignLeds", value);
                        if (value) {
                            engine.trigger(index, "group_" + channelGroup + "_enable");
                        }
                    }
                }
            }
            if (PioneerDDJRZX.fxUnitGroups[index] >= 2) {
                for (channelGroup in PioneerDDJRZX.channelGroups) {
                    if (PioneerDDJRZX.channelGroups.hasOwnProperty(channelGroup)) {
                        engine.connectControl(index, "group_" + channelGroup + "_enable", "PioneerDDJRZX.fxAssignLeds", !value);
                        if (value) {
                            engine.trigger(index, "group_" + channelGroup + "_enable");
                        } else {
                            PioneerDDJRZX.fxAssignLedControl(index, PioneerDDJRZX.channelGroups[channelGroup], false);
                        }
                    }
                }
            }
        }
    }
};


///////////////////////////////////////////////////////////////
//                          LED HELPERS                      //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.deckConverter = function(group) {
    if (PioneerDDJRZX.channelGroups.hasOwnProperty(group)) {
        return PioneerDDJRZX.channelGroups[group];
    }
    return group;
};

PioneerDDJRZX.flashLedState = 0;

PioneerDDJRZX.flashLed = function(deck, ledNumber) {
    if (PioneerDDJRZX.flashLedState === 0) {
        PioneerDDJRZX.nonPadLedControl(deck, ledNumber, 1);
        PioneerDDJRZX.flashLedState = 1;
    } else if (PioneerDDJRZX.flashLedState === 1) {
        PioneerDDJRZX.nonPadLedControl(deck, ledNumber, 0);
        PioneerDDJRZX.flashLedState = 0;
    }
};

PioneerDDJRZX.resetNonDeckLeds = function() {
    var indexFxUnit;

    // fx Leds:
    for (indexFxUnit in PioneerDDJRZX.fxUnitGroups) {
        if (PioneerDDJRZX.fxUnitGroups.hasOwnProperty(indexFxUnit)) {
            if (PioneerDDJRZX.fxUnitGroups[indexFxUnit] < 2) {
                for (var indexFxLed in PioneerDDJRZX.fxEffectGroups) {
                    if (PioneerDDJRZX.fxEffectGroups.hasOwnProperty(indexFxLed)) {
                        PioneerDDJRZX.fxLedControl(
                            PioneerDDJRZX.fxUnitGroups[indexFxUnit],
                            PioneerDDJRZX.fxEffectGroups[indexFxLed],
                            false,
                            false
                        );
                        PioneerDDJRZX.fxLedControl(
                            PioneerDDJRZX.fxUnitGroups[indexFxUnit],
                            PioneerDDJRZX.fxEffectGroups[indexFxLed],
                            true,
                            false
                        );
                    }
                }
                PioneerDDJRZX.fxLedControl(PioneerDDJRZX.fxUnitGroups[indexFxUnit], 0x03, false, false);
                PioneerDDJRZX.fxLedControl(PioneerDDJRZX.fxUnitGroups[indexFxUnit], 0x03, true, false);
            }
        }
    }

    // fx assign Leds:
    for (indexFxUnit in PioneerDDJRZX.fxUnitGroups) {
        if (PioneerDDJRZX.fxUnitGroups.hasOwnProperty(indexFxUnit)) {
            for (var channelGroup in PioneerDDJRZX.channelGroups) {
                if (PioneerDDJRZX.channelGroups.hasOwnProperty(channelGroup)) {
                    PioneerDDJRZX.fxAssignLedControl(
                        indexFxUnit,
                        PioneerDDJRZX.channelGroups[channelGroup],
                        false
                    );
                }
            }
        }
    }

    // general Leds:
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftMasterCue, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.loadDeck1, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck1, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.loadDeck2, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck2, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.loadDeck3, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck3, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.loadDeck4, false);
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftLoadDeck4, false);
};

PioneerDDJRZX.fxAssignLedControl = function(unit, ledNumber, active) {
    var fxAssignLedsBaseChannel = 0x96,
        fxAssignLedsBaseControl = 0;

    if (unit === "[EffectRack1_EffectUnit1]") {
        fxAssignLedsBaseControl = PioneerDDJRZX.nonPadLeds.fx1assignDeck1;
    }
    if (unit === "[EffectRack1_EffectUnit2]") {
        fxAssignLedsBaseControl = PioneerDDJRZX.nonPadLeds.fx2assignDeck1;
    }
    if (unit === "[EffectRack1_EffectUnit3]") {
        fxAssignLedsBaseControl = PioneerDDJRZX.nonPadLeds.shiftFx1assignDeck1;
    }
    if (unit === "[EffectRack1_EffectUnit4]") {
        fxAssignLedsBaseControl = PioneerDDJRZX.nonPadLeds.shiftFx2assignDeck1;
    }

    midi.sendShortMsg(
        fxAssignLedsBaseChannel,
        fxAssignLedsBaseControl + ledNumber,
        active ? 0x7F : 0x00
    );
};

PioneerDDJRZX.fxLedControl = function(unit, ledNumber, shift, active) {
    var fxLedsBaseChannel = 0x94,
        fxLedsBaseControl = (shift ? 0x63 : 0x47);

    midi.sendShortMsg(
        fxLedsBaseChannel + unit,
        fxLedsBaseControl + ledNumber,
        active ? 0x7F : 0x00
    );
};

PioneerDDJRZX.padLedControl = function(deck, groupNumber, ledNumber, shift, active) {
    var padLedsBaseChannel = 0x97,
        padLedControl = (shift ? 0x08 : 0x00) + groupNumber + ledNumber,
        midiChannelOffset = PioneerDDJRZX.deckConverter(deck);

    if (midiChannelOffset !== null) {
        midi.sendShortMsg(
            padLedsBaseChannel + midiChannelOffset,
            padLedControl,
            active ? 0x7F : 0x00
        );
    }
};

PioneerDDJRZX.nonPadLedControl = function(deck, ledNumber, active) {
    var nonPadLedsBaseChannel = 0x90,
        midiChannelOffset = PioneerDDJRZX.deckConverter(deck);

    if (midiChannelOffset !== null) {
        midi.sendShortMsg(
            nonPadLedsBaseChannel + midiChannelOffset,
            ledNumber,
            active ? 0x7F : 0x00
        );
    }
};

PioneerDDJRZX.illuminateFunctionControl = function(ledNumber, active) {
    var illuminationBaseChannel = 0x9B;

    midi.sendShortMsg(
        illuminationBaseChannel,
        ledNumber,
        active ? 0x7F : 0x00
    );
};

PioneerDDJRZX.wheelLedControl = function(deck, ledNumber) {
    var wheelLedBaseChannel = 0xBB,
        channel = PioneerDDJRZX.deckConverter(deck);

    if (channel !== null) {
        midi.sendShortMsg(
            wheelLedBaseChannel,
            channel,
            ledNumber
        );
    }
};

// Send djAppConnect + full illumination init to all channels.
// Called once after all deck bindings are in place.
PioneerDDJRZX.ledInit = function() {
    var ill = PioneerDDJRZX.illuminationControl,
        decks = ['[Channel1]', '[Channel2]', '[Channel3]', '[Channel4]'];

    // Tell controller a DJ app is connected (enables software LED mode)
    PioneerDDJRZX.illuminateFunctionControl(ill.djAppConnect, true);

    for (var i = 0; i < decks.length; i++) {
        var group = decks[i],
            deckNum = i + 1,
            loaded  = engine.getValue(group, "duration") > 0,
            playing = engine.getValue(group, "play_indicator") > 0,
            cued    = engine.getValue(group, "cue_indicator") > 0;

        // Illumination notes on ch12 (0x9B): loaded / play / cue state
        PioneerDDJRZX.illuminateFunctionControl(ill["loadedDeck"   + deckNum], loaded);
        PioneerDDJRZX.illuminateFunctionControl(ill["playPauseDeck" + deckNum], playing);
        PioneerDDJRZX.illuminateFunctionControl(ill["cueDeck"       + deckNum], cued);

        // Ring rotation is hardware-driven by audio signal — no MIDI position needed
    }
};

PioneerDDJRZX.generalLedControl = function(ledNumber, active) {
    var generalLedBaseChannel = 0x96;

    midi.sendShortMsg(
        generalLedBaseChannel,
        ledNumber,
        active ? 0x7F : 0x00
    );
};

PioneerDDJRZX.updateParameterStatusLeds = function(group, statusRoll, statusLoop, statusSampler, statusSlicerQuant, statusSlicerDomain) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftRollMode, statusRoll & (1 << 1));
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightRollMode, statusRoll & 1);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftGroup2Mode, statusLoop & (1 << 1));
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightGroup2Mode, statusLoop & 1);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftSamplerMode, statusSampler & (1 << 1));
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightSamplerMode, statusSampler & 1);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftSlicerMode, statusSlicerQuant & (1 << 1));
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightSlicerMode, statusSlicerQuant & 1);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterLeftSlicerMode, statusSlicerDomain & (1 << 1));
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftParameterRightSlicerMode, statusSlicerDomain & 1);
};


///////////////////////////////////////////////////////////////
//                             LEDS                          //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.fxAssignLeds = function(value, group, control) {
    var channelGroup = control.replace("group_", '').replace("_enable", '');
    PioneerDDJRZX.fxAssignLedControl(group, PioneerDDJRZX.channelGroups[channelGroup], value);
};

PioneerDDJRZX.headphoneCueLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.headphoneCue, value);
};

PioneerDDJRZX.shiftHeadphoneCueLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftHeadphoneCue, value);
};

PioneerDDJRZX.shiftMasterCueLed = function(value, group, control) {
    PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds.shiftMasterCue, value);
};

PioneerDDJRZX.keyLockLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.keyLock, value);
};

PioneerDDJRZX.playLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.play, value);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftPlay, value);
    var deck = PioneerDDJRZX.channelGroups[group];
    if (deck !== undefined) {
        PioneerDDJRZX.illuminateFunctionControl(PioneerDDJRZX.illuminationControl["playPauseDeck" + (deck + 1)], value);
    }
};


PioneerDDJRZX.cueLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.cue, value);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftCue, value);
};

PioneerDDJRZX.loadLed = function(value, group, control) {
    var deck = PioneerDDJRZX.channelGroups[group];
    if (value > 0) {
        PioneerDDJRZX.wheelLedControl(group, PioneerDDJRZX.wheelLedCircle.maxVal);
        PioneerDDJRZX.generalLedControl(PioneerDDJRZX.nonPadLeds["loadDeck" + (deck + 1)], true);
        PioneerDDJRZX.illuminateFunctionControl(PioneerDDJRZX.illuminationControl["loadedDeck" + (deck + 1)], true);
        engine.trigger(group, "playposition");
    } else {
        PioneerDDJRZX.wheelLedControl(group, PioneerDDJRZX.wheelLedCircle.minVal);
    }
};

PioneerDDJRZX.reverseLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.censor, value);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftCensor, value);
};

PioneerDDJRZX.slipLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.slip, value);
};

PioneerDDJRZX.quantizeLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftSync, value);
};

PioneerDDJRZX.syncLed = function(value, group, control) {
    var deck = PioneerDDJRZX.channelGroups[group];
    var rate = engine.getValue(group, "rate");
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.sync, value);
    if (value) {
        PioneerDDJRZX.syncRate[deck] = rate;
        if (PioneerDDJRZX.syncRate[deck] > 0) {
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, 1);
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, 0);
        } else if (PioneerDDJRZX.syncRate[deck] < 0) {
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, 0);
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, 1);
        }
    }
    if (!value) {
        if (PioneerDDJRZX.syncRate[deck] !== rate || rate === 0) {
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverPlus, 0);
            PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.takeoverMinus, 0);
            PioneerDDJRZX.syncRate[deck] = 0;
        }
    }
};

PioneerDDJRZX.autoLoopLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.autoLoop, value);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopOut, value);
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftAutoLoop, value);
};

PioneerDDJRZX.loopInLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopIn, value);
};

PioneerDDJRZX.shiftLoopInLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopIn, value);
};

PioneerDDJRZX.loopOutLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopOut, value);
};

PioneerDDJRZX.loopHalveLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopHalve, value);
};

PioneerDDJRZX.loopDoubleLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.loopDouble, value);
};

PioneerDDJRZX.loopShiftFWLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopDouble, value);
};

PioneerDDJRZX.loopShiftBKWLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.shiftLoopHalve, value);
};

PioneerDDJRZX.hotCueParameterRightLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterRightHotCueMode, value);
};

PioneerDDJRZX.hotCueParameterLeftLed = function(value, group, control) {
    PioneerDDJRZX.nonPadLedControl(group, PioneerDDJRZX.nonPadLeds.parameterLeftHotCueMode, value);
};

PioneerDDJRZX.samplerLeds = function(value, group, control) {
    var samplerIndex = (group.replace("[Sampler", '').replace(']', '') - 1) % 8,
        sampleDeck = "[Sampler" + (samplerIndex + 1) + "]",
        padNum = PioneerDDJRZX.samplerGroups[sampleDeck];

    for (var index in PioneerDDJRZX.channelGroups) {
        if (PioneerDDJRZX.channelGroups.hasOwnProperty(index)) {
            PioneerDDJRZX.padLedControl(
                PioneerDDJRZX.channelGroups[index],
                PioneerDDJRZX.ledGroups.sampler,
                padNum,
                false,
                value
            );
        }
    }
};

PioneerDDJRZX.samplerLedsPlay = function(value, group, control) {
    var samplerIndex = (group.replace("[Sampler", '').replace(']', '') - 1) % 8,
        sampleDeck = "[Sampler" + (samplerIndex + 1) + "]",
        padNum = PioneerDDJRZX.samplerGroups[sampleDeck];

    if (!engine.getValue(sampleDeck, "duration")) {
        return;
    }

    for (var index in PioneerDDJRZX.channelGroups) {
        if (PioneerDDJRZX.channelGroups.hasOwnProperty(index)) {
            PioneerDDJRZX.padLedControl(
                PioneerDDJRZX.channelGroups[index],
                PioneerDDJRZX.ledGroups.sampler,
                padNum,
                false, !value
            );
            PioneerDDJRZX.padLedControl(
                PioneerDDJRZX.channelGroups[index],
                PioneerDDJRZX.ledGroups.sampler,
                padNum,
                true,
                value
            );
        }
    }
};

PioneerDDJRZX.beatloopLeds = function(value, group, control) {
    var padNum,
        shifted = false,
        deck = PioneerDDJRZX.channelGroups[group];

    for (var index in PioneerDDJRZX.selectedLoopIntervals[deck]) {
        if (PioneerDDJRZX.selectedLoopIntervals[deck].hasOwnProperty(index)) {
            if (control === "beatloop_" + PioneerDDJRZX.selectedLoopIntervals[deck][index] + "_enabled") {
                padNum = index % 8;
                PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.group2, padNum, shifted, value);
            }
        }
    }
};

PioneerDDJRZX.beatlooprollLeds = function(value, group, control) {
    var padNum,
        shifted = false,
        deck = PioneerDDJRZX.channelGroups[group];

    for (var index in PioneerDDJRZX.selectedLooprollIntervals[deck]) {
        if (PioneerDDJRZX.selectedLooprollIntervals[deck].hasOwnProperty(index)) {
            if (control === "beatlooproll_" + PioneerDDJRZX.selectedLooprollIntervals[deck][index] + "_activate") {
                padNum = index % 8;
                PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.loopRoll, padNum, shifted, value);
            }
        }
    }
};

PioneerDDJRZX.hotCueLeds = function(value, group, control) {
    var padNum = null,
        hotCueNum;

    for (hotCueNum = 1; hotCueNum <= 8; hotCueNum++) {
        if (control === "hotcue_" + hotCueNum + "_enabled") {
            padNum = (hotCueNum - 1);
            PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.hotCue, padNum, false, value);
            PioneerDDJRZX.padLedControl(group, PioneerDDJRZX.ledGroups.hotCue, padNum, true, value);
        }
    }
};

PioneerDDJRZX.VuMeterLeds = function(value, group, control) {
    // Remark: Only deck vu meters can be controlled! Master vu meter is handled by hardware!
    var midiBaseAdress = 0xB0,
        channel = 0x02,
        midiOut = 0x00;

    value = parseInt(value * 0x76); //full level indicator: 0x7F

    if (engine.getValue(group, "peak_indicator")) {
        value = value + 0x09;
    }

    PioneerDDJRZX.valueVuMeter[group + "_current"] = value;

    for (var index in PioneerDDJRZX.channelGroups) {
        if (PioneerDDJRZX.channelGroups.hasOwnProperty(index)) {
            midiOut = PioneerDDJRZX.valueVuMeter[index + "_current"];
            if (PioneerDDJRZX.twinkleVumeterAutodjOn) {
                if (engine.getValue("[AutoDJ]", "enabled")) {
                    if (PioneerDDJRZX.valueVuMeter[index + "_enabled"]) {
                        midiOut = 0;
                    }
                    if (midiOut < 5 && !PioneerDDJRZX.valueVuMeter[index + "_enabled"]) {
                        midiOut = 5;
                    }
                }
            }
            midi.sendShortMsg(
                midiBaseAdress + PioneerDDJRZX.channelGroups[index],
                channel,
                midiOut
            );
        }
    }
};


///////////////////////////////////////////////////////////////
//                          JOGWHEELS                        //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.getJogWheelDelta = function(value) {
    // The Wheel control centers on 0x40; find out how much it's moved by.
    return value - 0x40;
};

PioneerDDJRZX.jogRingTick = function(channel, control, value, status, group) {
    PioneerDDJRZX.pitchBendFromJog(group, PioneerDDJRZX.getJogWheelDelta(value));
};

PioneerDDJRZX.jogRingTickShift = function(channel, control, value, status, group) {
    PioneerDDJRZX.pitchBendFromJog(
        group,
        PioneerDDJRZX.getJogWheelDelta(value) * PioneerDDJRZX.jogwheelShiftMultiplier
    );
};

PioneerDDJRZX.jogPlatterTick = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    if (PioneerDDJRZX.gridAdjustSelected[deck]) {
        if (PioneerDDJRZX.getJogWheelDelta(value) > 0) {
            script.toggleControl(group, "beats_adjust_faster");
        }
        if (PioneerDDJRZX.getJogWheelDelta(value) <= 0) {
            script.toggleControl(group, "beats_adjust_slower");
        }
        return;
    }
    if (PioneerDDJRZX.gridSlideSelected[deck]) {
        if (PioneerDDJRZX.getJogWheelDelta(value) > 0) {
            script.toggleControl(group, "beats_translate_later");
        }
        if (PioneerDDJRZX.getJogWheelDelta(value) <= 0) {
            script.toggleControl(group, "beats_translate_earlier");
        }
        return;
    }

    if (PioneerDDJRZX.scratchMode[deck] && engine.isScratching(deck + 1)) {
        engine.scratchTick(deck + 1, PioneerDDJRZX.getJogWheelDelta(value));
    } else {
        PioneerDDJRZX.pitchBendFromJog(group, PioneerDDJRZX.getJogWheelDelta(value));
    }
};

PioneerDDJRZX.jogPlatterTickShift = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    if (PioneerDDJRZX.scratchMode[deck] && engine.isScratching(deck + 1)) {
        engine.scratchTick(deck + 1, PioneerDDJRZX.getJogWheelDelta(value));
    } else {
        PioneerDDJRZX.pitchBendFromJog(
            group,
            PioneerDDJRZX.getJogWheelDelta(value) * PioneerDDJRZX.jogwheelShiftMultiplier
        );
    }
};

PioneerDDJRZX.jogTouch = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];

    if (PioneerDDJRZX.scratchMode[deck]) {
        if (value) {
            engine.scratchEnable(
                deck + 1,
                PioneerDDJRZX.scratchSettings.jogResolution,
                PioneerDDJRZX.scratchSettings.vinylSpeed,
                PioneerDDJRZX.scratchSettings.alpha,
                PioneerDDJRZX.scratchSettings.beta,
                true
            );
        } else {
            engine.scratchDisable(deck + 1, true);
        }
    }
};

PioneerDDJRZX.toggleScratch = function(channel, control, value, status, group) {
    var deck = PioneerDDJRZX.channelGroups[group];
    if (value) {
        PioneerDDJRZX.scratchMode[deck] = !PioneerDDJRZX.scratchMode[deck];
        PioneerDDJRZX.triggerVinylLed(deck);
    }
};

PioneerDDJRZX.triggerVinylLed = function(deck) {
    PioneerDDJRZX.nonPadLedControl(deck, PioneerDDJRZX.nonPadLeds.vinyl, PioneerDDJRZX.scratchMode[deck]);
};

PioneerDDJRZX.pitchBendFromJog = function(group, movement) {
    engine.setValue(group, "jog", movement / 5 * PioneerDDJRZX.jogwheelSensitivity);
};


///////////////////////////////////////////////////////////////
//             ROTARY SELECTOR & NAVIGATION BUTTONS          //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.loadPrepareButton = function(channel, control, value, status) {
    if (PioneerDDJRZX.rotarySelectorChanged === true) {
        if (value) {
            engine.setValue("[PreviewDeck1]", "LoadSelectedTrackAndPlay", true);
        } else {
            if (PioneerDDJRZX.jumpPreviewEnabled) {
                engine.setValue("[PreviewDeck1]", "playposition", PioneerDDJRZX.jumpPreviewPosition);
            }
            PioneerDDJRZX.rotarySelectorChanged = false;
        }
    } else {
        if (value) {
            if (engine.getValue("[PreviewDeck1]", "stop")) {
                script.toggleControl("[PreviewDeck1]", "play");
            } else {
                script.toggleControl("[PreviewDeck1]", "stop");
            }
        }
    }
};

PioneerDDJRZX.backButton = function(channel, control, value, status) {
    script.toggleControl("[Library]", "MoveFocusBackward");
};

PioneerDDJRZX.shiftBackButton = function(channel, control, value, status) {
    if (value) {
        script.toggleControl("[Skin]", "show_maximized_library");
    }
};

PioneerDDJRZX.getRotaryDelta = function(value) {
    var delta = 0x40 - Math.abs(0x40 - value),
        isCounterClockwise = value > 0x40;

    if (isCounterClockwise) {
        delta *= -1;
    }
    return delta;
};

PioneerDDJRZX.rotarySelector = function(channel, control, value, status) {
    var delta = PioneerDDJRZX.getRotaryDelta(value);

    engine.setValue("[Library]", "MoveVertical", delta);
    PioneerDDJRZX.rotarySelectorChanged = true;
};

PioneerDDJRZX.rotarySelectorShifted = function(channel, control, value, status) {
    var delta = PioneerDDJRZX.getRotaryDelta(value),
        f = (delta > 0 ? "SelectNextPlaylist" : "SelectPrevPlaylist");

    engine.setValue("[Library]", "MoveHorizontal", delta);
};

PioneerDDJRZX.rotarySelectorClick = function(channel, control, value, status) {
    script.toggleControl("[Library]", "GoToItem");
};

PioneerDDJRZX.rotarySelectorShiftedClick = function(channel, control, value, status) {
    if (PioneerDDJRZX.autoDJAddTop) {
        script.toggleControl("[Library]", "AutoDjAddTop");
    } else {
        script.toggleControl("[Library]", "AutoDjAddBottom");
    }
};


///////////////////////////////////////////////////////////////
//                             FX                            //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.fxAssignButton = function(channel, control, value, status, group) {
    if (value) {
        if ((control >= 0x4C) && (control <= 0x4F)) {
            script.toggleControl("[EffectRack1_EffectUnit1]", "group_" + group + "_enable");
        } else if ((control >= 0x50) && (control <= 0x53)) {
            script.toggleControl("[EffectRack1_EffectUnit2]", "group_" + group + "_enable");
        } else if ((control >= 0x70) && (control <= 0x73) && PioneerDDJRZX.shiftPanelSelectPressed) {
            script.toggleControl("[EffectRack1_EffectUnit3]", "group_" + group + "_enable");
        } else if ((control >= 0x54) && (control <= 0x57) && PioneerDDJRZX.shiftPanelSelectPressed) {
            script.toggleControl("[EffectRack1_EffectUnit4]", "group_" + group + "_enable");
        }
    }
};


///////////////////////////////////////////////////////////////
//                          SLICER                           //
///////////////////////////////////////////////////////////////

PioneerDDJRZX.slicerBeatActive = function(value, group, control) {
    // This slicer implementation will work for constant beatgrids only!
    var deck = PioneerDDJRZX.channelGroups[group],
        bpm = engine.getValue(group, "bpm"),
        playposition = engine.getValue(group, "playposition"),
        duration = engine.getValue(group, "duration"),
        slicerPosInSection = 0,
        ledBeatState = true,
        domain = PioneerDDJRZX.selectedSlicerDomain[deck];

    if (engine.getValue(group, "beat_closest") === engine.getValue(group, "beat_next")) {
        return;
    }

    PioneerDDJRZX.slicerBeatsPassed[deck] = Math.round((playposition * duration) * (bpm / 60));
    slicerPosInSection = Math.floor((PioneerDDJRZX.slicerBeatsPassed[deck] % domain) / (domain / 8));

    if (PioneerDDJRZX.activePadMode[deck] === PioneerDDJRZX.padModes.slicer) {
        if (PioneerDDJRZX.activeSlicerMode[deck] === PioneerDDJRZX.slicerModes.contSlice) {
            ledBeatState = true;
        }
        if (PioneerDDJRZX.activeSlicerMode[deck] === PioneerDDJRZX.slicerModes.loopSlice) {
            ledBeatState = false;
            if (((PioneerDDJRZX.slicerBeatsPassed[deck] - 1) % domain) === (domain - 1) &&
                !PioneerDDJRZX.slicerAlreadyJumped[deck] &&
                PioneerDDJRZX.slicerPreviousBeatsPassed[deck] < PioneerDDJRZX.slicerBeatsPassed[deck]) {
                engine.setValue(group, "beatjump", -domain);
                PioneerDDJRZX.slicerAlreadyJumped[deck] = true;
            } else {
                PioneerDDJRZX.slicerAlreadyJumped[deck] = false;
            }
        }
        // PAD Led control:
        for (var i = 0; i < 8; i++) {
            if (PioneerDDJRZX.slicerActive[deck]) {
                if (PioneerDDJRZX.slicerButton[deck] !== i) {
                    PioneerDDJRZX.padLedControl(
                        group,
                        PioneerDDJRZX.ledGroups.slicer,
                        i,
                        false,
                        (slicerPosInSection === i) ? ledBeatState : !ledBeatState
                    );
                }
            } else {
                PioneerDDJRZX.padLedControl(
                    group,
                    PioneerDDJRZX.ledGroups.slicer,
                    i,
                    false,
                    (slicerPosInSection === i) ? ledBeatState : !ledBeatState
                );
            }
        }
    } else {
        PioneerDDJRZX.slicerAlreadyJumped[deck] = false;
        PioneerDDJRZX.slicerPreviousBeatsPassed[deck] = 0;
        PioneerDDJRZX.slicerActive[deck] = false;
    }
};
