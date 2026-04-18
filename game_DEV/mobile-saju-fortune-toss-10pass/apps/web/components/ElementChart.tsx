'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import type { ElementDistribution } from '@saju/core';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const colors = {
  stems: '#2c6e63',
  branches: '#79a97c',
  hiddenStems: '#c6a15b',
};

interface ElementChartProps {
  distribution: ElementDistribution;
  title?: string;
}

export default function ElementChart({ distribution, title = '오행 분포' }: ElementChartProps): React.JSX.Element {
  const labels = Object.keys(distribution.counts) as Array<keyof typeof distribution.counts>;

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    aria: {
      enabled: true,
      decal: { show: true },
    },
    title: {
      text: `${title} (${distribution.currentModel})`,
      left: 8,
      top: 8,
      textStyle: {
        color: '#334155',
        fontSize: 14,
        fontWeight: 700,
      },
    },
    grid: {
      left: 30,
      right: 12,
      top: 42,
      bottom: 24,
    },
    legend: {
      top: 18,
      right: 10,
      textStyle: {
        color: '#475569',
      },
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#9ca3af' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e5e7eb' } },
    },
    series: [
      {
        name: '천간',
        type: 'bar',
        stack: 'total',
        data: labels.map((label) => distribution.breakdown.stems[label]),
        itemStyle: { color: colors.stems },
      },
      {
        name: '지지',
        type: 'bar',
        stack: 'total',
        data: labels.map((label) =>
          distribution.currentModel === 'stems_only' ? 0 : distribution.breakdown.branches[label],
        ),
        itemStyle: { color: colors.branches },
      },
      {
        name: '지장간',
        type: 'bar',
        stack: 'total',
        data: labels.map((label) =>
          distribution.currentModel === 'stems_branches_hidden'
            ? distribution.breakdown.hiddenStems[label]
            : 0,
        ),
        itemStyle: { color: colors.hiddenStems },
      },
    ],
    tooltip: {
      trigger: 'axis',
    },
  };

  return <ReactECharts option={option} style={{ height: 280, width: '100%' }} notMerge />;
}
