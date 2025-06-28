'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useBeachData } from '@/context/BeachDataContext';
import { useChartHover } from '@/context/ChartHoverContext';
import { useTheme } from '@/context/ThemeContext';
import { StormGlassDetails } from '@/types/beach';
import * as d3 from 'd3';
import dynamic from 'next/dynamic';
import { Tooltip, TooltipContent } from './Tooltip';
import {calculateRating, getCompassDirection } from '@/utils/swellUtils'
import {Rating, SwellTooltipData, SwellVisualizationProps, ratingColors} from '@/types/data'

// Update rating colors to use the ratingColors mapping
const getRatingColor = (rating: Rating) => {
  return ratingColors[rating];
};

export const SwellVisualization: React.FC<SwellVisualizationProps> = ({
  width = 1400,
  height = 200,
}) => {
  const { beachData } = useBeachData();
  const { hoveredTime, setHoveredTime, currentDayIndex, isMobile, uniqueDays } = useChartHover();
  const theme = useTheme();
  const stormGlassData = beachData?.stormGlassData ?? [];
  const swellChartRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<SwellTooltipData | null>(null);
  const lastTooltipPosition = useRef<{ x: number; y: number } | null>(null);
  const updateTooltipPositionRef = useRef<((date: Date, data: StormGlassDetails) => void) | null>(null);

  const margin = { top: 0, right: 10, bottom: 50, left: 10 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

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

  useEffect(() => {
    if (!displayData.length || !swellChartRef.current) return;

    // Clear existing SVG content
    d3.select(swellChartRef.current).selectAll('*').remove();
    lastTooltipPosition.current = null;

    const swellSvg = d3.select(swellChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(displayData, d => new Date(d.date_time)) as [Date, Date])
      .range([0, chartWidth]);

    const updateTooltipPosition = (date: Date, data: StormGlassDetails) => {
      const tooltipX = xScale(date) + margin.left + 400;
      const tooltipY = chartHeight / 2 + margin.top + 70;

      if (lastTooltipPosition.current) {
        const smoothingFactor = 0.3;
        const smoothedX = lastTooltipPosition.current.x + (tooltipX - lastTooltipPosition.current.x) * smoothingFactor;
        const smoothedY = lastTooltipPosition.current.y + (tooltipY - lastTooltipPosition.current.y) * smoothingFactor ;
        
        setTooltipData({
          waveHeight: data.wave_height,
          windSpeed: data.wind_speed,
          windDirection: data.wind_direction,
          waveDirection: data.wave_direction,
          dateTime: data.date_time,
          x: smoothedX,
          y: smoothedY,
          swellHeight: data.swell_height,
          swellDirection: data.swell_direction,
          swellPeriod: data.swell_period,
          secondarySwellHeight: data.secondary_swell_height,
          secondarySwellDirection: data.secondary_swell_direction,
          secondarySwellPeriod: data.secondary_swell_period,
          wavePeriod: data.wave_period,
          windWaveHeight: data.wind_wave_height,
          windWavePeriod: data.wind_wave_period
        });

        lastTooltipPosition.current = { x: smoothedX, y: smoothedY };
      } else {
        // First position, no smoothing needed
        setTooltipData({
          waveHeight: data.wave_height,
          windSpeed: data.wind_speed,
          windDirection: data.wind_direction,
          waveDirection: data.wave_direction,
          dateTime: data.date_time,
          x: tooltipX,
          y: tooltipY,
          swellHeight: data.swell_height,
          swellDirection: data.swell_direction,
          swellPeriod: data.swell_period,
          secondarySwellHeight: data.secondary_swell_height,
          secondarySwellDirection: data.secondary_swell_direction,
          secondarySwellPeriod: data.secondary_swell_period,
          wavePeriod: data.wave_period,
          windWaveHeight: data.wind_wave_height,
          windWavePeriod: data.wind_wave_period
        });

        lastTooltipPosition.current = { x: tooltipX, y: tooltipY };
      }
    };

    updateTooltipPositionRef.current = updateTooltipPosition;

    const xAxis = d3.axisBottom(xScale)
      .ticks(isMobile ? d3.timeHour.every(2) : d3.timeHour.every(3))
      .tickFormat((domainValue: Date | d3.NumberValue) => {
        if (domainValue instanceof Date) {
          return isMobile ? d3.timeFormat('%I%p')(domainValue) : d3.timeFormat('%I')(domainValue);
        }
        return '';
      });

    swellSvg.append('g')
      .attr('transform', `translate(0,${chartHeight + margin.bottom / 2})`)
      .call(xAxis)
      .selectAll('text')
      .attr('y', 6)
      .attr('x', 6)
      .style('text-anchor', 'start')
      .style('color', theme.chartText)
      .style('font-size', isMobile ? '10px' : '12px');

    // Remove tick lines
    swellSvg.selectAll('.tick line').attr('stroke', 'none');
    swellSvg.selectAll('path,line').remove();

    // Add day separators (only for desktop when showing all data)
    if (!isMobile) {
      const uniqueDates = [...new Set(stormGlassData.map(d => 
        new Date(d.date_time).toISOString().split('T')[0]
      ))];

      uniqueDates.forEach(dateStr => {
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        swellSvg.append('line')
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

        swellSvg.append('rect')
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

        swellSvg.append('rect')
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

      swellSvg.append('line')
        .attr('x1', xScale(currentHourDate))
        .attr('y1', 0)
        .attr('x2', xScale(currentHourDate))
        .attr('y2', chartHeight - 3.75)
        .attr('stroke', theme.chartLine)
        .attr('stroke-width', 2);

      swellSvg.append('text')
        .attr('x', xScale(currentHourDate))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .text('Now')
        .attr('font-size', isMobile ? '10px' : '12px')
        .attr('fill', theme.chartText)
        .style('font-weight', 'bold');
    }

    // Implement swell chart
    const swellYScale = d3.scaleLinear()
      .domain([0, d3.max(displayData, d => d.wave_height) as number * 1.1])
      .nice()
      .range([chartHeight, 0]);

    const barWidth = chartWidth / displayData.length - 5;

    // Add interactive overlay for hover
    swellSvg.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseenter', () => {
        swellSvg.select('.hover-line')?.style('display', null);
      })
      .on('mousemove', (event) => {
        const [x] = d3.pointer(event);
        const x0 = xScale.invert(x);
        const bisect = d3.bisector((d: StormGlassDetails) => new Date(d.date_time).getTime()).left;
        const i = bisect(displayData, x0, 1);
        const d0 = displayData[i - 1];
        const d1 = displayData[i];
        const d = x0.getTime() - new Date(d0.date_time).getTime() > new Date(d1.date_time).getTime() - x0.getTime() ? d1 : d0;

        // Update hover line
        swellSvg.select('.hover-line')
          ?.attr('x1', xScale(new Date(d.date_time)))
          .attr('x2', xScale(new Date(d.date_time)))
          .attr('y1', 0)
          .attr('y2', chartHeight);

        // Update hovered time in context
        setHoveredTime(new Date(d.date_time));

        // Update tooltip with smoothing
        updateTooltipPosition(new Date(d.date_time), d);

        // Update bar colors
        d3.selectAll('.swell-bar')
          .attr('fill', theme.chartArea);
        
        d3.select(`.swell-bar[data-time="${d.date_time}"]`)
          .attr('fill', theme.chartHighlight);
      });

    // Add hover line
    swellSvg.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', theme.chartHover)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    // Add swell bars with data-time attribute
    swellSvg.selectAll('.swell-bar')
      .data(displayData)
      .enter()
      .append('rect')
      .attr('class', 'swell-bar')
      .attr('data-time', d => d.date_time)
      .attr('x', d => xScale(new Date(d.date_time)))
      .attr('width', barWidth)
      .attr('y', d => swellYScale(d.wave_height) * 0.7 + 45)
      .attr('height', d => (chartHeight - swellYScale(d.wave_height)) * 0.7)
      .attr('fill', theme.chartArea);

    // Add horizontal rating bars at the bottom
    const gapWidth = 3; // Width of the gap between bars

    // Create a group for rating bars to manage z-index
    const ratingBarsGroup = swellSvg.append('g')
      .attr('class', 'rating-bars-group')
      .style('pointer-events', 'none'); // Prevent interference with other interactions

    ratingBarsGroup
      .selectAll('.rating-bar')
      .data(displayData)
      .enter()
      .append('rect')
      .attr('class', 'rating-bar')
      .attr('x', d => xScale(new Date(d.date_time)))
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', 9)
      .attr('fill', d => getRatingColor(calculateRating(d.wave_height, d.wind_speed, d.wind_direction, d.wave_direction)))
      .attr('x', d => xScale(new Date(d.date_time)))
      .attr('height', 9)
      .attr('width', (d, i) => {
        // Get the current and next date
        const currentDate = new Date(d.date_time);
        const nextDate = i < displayData.length - 1 ? new Date(displayData[i + 1].date_time) : null;

        const currentRating = calculateRating(d.wave_height, d.wind_speed, d.wind_direction, d.wave_direction);
        const previousRating = i !== 0 ? calculateRating(
          displayData[i - 1].wave_height,
          displayData[i - 1].wind_speed,
          displayData[i - 1].wind_direction,
          displayData[i - 1].wave_direction
        ) : null;

        const colorGap = currentRating === previousRating ? 1.5 : 0;

        if (!nextDate) {
          // Handle the case where currentDate is the last date
          return xScale(currentDate) / 25;
        }

        // Check if the next date is at midnight and add gap if true
        if (nextDate && currentDate.getHours() === 23 && nextDate.getHours() === 0) {
          return xScale(nextDate) - xScale(currentDate) - gapWidth;
        } else {
          return xScale(nextDate) - xScale(currentDate) - colorGap;
        }
      })
      .attr('transform', `translate(0,${chartHeight + margin.bottom - 5})`); // Moved from -15 to -5 to position bars lower

    // Move the rating bars group to the back
    ratingBarsGroup.lower();

    return () => {
      swellSvg.select('.hover-line')?.remove();
      updateTooltipPositionRef.current = null;
    };
  }, [width, height, displayData, margin.left, margin.top, margin.bottom, chartWidth, chartHeight, setHoveredTime, theme, isMobile, stormGlassData, uniqueDays, currentDayIndex]);

  // Update the hoveredTime effect
  useEffect(() => {
    if (!swellChartRef.current || !hoveredTime || !updateTooltipPositionRef.current) return;

    const swellSvg = d3.select(swellChartRef.current).select('g');
    const xScale = d3.scaleTime()
      .domain(d3.extent(displayData, d => new Date(d.date_time)) as [Date, Date])
      .range([0, chartWidth]);

    // Update hover line
    swellSvg.select('.hover-line')
      ?.style('display', null)
      .attr('x1', xScale(hoveredTime))
      .attr('x2', xScale(hoveredTime))
      .attr('y1', 0)
      .attr('y2', chartHeight);

    // Update bar colors
    d3.selectAll('.swell-bar')
      .attr('fill', theme.chartArea);
    
    const hoveredData = displayData.find(d => 
      new Date(d.date_time).getTime() === hoveredTime.getTime()
    ) as StormGlassDetails | undefined;

    if (hoveredData) {
      // Use the stored update function
      updateTooltipPositionRef.current(hoveredTime, hoveredData);
    }
  }, [hoveredTime, displayData, chartWidth, chartHeight, margin.left, margin.top, theme]);

  return (
    <>
      {/* Mobile tooltip - show by default */}
      {isMobile && (
        <div className="w-full bg-white">
          <div className="flex flex-row space-x-4">
            <div className="flex flex-col justify-center items-start border-r border-gray-200 px-1">
              {(() => {
                const row = {
                  label: 'Total',
                  height: tooltipData?.waveHeight,
                  period: tooltipData?.wavePeriod,
                  direction: tooltipData?.waveDirection,
                };
                return (
                  <div key={row.label} className="flex items-center text-lg py-1 font-semibold whitespace-nowrap flex-row">
                    <div className="flex flex-col space-x-1">
                      <span className="text-right font-bold">
                        {row.height !== null && row.height !== undefined ? (row.height * 3.281).toFixed(1) : '-'}ft
                      </span>
                      <span className="text-right font-bold">
                        {row.period !== null && row.period !== undefined ? row.period.toFixed(0) : '-'}s
                      </span>
                      <span className="flex items-center justify-end font-bold">
                        {row.direction !== null && row.direction !== undefined ? (
                          <>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 16 16"
                              style={{ transform: `rotate(${row.direction}deg)` }}
                              className="inline-block mx-1"
                            >
                              <polygon points="8,2 14,14 8,11 2,14" fill="#333" />
                            </svg>
                            <span className="ml-1">{getCompassDirection(row.direction)} {Math.round(row.direction)}°</span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col justify-center flex-1 space-y-1 text-sm">
              {[
                {
                  label: 'Swell',
                  height: tooltipData?.swellHeight,
                  period: tooltipData?.swellPeriod,
                  direction: tooltipData?.swellDirection,
                },
                {
                  label: 'Secondary',
                  height: tooltipData?.secondarySwellHeight,
                  period: tooltipData?.secondarySwellPeriod,
                  direction: tooltipData?.secondarySwellDirection,
                },
                {
                  label: 'Wind Wave',
                  height: tooltipData?.windWaveHeight,
                  period: tooltipData?.windWavePeriod,
                  direction: null, // Wind wave direction not shown in original
                },
              ].map((row, index) => (
                <div key={`${row.label}-${index}`} className="flex items-center justify-between py-1 whitespace-nowrap text-sm">
                  {/* Label */}
                  <span className="w-12 flex-shrink-0 mr-2 text-gray-400">{row.label}</span>
                  {/* Height */}
                  <span className="w-14 text-right font-medium">
                    {row.height !== null && row.height !== undefined ? (row.height * 3.281).toFixed(1) : '-'}ft
                  </span>
                  {/* Period */}
                  <span className="w-10 text-right font-medium">
                    {row.period !== null && row.period !== undefined ? row.period.toFixed(0) : '-'}s
                  </span>
                  {/* Direction (if available) */}
                  <span className="w-24 flex items-center justify-end font-medium">
                    {row.direction !== null && row.direction !== undefined ? (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          style={{ transform: `rotate(${row.direction}deg)` }}
                          className="inline-block mx-1"
                        >
                          <polygon points="8,2 14,14 8,11 2,14" fill="#333" />
                        </svg>
                        <span className="ml-1">{getCompassDirection(row.direction)} {Math.round(row.direction)}°</span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop tooltip - only show when tooltipData exists */}
      {!isMobile && tooltipData && (
        <Tooltip x={tooltipData.x} y={tooltipData.y}>
          <TooltipContent>
            <div className="flex flex-row space-x-4">
              <div className="flex flex-col justify-center items-start pr-4 border-r border-gray-200 min-w-[140px]">
                {(() => {
                  const row = {
                    label: 'Total',
                    height: tooltipData.waveHeight,
                    period: tooltipData.wavePeriod,
                    direction: tooltipData.waveDirection,
                  };
                  return (
                    <div key={row.label} className="flex items-center text-lg py-1 font-semibold whitespace-nowrap flex-col">
                      <span className="w-12 flex-shrink-0 mr-auto ml-5 text-gray-400 justify-start">{row.label}</span>
                      <div className="flex flex-row space-x-2">
                        <span className="w-16 text-right font-bold">
                          {row.height !== null && row.height !== undefined ? (row.height * 3.281).toFixed(1) : '-'}ft
                        </span>
                        <span className="w-12 text-right font-bold">
                          {row.period !== null && row.period !== undefined ? row.period.toFixed(0) : '-'}s
                        </span>
                        <span className="w-28 flex items-center justify-end font-bold">
                          {row.direction !== null && row.direction !== undefined ? (
                            <>
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 16 16"
                                style={{ transform: `rotate(${row.direction}deg)` }}
                                className="inline-block mx-1"
                              >
                                <polygon points="8,2 14,14 8,11 2,14" fill="#333" />
                              </svg>
                              <span className="ml-1">{getCompassDirection(row.direction)} {Math.round(row.direction)}°</span>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col justify-center flex-1 space-y-1 pl-2 text-sm">
                {[
                  {
                    label: 'Swell',
                    height: tooltipData.swellHeight,
                    period: tooltipData.swellPeriod,
                    direction: tooltipData.swellDirection,
                  },
                  {
                    label: 'Secondary',
                    height: tooltipData.secondarySwellHeight,
                    period: tooltipData.secondarySwellPeriod,
                    direction: tooltipData.secondarySwellDirection,
                  },
                  {
                    label: 'Wind Wave',
                    height: tooltipData.windWaveHeight,
                    period: tooltipData.windWavePeriod,
                    direction: null, // Wind wave direction not shown in original
                  },
                ].map((row, index) => (
                  <div key={`${row.label}-${index}`} className="flex items-center justify-between py-1 whitespace-nowrap text-sm">
                    {/* Label */}
                    <span className="w-12 flex-shrink-0 mr-2 text-gray-400">{row.label}</span>
                    {/* Height */}
                    <span className="w-14 text-right font-medium">
                      {row.height !== null && row.height !== undefined ? (row.height * 3.281).toFixed(1) : '-'}ft
                    </span>
                    {/* Period */}
                    <span className="w-10 text-right font-medium">
                      {row.period !== null && row.period !== undefined ? row.period.toFixed(0) : '-'}s
                    </span>
                    {/* Direction (if available) */}
                    <span className="w-24 flex items-center justify-end font-medium">
                      {row.direction !== null && row.direction !== undefined ? (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            style={{ transform: `rotate(${row.direction}deg)` }}
                            className="inline-block mx-1"
                          >
                            <polygon points="8,2 14,14 8,11 2,14" fill="#333" />
                          </svg>
                          <span className="ml-1">{getCompassDirection(row.direction)} {Math.round(row.direction)}°</span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
      
      <div className="space-y-4 relative">
        <div className="relative w-full bg-gradient-to-br from-gray-1 to-gray-2 overflow-hidden">
          <div id="swellChart" className="w-full">
            <svg ref={swellChartRef} className="w-full" style={{ backgroundColor: theme.chartBackground }} />
          </div>
        </div>
      </div>
    </>
  );
};


// Export as a dynamic component with no SSR
export default dynamic(() => Promise.resolve(SwellVisualization), { ssr: false });
