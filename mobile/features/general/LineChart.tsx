import { useEffect, useState } from "react";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

type LineChartProps = {
  data: number[];
  labels: string[];

  width?: number;
  height?: number;

  lineColor?: string;
  pointColor?: string;
  gridColor?: string;
  labelColor?: string;

  yTickCount?: number;
  yPaddingPercent?: number;

  minY?: number;
  maxY?: number;

  fontYSize?: number;
  fontXSize?: number;

  formatYLabel?: (value: number) => string;
  formatYLabelBadge?: (value: number) => string;
  formatXLabel?: (label: string) => string;
};

function createLinePath(
  values: number[],
  width: number,
  height: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number,
  paddingBottom: number,
  min: number,
  range: number,
) {
  const stepX =
    values.length > 1
      ? (width - paddingLeft - paddingRight) / (values.length - 1)
      : 0;

  return values
    .map((value, i) => {
      const x = paddingLeft + i * stepX;

      const y =
        height -
        paddingBottom -
        ((value - min) / range) * (height - paddingTop - paddingBottom);

      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export const LineChart = ({
  data,
  labels,
  width = 350,
  height = 220,
  lineColor = "#7C5CFC",
  pointColor = "#7C5CFC",
  gridColor = "#2A2A2A",
  labelColor = "#8A8A8A",
  yTickCount = 8,
  yPaddingPercent = 0.15,
  fontYSize = 11,
  fontXSize = 11,
  minY,
  maxY,
  formatYLabel = (v) => v.toFixed(1),
  formatYLabelBadge = (v) => v.toFixed(1),
  formatXLabel = (v) => v,
}: LineChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const actualMin = Math.min(...data);
  const actualMax = Math.max(...data);

  const computedMin =
    minY ??
    Math.max(
      actualMin - Math.max(actualMax - actualMin, 1) * yPaddingPercent,
      0,
    );

  const computedMax =
    maxY ?? actualMax + Math.max(actualMax - actualMin, 1) * yPaddingPercent;

  const range = Math.max(computedMax - computedMin, 1);

  const yPadding = range * 0.15;

  const min = Math.max(actualMin - yPadding, 0);
  const max = actualMax + yPadding;

  const paddingLeft = 42;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const stepX = (width - paddingLeft - paddingRight) / (data.length - 1);

  const path = createLinePath(
    data,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    min,
    range,
  );

  const yLabels = Array.from({ length: yTickCount }, (_, i) => {
    const value = max - (range * i) / (yTickCount - 1);

    const y =
      paddingTop +
      (i / (yTickCount - 1)) * (height - paddingTop - paddingBottom);

    return {
      value,
      y,
    };
  });

  const updateSelection = (touchX: number) => {
    if (data.length < 2) return;

    const chartWidth = width - paddingLeft - paddingRight;

    const relativeX = Math.min(Math.max(touchX - paddingLeft, 0), chartWidth);

    const index = Math.round(relativeX / stepX);

    setSelectedIndex(Math.max(0, Math.min(index, data.length - 1)));
  };

  const chartGesture = Gesture.Pan()
    .activateAfterLongPress(100)
    .onBegin((e) => {
      const x = e.x;
      scheduleOnRN(updateSelection, x);
    })
    .onUpdate((e) => {
      const x = e.x;
      scheduleOnRN(updateSelection, x);
    })
    .onEnd(() => {
      scheduleOnRN(setSelectedIndex, null);
    });

  useEffect(() => {
    setSelectedIndex(null);
  }, [data, labels]);

  return (
    <GestureDetector gesture={chartGesture}>
      <Svg width={width} height={height}>
        {/* Grid + Y labels */}
        {yLabels.map(({ value, y }, index) => (
          <G key={`grid-${index}`}>
            <Line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
            />

            <SvgText
              key={`label-${index}`}
              x={paddingLeft - 8}
              y={y + 4}
              fill={labelColor}
              fontSize={fontYSize}
              textAnchor="end"
              fontFamily="Seenonim"
            >
              {formatYLabel(Number(value.toFixed(1)))}
            </SvgText>
          </G>
        ))}
        {/* X labels */}
        {labels.map((label, i) => {
          const x = paddingLeft + i * stepX;

          return (
            <SvgText
              key={label}
              x={x}
              y={height - 6}
              fill="#8A8A8A"
              fontSize={fontXSize}
              textAnchor="middle"
              fontFamily="Seenonim"
            >
              {formatXLabel(label)}
            </SvgText>
          );
        })}
        {/* Line */}
        <Path
          d={path}
          stroke={lineColor}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {data.map((value, i) => {
          const x = paddingLeft + i * stepX;

          const y =
            height -
            paddingBottom -
            ((value - min) / range) * (height - paddingTop - paddingBottom);

          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={selectedIndex === i ? 7 : 4}
              stroke="white"
              strokeWidth={selectedIndex === i ? 2 : 0}
              fill={pointColor}
            />
          );
        })}
        {/* Vertical guide */}
        {selectedIndex !== null &&
          selectedIndex < data.length &&
          selectedIndex < labels.length && (
            <Line
              x1={paddingLeft + selectedIndex * stepX}
              x2={paddingLeft + selectedIndex * stepX}
              y1={paddingTop}
              y2={height - paddingBottom}
              stroke="#666"
              strokeDasharray="4 4"
            />
          )}
        {selectedIndex !== null &&
          (() => {
            const value = data[selectedIndex];

            const x = paddingLeft + selectedIndex * stepX;

            const y =
              height -
              paddingBottom -
              ((value - min) / range) * (height - paddingTop - paddingBottom);

            return (
              <>
                {/* tooltip background */}
                <Rect
                  x={x - 35}
                  y={Math.max(0, y - 45)}
                  rx={8}
                  ry={8}
                  width={70}
                  height={32}
                  fill="#1F1F1F"
                />
                <SvgText
                  x={x}
                  y={y - 25}
                  fill="white"
                  fontSize={fontYSize}
                  fontFamily="Seenonim"
                  textAnchor="middle"
                >
                  {formatYLabelBadge(value)}
                </SvgText>
              </>
            );
          })()}
      </Svg>
    </GestureDetector>
  );
};
