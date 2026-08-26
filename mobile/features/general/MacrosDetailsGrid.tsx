import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { Grid, GridItem } from "@/components/ui/grid";
import { Text } from "@/components/ui/text";

export const MacrosDetailsGrid = (data: {
  protein: number;
  fat: number;
  carbs: number;
}) => {
  return (
    <Grid
      className="gap-4 items-center my-2.5"
      _extra={{
        className: "grid-cols-10",
      }}
    >
      <GridItem
        className="pb-6"
        _extra={{
          className: "col-span-3",
        }}
      >
        <Box className="relative w-fit items-center m-auto">
          <Text size="3xl">{data.protein} г</Text>
          <Text size="xl" className="absolute -bottom-6 text-typography-300">
            белки
          </Text>
        </Box>
      </GridItem>
      <Divider className="w-0.5 h-[75%]" />
      <GridItem
        className="pb-6"
        _extra={{
          className: "col-span-3",
        }}
      >
        <Box className="relative w-fit items-center m-auto">
          <Text size="3xl">{data.fat} г</Text>
          <Text size="xl" className="absolute -bottom-6 text-typography-300">
            жиры
          </Text>
        </Box>
      </GridItem>
      <Divider className="w-0.5 h-[75%]" />
      <GridItem
        className="pb-6"
        _extra={{
          className: "col-span-3",
        }}
      >
        <Box className="relative w-fit items-center m-auto">
          <Text size="3xl">{data.carbs} г</Text>
          <Text size="xl" className="absolute -bottom-6 text-typography-300">
            углеводы
          </Text>
        </Box>
      </GridItem>
    </Grid>
  );
};
