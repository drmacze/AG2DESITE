# AG2 Creator Debug Kit

This kit targets the AG2 script module UUID `ec128ecf-402a-4361-a786-c8f39fa44e2c`.

1. Install the **Minecraft Bedrock Edition Debugger** extension in VS Code.
2. Put `launch.json` under `.vscode/` in the AG2 behavior-pack source workspace.
3. Start the `Debug AG2 with Minecraft` configuration in VS Code.
4. Load the AG2 world in Minecraft and run `/script debugger connect` when VS Code and Minecraft are on the same machine. For cross-device debugging, run `/script debugger connect <VS_CODE_HOST> 19144`.
5. Use `/reload` after connection when necessary.

Profiler:

- `/script profiler start`
- `/script profiler stop`

Diagnostics:

- `/script diagnostics startcapture`
- `/script diagnostics stopcapture`

Import ContentLog, `.cpuprofile`, and diagnostics artifacts into `dev-console/creator-debugger.html`.

A Dedicated Server is not required for client debugging. GitHub Pages is not the debugger socket endpoint; VS Code is.
