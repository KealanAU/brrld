import * as d3 from 'd3';
import React, { useEffect } from 'react';
import { useBeachData } from '@/context/BeachDataContext';
import { useChartHover } from '@/context/ChartHoverContext';
import MobileDayNavigation from './MobileDayNavigation';

interface TopBarProps {
  width?: number;
  height?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  width = 1400,
  height = 120,
}) => {
  const { beachData, isLoading } = useBeachData();
  const { 
    currentDayIndex, 
    setCurrentDayIndex, 
    setIsMobile, 
    uniqueDays, 
    setUniqueDays 
  } = useChartHover();

  // Get unique days from data and sync with context
  const localUniqueDays = React.useMemo(() => {
    if (!beachData?.stormGlassData) return [];
    const days = [...new Set(beachData.stormGlassData.map(d => 
      new Date(d.date_time).toISOString().split('T')[0]
    ))].sort();
    return days;
  }, [beachData?.stormGlassData]);

  // Sync unique days with context
  useEffect(() => {
    setUniqueDays(localUniqueDays);
  }, [localUniqueDays, setUniqueDays]);

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

  // Navigation functions
  const goToPreviousDay = () => {
    setCurrentDayIndex(Math.max(0, currentDayIndex - 1));
  };

  const goToNextDay = () => {
    setCurrentDayIndex(Math.min(uniqueDays.length - 1, currentDayIndex + 1));
  };


  useEffect(() => {
    if (!beachData?.stormGlassData || beachData.stormGlassData.length === 0 || isLoading) return;

    // Clear any existing SVG
    d3.select("#topBar").selectAll("*").remove();

    const margin = { top: 40, right: 35, bottom: 10, left: 12 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3
      .select("#topBar")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Safely calculate domain
    const dates = beachData.stormGlassData.map(d => new Date(d.date_time));
    const minDate = d3.min(dates);
    const maxDate = d3.max(dates);
    
    if (!minDate || !maxDate) return;

    const xScale = d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([0, chartWidth]);

    const formatDay = d3.timeFormat("%A, %d/%m");
    const formatDate = d3.timeFormat("%d/%m");

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeDay.every(1)) // Set tick interval to every day
      .tickFormat((domainValue: Date | d3.NumberValue) => {
        if (!(domainValue instanceof Date)) return '';
        
        const now = new Date();
        const dayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const tomorrow = new Date(dayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (domainValue.getTime() === dayStart.getTime()) {
          return `Today, ${formatDate(domainValue)}`;
        } else if (domainValue.getTime() === tomorrow.getTime()) {
          return `Tomorrow, ${formatDate(domainValue)}`;
        } else {
          return formatDay(domainValue);
        }
      });

    const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0,${0 + margin.top / 2})`)
      .call(xAxis);

    xAxisGroup
      .selectAll("text")
      .attr("y", 6)
      .attr("x", 6)
      .style("text-anchor", "start")
      .style("color", "black")
      .style("font-weight", "bold")
      .style("font-size", "15px");

    // Remove the tick lines
    xAxisGroup.selectAll(".tick line").attr("stroke", "none");
    xAxisGroup.selectAll("path,line").remove();

    const uniqueDates = [
      ...new Set(
        beachData.stormGlassData.map((d) => new Date(d.date_time).toISOString().split("T")[0])
      ),
    ];

    uniqueDates.forEach((dateStr) => {
      // Create a Date object for the start of the day (midnight)
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0); // Set time to midnight

      // Append a vertical line to the SVG at the start of the day
      svg
        .append("line")
        .attr("x1", xScale(startOfDay) - 3)
        .attr("y1", 0)
        .attr("x2", xScale(startOfDay) - 3)
        .attr("y2", chartHeight - 3.75)
        .attr("stroke", "gray")
        .attr("stroke-width", 1);
    });

  }, [beachData, isLoading, width, height]);

  return (
    <>
        <MobileDayNavigation
          currentDayIndex={currentDayIndex}
          totalDays={uniqueDays.length}
          currentDate={uniqueDays[currentDayIndex] || ''}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          isFirstDay={currentDayIndex === 0}
          isLastDay={currentDayIndex === uniqueDays.length - 1}
          className="mt-16 px-4 md:hidden sm:block"
        />

      <div id="topBar" className='hidden md:block' />

    </>
  );
};
