import Svg, { Path } from "react-native-svg";

export const BarcodeFrame = () => {
  return (
    <Svg width="280" height="160" viewBox="0 0 280 160">
      {/* Top-left */}
      <Path
        d="M 28 55 L 28 28 L 55 28"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Top-right */}
      <Path
        d="M 225 28 L 252 28 L 252 55"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bottom-left */}
      <Path
        d="M 28 105 L 28 132 L 55 132"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bottom-right */}
      <Path
        d="M 225 132 L 252 132 L 252 105"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
