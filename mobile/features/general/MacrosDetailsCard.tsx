import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { MacrosDetailsGrid } from "./MacrosDetailsGrid";
import { Text } from "@/components/ui/text";
import { DetailedMacrosModal } from "./DetailedMacrosModal";

export const MacrosDetailsCard = (data: {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  saturated_fat: number;
  unsaturated_fat: number;
  omega3_fat: number;
  omega6_fat: number;
  trans_fat: number;
  cholesterol: number;
  sugars: number;
  fiber: number;
  salt: number;
  sodium: number;
}) => {
  return (
    <Card variant="half-rounded" className="w-full pb-0">
      <Box className="relative w-fit items-center m-auto pb-5">
        <Text size="7xl">{data.calories}</Text>
        <Text size="3xl" className="absolute bottom-0">
          ккал
        </Text>
      </Box>
      <MacrosDetailsGrid {...data} />
      <DetailedMacrosModal {...data} />
    </Card>
  );
};
