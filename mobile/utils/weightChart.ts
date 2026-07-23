const DAY = 1000 * 60 * 60 * 24;

export const prepareWeightChartData = (
  weightData: {
    logged_at: string;
    weight: number;
  }[],
) => {
  const offsets = [-7, -6, -5, -4, -3, -2, -1, 0];

  const dict = weightData.reduce<Record<string, number>>((acc, item) => {
    acc[item.logged_at.substring(0, 10)] = item.weight;
    return acc;
  }, {});

  const data: number[] = [];
  const labels: string[] = [];

  offsets.forEach((offset) => {
    const date = new Date(Date.now() + offset * DAY);
    const key = date.toISOString().substring(0, 10);

    data.push(dict[key] ?? data[data.length - 1] ?? 0);

    labels.push(
      date.toLocaleString("ru-RU", {
        month: "numeric",
        day: "numeric",
      }),
    );
  });

  return {
    data,
    labels,
  };
};
