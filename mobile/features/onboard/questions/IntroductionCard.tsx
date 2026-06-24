import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";

export const IntroductionCard = () => {
  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading className="my-auto text-center" size="xl">
        Привет, это{"\n"}
        <Text className="text-primary-700 tracking-widest" size="6xl">
          Ravissant
        </Text>
      </Heading>
    </Card>
  );
};
