'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useBeachData } from '@/context/BeachDataContext';
import { useChartHover } from '@/context/ChartHoverContext';
import { useTheme } from '@/context/ThemeContext';
import { TideDetails } from '@/types/beach';
import { Tooltip, TooltipContent } from './Tooltip';
import {TidalVisualizationProps, TidalTooltipData} from '@/types/data'

// Helper function to interpolate hourly tide data
function interpolateHourlyTideData(tideData: TideDetails[]): TideDetails[] {
  const sortedData = [...tideData].sort((a, b) => 
    new Date(a.tide_time).getTime() - new Date(b.tide_time).getTime()
  );

  const interpolatedData: TideDetails[] = [];
  
  // Get the time range
  const startTime = new Date(sortedData[0].tide_time);
  const endTime = new Date(sortedData[sortedData.length - 1].tide_time);

  // Round to nearest hour
  startTime.setMinutes(0, 0, 0);
  endTime.setMinutes(0, 0, 0);

  // Find all high and low tide points
  const extremePoints: TideDetails[] = [];
  for (let i = 1; i < sortedData.length - 1; i++) {
    const prev = sortedData[i - 1];
    const curr = sortedData[i];
    const next = sortedData[i + 1];
    
    // Check if current point is a local maximum (high tide) or minimum (low tide)
    if ((curr.tide_height > prev.tide_height && curr.tide_height > next.tide_height) ||
        (curr.tide_height < prev.tide_height && curr.tide_height < next.tide_height)) {
      extremePoints.push(curr);
    }
  }
  
  // Add first and last points if they're not already included
  if (!extremePoints.includes(sortedData[0])) {
    extremePoints.unshift(sortedData[0]);
  }
  if (!extremePoints.includes(sortedData[sortedData.length - 1])) {
    extremePoints.push(sortedData[sortedData.length - 1]);
  }

  // For each pair of extreme points, interpolate between them
  for (let i = 0; i < extremePoints.length - 1; i++) {
    const startPoint = extremePoints[i];
    const endPoint = extremePoints[i + 1];
    const startTime = new Date(startPoint.tide_time);
    const endTime = new Date(endPoint.tide_time);
    
    // Round to nearest hour
    startTime.setMinutes(0, 0, 0);
    endTime.setMinutes(0, 0, 0);
    
    // Calculate the total time difference in hours
    const totalHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    
    // For each hour between the extreme points
    for (let hour = 0; hour <= totalHours; hour++) {
      const currentTime = new Date(startTime);
      currentTime.setHours(startTime.getHours() + hour);
      
      // Skip if we've already passed the end time
      if (currentTime > endTime) continue;
      
      // Calculate the progress (0 to 1) between the extreme points
      const progress = hour / totalHours;
      
      // Use a sine-like interpolation for more natural tidal movement
      // This creates a smooth transition between high and low tides
      const interpolatedHeight = startPoint.tide_height + 
        (endPoint.tide_height - startPoint.tide_height) * 
        (0.5 - Math.cos(progress * Math.PI) / 2);
      
      interpolatedData.push({
        ...startPoint,
        tide_time: currentTime.toISOString(),
        tide_height: interpolatedHeight
      });
    }
  }

  return interpolatedData;
}

