import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon, CloseIcon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { getNutrients } from "@/utils/detailedMacrosDisplay";
import { NutrientRow } from "../add-product/NutrientRow";
import { useState } from "react";
import { Box } from "@/components/ui/box";

export const DetailedMacrosModal = (macrosData: {
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
}) => {
  const [showMacrosModal, setShowMacrosModal] = useState(false);

  return (
    <Box>
      <Button
        variant="link"
        action="primary"
        onPress={() => setShowMacrosModal(true)}
      >
        <ButtonText>Все нутриенты</ButtonText>
      </Button>
      <Modal
        isOpen={showMacrosModal}
        onClose={() => {
          setShowMacrosModal(false);
        }}
        size="lg"
      >
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="lg">Все нутриенты / 100 г</Heading>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack className="mt-2 pt-3 border-t border-outline-200">
              {getNutrients(macrosData).map((nutrient) => (
                <NutrientRow key={nutrient.label} nutrient={nutrient} />
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
