'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useBeachData } from '@/context/BeachDataContext';
import { useChartHover } from '@/context/ChartHoverContext';
import { useTheme } from '@/context/ThemeContext';
import { Tooltip, TooltipContent } from './Tooltip';
import { WindMap } from './WindMap';
import { WindVisualizationProps, WindTooltipData, StormGlassDataPoint } from '@/types/data';
import { getCompassDirection } from '@/utils/swellUtils';

export const WindVisualization: React.FC<WindVisualizationProps> = ({
  width = 1400,
  height = 200,
}) => {
  const { beachData } = useBeachData();
  const { hoveredTime, setHoveredTime, currentDayIndex, setCurrentDayIndex, isMobile, setIsMobile, uniqueDays, setUniqueDays } = useChartHover();
  const theme = useTheme();
  const stormGlassData = beachData?.stormGlassData ?? [];
  const windChartRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<WindTooltipData | null>(null);

  const margin = { top: 20, right: 35, bottom: 70, left: 12 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get unique days from data and sync with context
  const localUniqueDays = React.useMemo(() => {
    const days = [...new Set(stormGlassData.map(d => 
      new Date(d.date_time).toISOString().split('T')[0]
    ))].sort();
    return days;
  }, [stormGlassData]);

  // Sync unique days with context
  useEffect(() => {
    setUniqueDays(localUniqueDays);
  }, [localUniqueDays, setUniqueDays]);

  // Get data for current day
  const currentDayData = React.useMemo(() => {
    if (!uniqueDays.length || currentDayIndex >= uniqueDays.length) return stormGlassData;
    
    const currentDay = uniqueDays[currentDayIndex];
    return stormGlassData.filter(d => 
      new Date(d.date_time).toISOString().split('T')[0] === currentDay
    );
  }, [stormGlassData, uniqueDays, currentDayIndex]);

  // Get the data to display based on mobile state
  const displayData = React.useMemo(() => {
    return isMobile ? currentDayData : stormGlassData;
  }, [isMobile, currentDayData, stormGlassData]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Reset to first day when data changes
  useEffect(() => {
    setCurrentDayIndex(0);
  }, [uniqueDays, setCurrentDayIndex]);

  useEffect(() => {
    if (!stormGlassData.length || !windChartRef.current) return;

    // Clear existing SVG content
    d3.select(windChartRef.current).selectAll('*').remove();

    // Create tooltip div
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('border', '1px solid #ddd')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    // Create SVG container
    const windSvg = d3.select(windChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create time scale
    const xScale = d3.scaleTime()
      .domain(d3.extent(displayData, d => new Date(d.date_time)) as [Date, Date])
      .range([0, chartWidth]);

    // Create x-axis with different tick formatting for mobile
    const xAxis = d3.axisBottom(xScale)
      .ticks(isMobile ? d3.timeHour.every(2) : d3.timeHour.every(3))
      .tickFormat((domainValue: Date | d3.NumberValue) => {
        if (domainValue instanceof Date) {
          return isMobile ? d3.timeFormat('%I%p')(domainValue) : d3.timeFormat('%I')(domainValue);
        }
        return '';
      });

    // Add x-axis
    windSvg.append('g')
      .attr('transform', `translate(0,${chartHeight + margin.bottom / 2})`)
      .call(xAxis)
      .selectAll('text')
      .attr('y', 6)
      .attr('x', 6)
      .style('text-anchor', 'start')
      .style('color', theme.chartText)
      .style('font-weight', 'bold')
      .style('font-size', isMobile ? '10px' : '12px');

    // Remove tick lines
    windSvg.selectAll('.tick line').attr('stroke', 'none');
    windSvg.selectAll('path,line').remove();

    // Add day separators (only for desktop when showing all data)
    if (!isMobile) {
      const uniqueDates = [...new Set(stormGlassData.map(d => 
        new Date(d.date_time).toISOString().split('T')[0]
      ))];

      uniqueDates.forEach(dateStr => {
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        windSvg.append('line')
          .attr('x1', xScale(startOfDay) - 3)
          .attr('y1', 0)
          .attr('x2', xScale(startOfDay) - 3)
          .attr('y2', chartHeight - 3.75)
          .attr('stroke', theme.chartGrid)
          .attr('stroke-width', 1);

        // Add night shadows
        const shadowStart = new Date(dateStr);
        shadowStart.setHours(17, 0, 0);
        const shadowEnd = new Date(shadowStart);
        shadowEnd.setDate(shadowEnd.getDate() + 1);
        shadowEnd.setHours(6, 0, 0);

        windSvg.append('rect')
          .attr('class', 'shadow')
          .attr('x', xScale(shadowStart))
          .attr('y', 0)
          .attr('width', xScale(shadowEnd) - xScale(shadowStart))
          .attr('height', chartHeight)
          .style('fill', theme.chartShadow)
          .style('pointer-events', 'none');
      });
    } else {
      // For mobile, add night shadow for current day only
      const currentDay = uniqueDays[currentDayIndex];
      if (currentDay) {
        const shadowStart = new Date(currentDay);
        shadowStart.setHours(17, 0, 0);
        const shadowEnd = new Date(shadowStart);
        shadowEnd.setDate(shadowEnd.getDate() + 1);
        shadowEnd.setHours(6, 0, 0);

        windSvg.append('rect')
          .attr('class', 'shadow')
          .attr('x', xScale(shadowStart))
          .attr('y', 0)
          .attr('width', xScale(shadowEnd) - xScale(shadowStart))
          .attr('height', chartHeight)
          .style('fill', theme.chartShadow)
          .style('pointer-events', 'none');
      }
    }

    // Add current time indicator
    const now = new Date();
    const currentHour = now.getHours();
    const uniqueHours = [...new Set(displayData.map(d => 
      new Date(d.date_time).getHours()
    ))];

    if (uniqueHours.includes(currentHour)) {
      const currentHourDate = new Date();
      currentHourDate.setHours(currentHour, 0, 0, 0);

      windSvg.append('line')
        .attr('x1', xScale(currentHourDate))
        .attr('y1', 0)
        .attr('x2', xScale(currentHourDate))
        .attr('y2', chartHeight - 3.75)
        .attr('stroke', theme.chartLine)
        .attr('stroke-width', 2);

      windSvg.append('text')
        .attr('x', xScale(currentHourDate))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .text('Now')
        .attr('font-size', isMobile ? '10px' : '12px')
        .attr('fill', theme.chartText)
        .style('font-weight', 'bold');
    }

    // Implement wind chart
    const windYScale = d3.scaleLinear()
      .domain([0, d3.max(displayData, d => d.wind_speed) as number])
      .nice()
      .range([chartHeight, 0]);

    const barWidth = chartWidth / displayData.length - 5;

    // Add interactive overlay
    windSvg.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseenter', () => {
        windSvg.select('.hover-line')?.style('display', null);
      })
      .on('mouseleave', () => {
        windSvg.select('.hover-line')?.style('display', 'none');
        setTooltipData(null);
      })
      .on('mousemove', (event) => {
        const [x] = d3.pointer(event);
        const x0 = xScale.invert(x);
        const bisect = d3.bisector((d: StormGlassDataPoint) => new Date(d.date_time).getTime()).left;
        const i = bisect(displayData, x0, 1);
        const d0 = displayData[i - 1];
        const d1 = displayData[i];
        const d = x0.getTime() - new Date(d0.date_time).getTime() > new Date(d1.date_time).getTime() - x0.getTime() ? d1 : d0;

        // Update hover line
        windSvg.select('.hover-line')
          ?.attr('x1', xScale(new Date(d.date_time)))
          .attr('x2', xScale(new Date(d.date_time)))
          .attr('y1', 0)
          .attr('y2', chartHeight);

        // Update hovered time in context
        setHoveredTime(new Date(d.date_time));

        // Update tooltip position relative to chart - use consistent positioning
        const barX = xScale(new Date(d.date_time)) + margin.left + 40;
        const barY = (chartHeight / 20) * 3.25 + margin.top + 740;

        setTooltipData({
          windSpeed: d.wind_speed,
          windDirection: d.wind_direction,
          gust: d.gust,
          dateTime: d.date_time,
          x: barX,
          y: barY
        });
      });

    // Add hover line
    windSvg.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', theme.chartHover)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    // Add wind bars with data-time attribute - show all bars
    windSvg.selectAll('.wind-bar')
      .data(displayData)  // Show all data points for bars
      .enter()
      .append('rect')
      .attr('class', 'wind-bar')
      .attr('data-time', d => d.date_time)
      .attr('x', d => xScale(new Date(d.date_time)))
      .attr('width', barWidth)  // Keep original bar width
      .attr('y', d => windYScale(d.wind_speed) * 0.3)
      .attr('height', d => (chartHeight - windYScale(d.wind_speed)) * 0.3)
      .attr('transform', 'translate(0,40)')
      .attr('fill', theme.chartArea);

    // Add wind direction arrows - only show for 3-hour intervals
    windSvg.selectAll('.wind-arrow')
      .data(displayData.filter((_, i) => i % 3 === 0))  // Only show every 3rd data point
      .enter()
      .append('path')
      .attr('class', 'wind-arrow')
      .attr('d', 'M12 2L4 12h6v8h4v-8h6L12 2z')
      .attr('width', 15)
      .attr('height', 15)
      .attr('transform', d => {
        const x = xScale(new Date(d.date_time)) + barWidth / 2;
        const y = (chartHeight / 4) * 3.25;
        return `translate(${x - 7.5},${y - 7.5}) scale(0.625) rotate(${d.wind_direction}, 12, 12)`;
      })
      .attr('fill', theme.chartLine);

    // Add wind speed labels - only show for 3-hour intervals
    windSvg.selectAll('.wind-speed-label')
      .data(displayData.filter((_, i) => i % 3 === 0))  // Only show every 3rd data point
      .enter()
      .append('text')
      .attr('class', 'wind-speed-label')
      .attr('x', d => xScale(new Date(d.date_time)) + barWidth / 2)
      .attr('y', (chartHeight / 4) * 3.25 + 30)
      .attr('text-anchor', 'middle')
      .text(d => Math.round(d.wind_speed))
      .attr('font-size', '11px')
      .attr('fill', theme.chartText)
      .style('font-weight', 'bold');

    // Add gust labels - only show for 3-hour intervals
    windSvg.selectAll('.gust-label')
      .data(displayData.filter((_, i) => i % 3 === 0))  // Only show every 3rd data point
      .enter()
      .append('text')
      .attr('class', 'gust-label')
      .attr('x', d => xScale(new Date(d.date_time)) + barWidth / 2)
      .attr('y', (chartHeight / 4) * 3.85 + 30)
      .attr('text-anchor', 'middle')
      .text(d => Math.round(d.gust))
      .attr('font-size', '11px')
      .attr('fill', theme.chartText);

    return () => {
      tooltip.remove();
      windSvg.select('.hover-line')?.remove();
    };
  }, [width, height, stormGlassData, margin.left, margin.top, margin.bottom, chartWidth, chartHeight, setHoveredTime, theme, isMobile, uniqueDays, currentDayIndex, currentDayData, displayData]);

  // Add effect to respond to hoveredTime changes from other charts
  useEffect(() => {
    if (!windChartRef.current || !hoveredTime) return;

    const windSvg = d3.select(windChartRef.current).select('g');
    const xScale = d3.scaleTime()
      .domain(d3.extent(stormGlassData, d => new Date(d.date_time)) as [Date, Date])
      .range([0, chartWidth]);

    // Update hover line
    windSvg.select('.hover-line')
      ?.style('display', null)
      .attr('x1', xScale(hoveredTime))
      .attr('x2', xScale(hoveredTime))
      .attr('y1', 0)
      .attr('y2', chartHeight);

    const hoveredData = stormGlassData.find(d => 
      new Date(d.date_time).getTime() === hoveredTime.getTime()
    );

    if (hoveredData) {
      // Update tooltip position relative to chart - use same positioning logic as mousemove
      const barX = xScale(hoveredTime) + margin.left + 240;
      const barY = (chartHeight / 20) * 3.25 + margin.top + 600;

      setTooltipData({
        windSpeed: hoveredData.wind_speed,
        windDirection: hoveredData.wind_direction,
        gust: hoveredData.gust,
        dateTime: hoveredData.date_time,
        x: barX,
        y: barY
      });
    }
  }, [hoveredTime, stormGlassData, chartWidth, chartHeight, margin.left, margin.top]);

  return (
    <>
      {/* Mobile tooltip - show by default */}
      {isMobile && (
        <div className="w-full bg-white p-4">
          <div className="flex flex-row space-x-8">
            <div className="flex flex-col justify-center items-start pr-6 min-w-[160px]">
              <div className="flex items-center text-lg py-2 font-semibold whitespace-nowrap flex-col space-y-2">
                <span className="w-12 flex-shrink-0 mr-auto ml-5 text-gray-400 justify-start">Wind</span>
                <div className="flex flex-row space-x-4">
                  <span className="w-16 text-right font-bold">
                    {tooltipData?.windSpeed !== null && tooltipData?.windSpeed !== undefined ? tooltipData.windSpeed.toFixed(0) : '-'}kph
                  </span>
                  <span className="w-12 text-right font-bold">
                    {tooltipData?.windDirection !== null && tooltipData?.windDirection !== undefined ? getCompassDirection(tooltipData.windDirection) : '-'}
                  </span>
                </div>
                <div className="flex flex-row space-x-4">
                  <span className="w-16 text-right font-bold">
                    {tooltipData?.gust !== null && tooltipData?.gust !== undefined ? tooltipData.gust.toFixed(0) : '-'}kph
                  </span>
                  <span className="w-12 text-right font-bold text-gray-500">gust</span>
                </div>
              </div>
            </div>
            <WindMap width={100} height={100} />
          </div>
        </div>
      )}

      {/* Desktop tooltip - only show when tooltipData exists */}
      {!isMobile && tooltipData && (
        <Tooltip x={tooltipData.x} y={tooltipData.y}>
          <TooltipContent>
            <div className="flex flex-row space-x-2">
              <div className="flex flex-col space-x-2">
                <div className="font-bold">Wind</div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: `rotate(${tooltipData.windDirection}deg)` }}>
                    <path d="M12 2L4 12h6v8h4v-8h6L12 2z" fill="currentColor" />
                  </svg>
                  <div>{tooltipData.windSpeed.toFixed(0)}kph {getCompassDirection(tooltipData.windDirection)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: `rotate(${tooltipData.windDirection}deg)` }}>
                    <path d="M12 2L4 12h6v8h4v-8h6L12 2z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <div>{tooltipData.gust.toFixed(0)}kph gust</div>
                </div>
              </div>
              <div> 
                <WindMap width={100} height={100} />
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      <div className="space-y-4 relative">
        <div className="relative w-full bg-gradient-to-br from-gray-1 to-gray-2 overflow-hidden">
          <div id="windChart" className="w-full">
            <svg ref={windChartRef} className="w-full" style={{ backgroundColor: theme.chartBackground }} />
          </div>
        </div>
      </div>
    </>
  );
}; 