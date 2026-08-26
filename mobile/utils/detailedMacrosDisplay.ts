export type NutrientValue = number | null;

export interface Nutrient {
  label: string;
  value: NutrientValue;
  unit: string;
  children?: Nutrient[];
}

export const getNutrients = (data: {
  protein: number;
  fat: number;
  carbs: number;
  saturated_fat: number | null;
  unsaturated_fat: number | null;
  omega3_fat: number | null;
  omega6_fat: number | null;
  trans_fat: number | null;
  sugars: number | null;
  fiber: number | null;
  salt: number | null;
  sodium: number | null;
  cholesterol: number | null;
}): Nutrient[] => [
  {
    label: "Белки",
    value: data.protein,
    unit: "г",
  },
  {
    label: "Жиры",
    value: data.fat,
    unit: "г",
    children: [
      {
        label: "Насыщенные жиры",
        value: data.saturated_fat,
        unit: "г",
      },
      {
        label: "Ненасыщенные жиры",
        value: data.unsaturated_fat,
        unit: "г",
        children: [
          {
            label: "Омега-3",
            value: data.omega3_fat,
            unit: "г",
          },
          {
            label: "Омега-6",
            value: data.omega6_fat,
            unit: "г",
          },
        ],
      },
      {
        label: "Трансжиры",
        value: data.trans_fat,
        unit: "г",
      },
    ],
  },
  {
    label: "Углеводы",
    value: data.carbs,
    unit: "г",
    children: [
      {
        label: "Сахара",
        value: data.sugars,
        unit: "г",
      },
      {
        label: "Клетчатка",
        value: data.fiber,
        unit: "г",
      },
    ],
  },
  {
    label: "Соль",
    value: data.salt,
    unit: "г",
  },
  {
    label: "Натрий",
    value: data.sodium,
    unit: "мг",
  },
  {
    label: "Холестерин",
    value: data.cholesterol,
    unit: "мг",
  },
];
