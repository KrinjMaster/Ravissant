import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";

export const IntroductionCard = () => {
  return (
    <Card variant="elevated" className="h-full" size="lg">
      <Heading className="my-auto text-center text-2xl">
        Привет, это{"\n"}
        <Text
          className="text-primary-700 tracking-widest text-6xl"
          style={{ fontFamily: "Seenonim" }}
        >
          Ravissant
        </Text>
      </Heading>
    </Card>
  );
};
