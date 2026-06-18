# ClientesHumanIA
## Premiere Pro Scripts

This repository now includes a simple ExtendScript file to enhance audio in an active sequence.

- `premiere_scripts/improve_audio.jsx` – Adds dynamics and parametric EQ effects to each audio clip in the active sequence and normalizes peaks to -3 dB.

To run the script:
1. Open Adobe Premiere Pro and load your project.
2. Open Visual Studio Code and edit `improve_audio.jsx` if needed.
3. In Premiere Pro, go to `File > Scripts > Run Script File...` and select the script.
4. The script will process each audio clip in the active sequence and notify when complete.

