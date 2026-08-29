import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

type NutrientInputRowProps = {
  label: string;
  value: string;
  unit: string;
  level?: number;
  onChangeText: (value: string) => void;
};

export function NutrientInputRow({
  label,
  value,
  unit,
  level = 0,
  onChangeText,
}: NutrientInputRowProps) {
  return (
    <HStack
      className="w-full items-center justify-between py-1.5"
      style={{ paddingLeft: level * 16 }}
    >
      <Text
        size={level === 0 ? "lg" : "md"}
        className={
          level === 0
            ? "text-typography-900 font-semibold"
            : "text-typography-500"
        }
      >
        {label}
      </Text>
      <HStack className="items-center" space="xs">
        <Input variant="outline" size="md" className="w-24 h-10">
          <InputField
            value={value}
            onChangeText={onChangeText}
            keyboardType="decimal-pad"
            placeholder="0"
            className="text-right px-2"
          />
        </Input>
        <Text size="md" className="w-8 text-typography-400">
          {unit}
        </Text>
      </HStack>
    </HStack>
  );
}
