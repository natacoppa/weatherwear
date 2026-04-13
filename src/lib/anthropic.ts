import Anthropic from "@anthropic-ai/sdk";

// Module-level singleton. The SDK is stateless per request; sharing the
// instance avoids repeated client construction and gives us one place to
// add timeouts, retries, or observability later.
// WW_ prefix so the app's key doesn't collide with a shell
// ANTHROPIC_API_KEY the developer may have set for other tools.
export const anthropic = new Anthropic({
  apiKey: process.env.WW_ANTHROPIC_API_KEY,
});

// The model ID lives here so upgrades (sonnet-4-5 → sonnet-4-6) are
// one-line. Keep it at 4-5 for now — memory notes Opus 4.6 times out on
// vision-heavy calls, and Sonnet is the shipping default.
export const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
