export const AUTO_ONLY_GAMES = ["grow-a-garden-2", "steal-an-egg"] as const;

export function isAutoGame(slug?: string | null): boolean {
  if (!slug) return false;
  return (AUTO_ONLY_GAMES as readonly string[]).includes(String(slug).trim().toLowerCase());
}

export const AUTO_GAME_LABELS: Record<string, string> = {
  "grow-a-garden-2": "Grow A Garden 2",
  "steal-an-egg": "Steal an Egg",
};

export function autoGameLabel(slug?: string | null): string {
  if (!slug) return "the game";
  return AUTO_GAME_LABELS[String(slug).trim().toLowerCase()] ?? String(slug);
}
