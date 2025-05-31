// Improve Audio ExtendScript for Adobe Premiere Pro
// Applies basic audio enhancement effects to all audio clips in the active sequence

(function () {
    var seq = app.project.activeSequence;
    if (!seq) {
        alert("No active sequence found.");
        return;
    }

    // Function to add an effect to a clip
    function addEffectToClip(clip, effectName) {
        var components = clip.components;
        var wasAdded = false;
        for (var i = 0; i < components.numItems; i++) {
            if (components[i].matchName === effectName) {
                wasAdded = true; // Effect already present
                break;
            }
        }
        if (!wasAdded) {
            clip.addVideoEffect(effectName); // Works for audio effects too
        }
    }

    var dynamicsEffect = "ADBE Dynamics"; // Dynamics effect for compression and gating
    var eqEffect = "ADBE ParamEQ";        // Parametric equalizer

    for (var t = 0; t < seq.audioTracks.numTracks; t++) {
        var track = seq.audioTracks[t];
        for (var c = 0; c < track.clips.numItems; c++) {
            var clip = track.clips[c];
            addEffectToClip(clip, dynamicsEffect);
            addEffectToClip(clip, eqEffect);
            // Normalize audio gain to -3 dB peak
            try {
                clip.setGain(0, 0); // reset gain adjustments
                clip.normalize(0, -3.0); // channel: 0 = all, peak -3dB
            } catch (err) {
                $.writeln("Normalization failed: " + err);
            }
        }
    }

    alert("Audio enhancement complete.");
})();
