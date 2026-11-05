/**
 * /delete — quit pi and delete the current session file.
 *
 * Replaces the manual dance of /quit, pi -r, find the session, Ctrl+D.
 */

import { rmSync } from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  let sessionFileToDelete: string | undefined;

  pi.registerCommand("delete", {
    description: "Quit and delete the current session",
    handler: async (_args, ctx) => {
      const sessionFile = ctx.sessionManager.getSessionFile();

      if (!sessionFile) {
        ctx.ui.notify("Session is not persisted; nothing to delete. Quitting.", "info");
        ctx.shutdown();
        return;
      }

      if (ctx.hasUI) {
        const ok = await ctx.ui.confirm(
          "Delete session?",
          `Quit and permanently delete:\n${sessionFile}`,
        );
        if (!ok) return;
      }

      sessionFileToDelete = sessionFile;
      ctx.shutdown();
    },
  });

  // Delete during shutdown so nothing can append to the file afterwards.
  pi.on("session_shutdown", async (event) => {
    if (!sessionFileToDelete || event.reason !== "quit") return;
    rmSync(sessionFileToDelete, { force: true });
    sessionFileToDelete = undefined;
  });
}
