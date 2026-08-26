import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Nutrient } from "@/utils/detailedMacrosDisplay";

export const NutrientRow = ({
  nutrient,
  level = 0,
}: {
  nutrient: Nutrient;
  level?: number;
}) => {
  const hasValue = nutrient.value !== null;

  return (
    <VStack>
      <HStack
        className="w-full justify-between py-1.5"
        style={{
          paddingLeft: level * 16,
        }}
      >
        <Text
          size={level === 0 ? "lg" : "md"}
          className={
            level === 0 ? "text-typography-900" : "text-typography-400"
          }
        >
          {nutrient.label}
        </Text>

        <Text
          size={level === 0 ? "lg" : "md"}
          className={hasValue ? "text-typography-500" : "text-typography-400"}
        >
          {hasValue ? `${nutrient.value} ${nutrient.unit}` : "—"}
        </Text>
      </HStack>
      {nutrient.children?.map((child) => (
        <NutrientRow key={child.label} nutrient={child} level={level + 1} />
      ))}
    </VStack>
  );
};
