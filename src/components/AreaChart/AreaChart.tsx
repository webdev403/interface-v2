import React from 'react';
import { Box } from '@material-ui/core';
import Chart from 'react-apexcharts';
import { useIsDarkMode } from 'state/user/hooks';
import { formatCompact, formatDateFromTimeStamp, formatNumber } from 'utils';
import 'components/styles/AreaChart.scss';
import { Position } from 'v3lib/entities';

export interface AreaChartProps {
  strokeColor?: string;
  backgroundColor?: string;
  gradientColor?: string | undefined;
  data?: Array<any>;
  dates?: Array<any>;
  yAxisValues?: Array<number>;
  categories?: Array<string | null>;
  width?: number | string;
  height?: number | string;
  yAxisTicker?: string | undefined;
}

const AreaChart: React.FC<AreaChartProps> = ({
  strokeColor = '#00dced',
  backgroundColor = '#004ce6',
  gradientColor,
  categories = [],
  data = [],
  dates = [],
  yAxisValues,
  width = 500,
  height = 200,
  yAxisTicker = '$',
}) => {
  const dark = useIsDarkMode();

  const _gradientColor = gradientColor || (dark ? '#64fbd3' : '#D4F8FB');

  const yMax = yAxisValues
    ? Math.max(...yAxisValues.map((val) => Number(val)))
    : 0;
  const yMin = yAxisValues
    ? Math.min(...yAxisValues.map((val) => Number(val)))
    : 0;

  const options = {
    chart: {
      sparkline: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
      width: '100%',
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 1,
      colors: [strokeColor],
      curve: 'straight' as any,
    },
    markers: {
      colors: [strokeColor],
      strokeWidth: 0,
    },
    fill: {
      type: 'gradient',
      colors: ['#2D244A', '#2E3350'],
      // colors: [_gradientColor],
      gradient: {
        gradientToColors: [backgroundColor],
        shadeIntensity: 1,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [100, 100],
      },
    },
    xaxis: {
      categories: categories.map(() => ''),
      axisBorder: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: new Array(categories.length).fill(
            dark ? '#646464' : '#CACED3',
          ),
        },
      },
    },
    yaxis: {
      show: false,
      min: yAxisValues ? yMin : undefined,
      max: yAxisValues ? yMax : undefined,
      tickAmount: yAxisValues?.length,
    },
    grid: {
      show: true,
      borderColor: '#35383F',
      strokeDashArray: 2,
      padding: {
        left: 0,
        right: 0,
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      fixed: {
        enabled: true,
        position: 'topRight'
      },
      theme: dark ? 'dark' : 'light',
      fillSeriesColor: false,
      custom: ({ series, seriesIndex, dataPointIndex }: any) => {
        console.log(series, seriesIndex);

        return `<div class="areaChartTooltip">
        <small>
        
        ${yAxisTicker === '$' ? yAxisTicker : ''}${formatCompact(
          series[0][dataPointIndex]
        )}${`  ::  V3`}
        <br/>
        ${yAxisTicker === '$' ? yAxisTicker : ''}${formatCompact(
          series[1][dataPointIndex],
        )}${`  ::  V2`}
        
        ${yAxisTicker === '%' ? yAxisTicker : ''}
      </b></small></div>`;
      },
    },
  };

  const series = [
    {
      name: 'Prices',
      data,
    },
    {
      name: 'series2',
      data: [
        109511148.4843072,
        113370088.54691145,
        109970728.56533167,
        102080242.86645125,
        109840148.4546114,
        109113786.57517724,
        106422967.00566256,
        107217643.11440271,
        109413875.22109869,
        113093868.35785942,
        113006658.09689197,
        111679925.83221972,
        112455255.96256065,
        112066937.25818029,
        111658875.5353449,
        114023339.91381237,
        112340468.15577659,
        107365559.35197815,
        108180118.53027882,
        109108570.8797974,
        108060862.21907496,
        109887091.9060419,
        111430545.252828,
        114883923.70177002,
        111457597.36599386,
        121023746.42659517,
        122651170.27757907,
        119781332.21643046,
        123072429.13387161,
        120112608.92062685,
        115582663.59049138,
      ],
    },
  ];

  return (
    <Box display='flex' mt={2.5} width={width}>
      <Box className='chartContainer'>
        <Chart
          options={options}
          series={series}
          type='area'
          width='100%'
          height={height}
        />
        <Box className='categoryValues' mt={-5}>
          {categories.map((val, ind) => (
            <p key={ind}>{val}</p>
          ))}
        </Box>
      </Box>
      {/* {yAxisValues && (
        <Box className='yAxis'>
          {yAxisValues.map((value, index) => (
            <p key={index}>
              {// this is to show small numbers less than 0.0001

              `${yAxisTicker === '$' ? yAxisTicker : ''}${
                value > 0.0001 ? formatCompact(value) : formatNumber(value)
              }${yAxisTicker === '%' ? yAxisTicker : ''}`}
            </p>
          ))}
        </Box>
      )} */}
    </Box>
  );
};

export default AreaChart;
