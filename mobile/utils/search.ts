const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .replace(/ё/g, "е")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}.,%]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i);

  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= right.length; j += 1) {
      const current = previous[j];
      previous[j] =
        left[i - 1] === right[j - 1]
          ? diagonal
          : Math.min(diagonal, previous[j], previous[j - 1]) + 1;
      diagonal = current;
    }
  }

  return previous[right.length];
};

const similarity = (left: string, right: string) => {
  if (!left || !right) return 0;
  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
};

export const searchTokens = (value: string) => normalize(value).split(" ").filter(Boolean);

export const scoreSearchResult = (name: string, query: string) => {
  const normalizedName = normalize(name);
  const nameTokens = searchTokens(name);
  const queryTokens = searchTokens(query);

  if (!normalizedName || queryTokens.length === 0) return 0;

  let score = normalizedName === normalize(query) ? 1000 : 0;

  for (const queryToken of queryTokens) {
    const bestTokenScore = Math.max(
      ...nameTokens.map((nameToken) => {
        if (nameToken === queryToken) return 100;
        if (nameToken.startsWith(queryToken)) return 80;
        if (nameToken.includes(queryToken)) return 60;
        return similarity(queryToken, nameToken) * 50;
      }),
    );

    if (bestTokenScore < 28) return 0;
    score += bestTokenScore;
  }

  if (normalizedName.startsWith(normalize(query))) score += 40;
  else if (normalizedName.includes(normalize(query))) score += 20;

  return score;
};

export const rankSearchResults = <T extends { name: string; usageCount?: number }>(
  results: T[],
  query: string,
) =>
  results
    .map((result, index) => ({
      result,
      index,
      score: scoreSearchResult(result.name, query),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.result.usageCount ?? 0) - (left.result.usageCount ?? 0) ||
        left.index - right.index,
    )
    .map(({ result }) => result);