export const TidalVisualization: React.FC<TidalVisualizationProps> = ({
  width = 1400,
  height = 200,
  minHeight,
  maxHeight,
  heightPadding = 0.2,
}) => {
  const { beachData } = useBeachData();
  const { hoveredTime, setHoveredTime, currentDayIndex, setCurrentDayIndex, isMobile, setIsMobile, uniqueDays, setUniqueDays } = useChartHover();
  const theme = useTheme();
  const tideData = beachData?.tideData ?? [];
  const stormGlassData = beachData?.stormGlassData ?? [];
  const tideChartRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<TidalTooltipData | null>(null);

  const margin = { top: 20, right: 35, bottom: 70, left: 12 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get unique days from storm glass data and sync with context
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

  // Get tide data for current day
  const currentDayTideData = React.useMemo(() => {
    if (!uniqueDays.length || currentDayIndex >= uniqueDays.length) return tideData;
    
    const currentDay = uniqueDays[currentDayIndex];
    return tideData.filter(d => 
      new Date(d.tide_time).toISOString().split('T')[0] === currentDay
    );
  }, [tideData, uniqueDays, currentDayIndex]);

  // Get the data to display based on mobile state
  const displayTideData = React.useMemo(() => {
    return isMobile ? currentDayTideData : tideData;
  }, [isMobile, currentDayTideData, tideData]);

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
    if (!stormGlassData.length || !tideData.length || !tideChartRef.current) return;

    // Clear existing SVG content
    d3.select(tideChartRef.current).selectAll('*').remove();

    // Interpolate hourly tide data
    const interpolatedTideData = interpolateHourlyTideData(displayTideData);

    // Create SVG container
    const tideSvg = d3.select(tideChartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create time scale with padding to ensure smooth edges
    const timeExtent = d3.extent(interpolatedTideData, d => new Date(d.tide_time)) as [Date, Date];
    const timePadding = (timeExtent[1].getTime() - timeExtent[0].getTime()) * 0.02; // 2% padding
    const paddedExtent: [Date, Date] = [
      new Date(timeExtent[0].getTime() - timePadding),
      new Date(timeExtent[1].getTime() + timePadding)
    ];

    const xScale = d3.scaleTime()
      .domain(paddedExtent)
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
    tideSvg.append('g')
      .attr('transform', `translate(0,${chartHeight + margin.bottom / 2})`)
      .call(xAxis)
      .selectAll('text')
      .attr('y', 6)
      .attr('x', 6)
      .style('text-anchor', 'start')
      .style('color', theme.chartText)
      .style('font-size', isMobile ? '10px' : '12px');

    // Remove tick lines
    tideSvg.selectAll('.tick line').attr('stroke', 'none');
    tideSvg.selectAll('path,line').remove();

    // Add day separators (only for desktop when showing all data)
    if (!isMobile) {
      const uniqueDates = [...new Set(interpolatedTideData.map(d => 
        new Date(d.tide_time).toISOString().split('T')[0]
      ))];

      uniqueDates.forEach(dateStr => {
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        // Add day separator line
        tideSvg.append('line')
          .attr('x1', xScale(startOfDay))
          .attr('y1', 0)
          .attr('x2', xScale(startOfDay))
          .attr('y2', chartHeight)
          .attr('stroke', theme.chartGrid)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');

        // Add day label
        tideSvg.append('text')
          .attr('x', xScale(startOfDay) + 5)
          .attr('y', 15)
          .attr('text-anchor', 'start')
          .text(d3.timeFormat('%a %b %d')(startOfDay))
          .attr('font-size', '11px')
          .attr('fill', theme.chartText);

        // Add night shadows
        const shadowStart = new Date(dateStr);
        shadowStart.setHours(17, 0, 0);
        const shadowEnd = new Date(shadowStart);
        shadowEnd.setDate(shadowEnd.getDate() + 1);
        shadowEnd.setHours(6, 0, 0);

        tideSvg.append('rect')
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

        tideSvg.append('rect')
          .attr('class', 'shadow')
          .attr('x', xScale(shadowStart))
          .attr('y', 0)
          .attr('width', xScale(shadowEnd) - xScale(shadowStart))
          .attr('height', chartHeight)
          .style('fill', theme.chartShadow)
          .style('pointer-events', 'none');
      }
    }

    // Create y scale with padding
    const yExtent = d3.extent(interpolatedTideData, d => d.tide_height) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * heightPadding;
    
    // Use provided min/max if available, otherwise use calculated values with padding
    const paddedYExtent: [number, number] = [
      minHeight ?? (yExtent[0] - yPadding),
      maxHeight ?? (yExtent[1] + yPadding)
    ];

    const tideYScale = d3.scaleLinear()
      .domain(paddedYExtent)
      .range([chartHeight, 0]);

    // Add tide area with improved curve
    const tideArea = d3.area<TideDetails>()
      .curve(d3.curveMonotoneX) // Changed to monotoneX for smoother transitions
      .x(d => xScale(new Date(d.tide_time)))
      .y0(chartHeight)
      .y1(d => tideYScale(d.tide_height));

    tideSvg.append('path')
      .datum(interpolatedTideData)
      .attr('class', 'tide-area')
      .attr('fill', theme.chartArea)
      .attr('fill-opacity', 0.5)
      .attr('d', tideArea);

    // Add tide line with improved curve
    const tideLine = d3.line<TideDetails>()
      .curve(d3.curveMonotoneX) // Changed to monotoneX for smoother transitions
      .x(d => xScale(new Date(d.tide_time)))
      .y(d => tideYScale(d.tide_height));

    tideSvg.append('path')
      .datum(interpolatedTideData)
      .attr('class', 'tide-line')
      .attr('fill', 'none')
      .attr('stroke', theme.chartLine)
      .attr('stroke-width', 2)
      .attr('d', tideLine);

    // Find high and low tide points for each day
    const tidePointsByDay = interpolatedTideData.reduce((acc, tide) => {
      const day = new Date(tide.tide_time).toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(tide);
      return acc;
    }, {} as Record<string, TideDetails[]>);

    // For each day, find the highest and lowest tide points
    Object.values(tidePointsByDay).forEach((tides) => {
      const highTide = tides.reduce((max, tide) => 
        tide.tide_height > max.tide_height ? tide : max
      );
      const lowTide = tides.reduce((min, tide) => 
        tide.tide_height < min.tide_height ? tide : min
      );

      // Add high tide indicator
      tideSvg.append('line')
        .attr('class', 'tide-extreme-line')
        .attr('x1', xScale(new Date(highTide.tide_time)))
        .attr('y1', chartHeight)
        .attr('x2', xScale(new Date(highTide.tide_time)))
        .attr('y2', tideYScale(highTide.tide_height))
        .attr('stroke', theme.chartLine)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Add high tide labels (time above height)
      tideSvg.append('text')
        .attr('class', 'tide-extreme-label')
        .attr('x', xScale(new Date(highTide.tide_time)))
        .attr('y', tideYScale(highTide.tide_height) - 20)
        .attr('text-anchor', 'middle')
        .text(d3.timeFormat('%I:%M%p')(new Date(highTide.tide_time)))
        .attr('font-size', '10px')
        .attr('fill', theme.chartText);

      tideSvg.append('text')
        .attr('class', 'tide-extreme-height')
        .attr('x', xScale(new Date(highTide.tide_time)))
        .attr('y', tideYScale(highTide.tide_height) - 5)
        .attr('text-anchor', 'middle')
        .text(`H: ${highTide.tide_height.toFixed(1)}m`)
        .attr('font-size', '10px')
        .attr('fill', theme.chartText)
        .style('font-weight', 'bold');

      // Add low tide indicator
      tideSvg.append('line')
        .attr('class', 'tide-extreme-line')
        .attr('x1', xScale(new Date(lowTide.tide_time)))
        .attr('y1', chartHeight)
        .attr('x2', xScale(new Date(lowTide.tide_time)))
        .attr('y2', tideYScale(lowTide.tide_height))
        .attr('stroke', theme.chartLine)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');

      // Add low tide labels (time above height)
      tideSvg.append('text')
        .attr('class', 'tide-extreme-label')
        .attr('x', xScale(new Date(lowTide.tide_time)))
        .attr('y', tideYScale(lowTide.tide_height) - 20)
        .attr('text-anchor', 'middle')
        .text(d3.timeFormat('%I:%M%p')(new Date(lowTide.tide_time)))
        .attr('font-size', '10px')
        .attr('fill', theme.chartText);

      tideSvg.append('text')
        .attr('class', 'tide-extreme-height')
        .attr('x', xScale(new Date(lowTide.tide_time)))
        .attr('y', tideYScale(lowTide.tide_height) - 5)
        .attr('text-anchor', 'middle')
        .text(`L: ${lowTide.tide_height.toFixed(1)}m`)
        .attr('font-size', '10px')
        .attr('fill', theme.chartText)
        .style('font-weight', 'bold');
    });

    // Add interactive overlay
    tideSvg.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseenter', () => {
        tideSvg.select('.hover-line')?.style('display', null);
      })
      .on('mouseleave', () => {
        tideSvg.select('.hover-line')?.style('display', 'none');
        setHoveredTime(null);
        setTooltipData(null);
      })
      .on('mousemove', (event) => {
        const [x] = d3.pointer(event);
        const x0 = xScale.invert(x);
        const bisect = d3.bisector((d: TideDetails) => new Date(d.tide_time).getTime()).left;
        const i = bisect(interpolatedTideData, x0, 1);
        const d0 = interpolatedTideData[i - 1];
        const d1 = interpolatedTideData[i];
        const d = x0.getTime() - new Date(d0.tide_time).getTime() > new Date(d1.tide_time).getTime() - x0.getTime() ? d1 : d0;

        // Update hover line
        tideSvg.select('.hover-line')
          ?.attr('x1', xScale(new Date(d.tide_time)))
          .attr('x2', xScale(new Date(d.tide_time)))
          .attr('y1', 0)
          .attr('y2', chartHeight);

        // Update hovered time in context
        setHoveredTime(new Date(d.tide_time));

        // Update tooltip
        const tooltipX = event.pageX;
        const tooltipY = event.pageY - 70;

        setTooltipData({
          tideHeight: d.tide_height,
          dateTime: d.tide_time,
          x: tooltipX,
          y: tooltipY
        });
      });

    // Add hover line
    tideSvg.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', theme.chartHover)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    return () => {
      tideSvg.select('.hover-line')?.remove();
    };
  }, [width, height, stormGlassData, tideData, minHeight, maxHeight, heightPadding, setHoveredTime, theme, isMobile, currentDayTideData, uniqueDays, currentDayIndex]);

  // Add effect to respond to hoveredTime changes from other charts
  useEffect(() => {
    if (!tideChartRef.current || !hoveredTime) return;

    const tideSvg = d3.select(tideChartRef.current).select('g');
    const interpolatedTideData = interpolateHourlyTideData(tideData);
    const xScale = d3.scaleTime()
      .domain(d3.extent(interpolatedTideData, d => new Date(d.tide_time)) as [Date, Date])
      .range([0, chartWidth]);

    // Update hover line
    tideSvg.select('.hover-line')
      ?.style('display', null)
      .attr('x1', xScale(hoveredTime))
      .attr('x2', xScale(hoveredTime))
      .attr('y1', 0)
      .attr('y2', chartHeight);

    const hoveredData = interpolatedTideData.find(d => 
      new Date(d.tide_time).getTime() === hoveredTime.getTime()
    );

    if (hoveredData) {
      // Update tooltip position relative to chart
      const tooltipX = xScale(hoveredTime) + margin.left + 220;
      const tooltipY = chartHeight / 2 + margin.top + 320;

      setTooltipData({
        tideHeight: hoveredData.tide_height,
        dateTime: hoveredData.tide_time,
        x: tooltipX,
        y: tooltipY
      });
    }
  }, [hoveredTime, tideData, chartWidth, chartHeight, margin.left, margin.top]);

  return (
    <>
      {isMobile && (
        <div className="w-full bg-white">
          <div className="flex flex-row space-x-4">
            <div className="flex flex-col justify-center items-start pr-4  min-w-[140px]">
              <div className="flex items-center text-lg py-1 font-semibold whitespace-nowrap flex-row">
                <span className="w-12 flex-shrink-0 mr-auto ml-5 text-gray-400 justify-start">Tide</span>
                <div className="flex flex-row space-x-2">
                  <span className="w-16 text-right font-bold">
                    {tooltipData?.tideHeight !== null && tooltipData?.tideHeight !== undefined ? tooltipData.tideHeight.toFixed(1) : '-'}m
                  </span>
                  <span className="w-12 text-right font-bold">
                    {tooltipData?.dateTime ? new Date(tooltipData.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isMobile && tooltipData && (
        <Tooltip x={tooltipData.x} y={tooltipData.y}>
          <TooltipContent>
            <div><h1 className="text-md font-bold">Tide Height: {tooltipData.tideHeight.toFixed(1)}m</h1></div>
          </TooltipContent>
        </Tooltip>
      )}
      <div className="space-y-4 relative">
        <div className="relative w-full bg-gradient-to-br from-gray-1 to-gray-2 overflow-hidden">
          <div id="tideChart" className="w-full">
            <svg ref={tideChartRef} className="w-full" style={{ backgroundColor: theme.chartBackground }} />
          </div>
        </div>
      </div>
    </>
  );
}; 