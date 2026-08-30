import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Icon, CloseIcon } from "@/components/ui/icon";
import Svg, { Rect } from "react-native-svg";

export const BarcodeScanner = ({ className }: { className?: string }) => {
  return (
    <Card variant="half-rounded" className="w-full p-0 max-h-28">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 240 80"
        preserveAspectRatio="none"
        className={className}
      >
        <Rect x="10" y="10" width="3" height="60" fill="white" />
        <Rect x="16" y="10" width="1" height="60" fill="white" />
        <Rect x="20" y="10" width="4" height="60" fill="white" />
        <Rect x="27" y="10" width="2" height="60" fill="white" />
        <Rect x="33" y="10" width="2" height="60" fill="white" />
        <Rect x="37" y="10" width="6" height="60" fill="white" />
        <Rect x="46" y="10" width="2" height="60" fill="white" />
        <Rect x="52" y="10" width="1" height="60" fill="white" />
        <Rect x="56" y="10" width="4" height="60" fill="white" />
        <Rect x="64" y="10" width="2" height="60" fill="white" />
        <Rect x="70" y="10" width="5" height="60" fill="white" />
        <Rect x="79" y="10" width="1" height="60" fill="white" />
        <Rect x="84" y="10" width="3" height="60" fill="white" />
        <Rect x="91" y="10" width="3" height="60" fill="white" />
        <Rect x="97" y="10" width="6" height="60" fill="white" />
        <Rect x="105" y="10" width="1" height="60" fill="white" />
        <Rect x="109" y="10" width="5" height="60" fill="white" />
        <Rect x="118" y="10" width="3" height="60" fill="white" />
        <Rect x="124" y="10" width="1" height="60" fill="white" />
        <Rect x="128" y="10" width="4" height="60" fill="white" />
        <Rect x="136" y="10" width="2" height="60" fill="white" />
        <Rect x="142" y="10" width="5" height="60" fill="white" />
        <Rect x="151" y="10" width="1" height="60" fill="white" />
        <Rect x="155" y="10" width="3" height="60" fill="white" />
        <Rect x="162" y="10" width="2" height="60" fill="white" />
        <Rect x="168" y="10" width="4" height="60" fill="white" />
        <Rect x="176" y="10" width="1" height="60" fill="white" />
        <Rect x="180" y="10" width="5" height="60" fill="white" />
        <Rect x="189" y="10" width="2" height="60" fill="white" />
        <Rect x="195" y="10" width="1" height="60" fill="white" />
        <Rect x="199" y="10" width="4" height="60" fill="white" />
        <Rect x="207" y="10" width="2" height="60" fill="white" />
        <Rect x="213" y="10" width="6" height="60" fill="white" />
        <Rect x="222" y="10" width="4" height="60" fill="white" />
        <Rect x="229" y="10" width="1" height="60" fill="white" />
        {/* Scan line */}
        <Rect x="5" y="39" width="230" height="7" rx="1" fill="red" />
      </Svg>
    </Card>
  );
};
