import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

import colors from '../utils/colors';
import { MONTHS } from '../utils/helpers';

// points: [{ date: ISO string, value: number }] sorted oldest -> newest
const LineChart = ({ points, height = 160, format = (v) => String(v), color = colors.primary }) => {
  const [width, setWidth] = useState(0);

  if (!points?.length) return null;

  const padX = 12;
  const padTop = 16;
  const padBottom = 22;
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const innerW = Math.max(1, width - padX * 2);
  const innerH = height - padTop - padBottom;
  const x = (i) => padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => padTop + (1 - (v - min) / (max - min)) * innerH;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${padTop + innerH} L${x(0).toFixed(1)},${padTop + innerH} Z`;

  const label = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };

  const last = points[points.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.legend}>
        <Text style={styles.legendText}>min {format(Math.min(...values))}</Text>
        <Text style={styles.legendText}>maks {format(Math.max(...values))}</Text>
      </View>
      {width ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.28" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {[0, 0.5, 1].map((t) => (
            <Line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={padTop + t * innerH}
              y2={padTop + t * innerH}
              stroke={colors.border}
              strokeDasharray="4 6"
            />
          ))}
          {points.length > 1 ? <Path d={area} fill="url(#area)" /> : null}
          <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <Circle
              key={`${p.date}-${i}`}
              cx={x(i)}
              cy={y(p.value)}
              r={i === points.length - 1 ? 5 : 3}
              fill={i === points.length - 1 ? color : colors.surface}
              stroke={color}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.axis}>
        <Text style={styles.axisText}>{label(points[0].date)}</Text>
        <Text style={[styles.axisText, { color }]}>
          {format(last.value)} · {label(last.date)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -14,
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default LineChart;
