import React, { useState, useRef, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RetentionData, Hotspot } from '@/types';

interface RetentionGraphProps {
  videoId: string;
  retentionData: RetentionData;
  hotspots: Hotspot[];
  duration: number;
  onHotspotHover: (hotspotId: string | null) => void;
}

export default function RetentionGraph({ 
  videoId, 
  retentionData, 
  hotspots, 
  duration,
  onHotspotHover
}: RetentionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Prepare data for chart
  const chartData = retentionData.points.map((point) => ({
    time: point.timestamp,
    formattedTime: formatTime(point.timestamp),
    percentage: point.percentage * 100,
  }));

  // Format time to MM:SS
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Generate time markers for X axis
  const generateTimeMarkers = (): string[] => {
    const markers = [];
    const step = Math.ceil(duration / 6); // 6 markers
    
    for (let i = 0; i <= duration; i += step) {
      markers.push(formatTime(i));
    }
    
    // Ensure the last marker is the video duration
    if (markers[markers.length - 1] !== formatTime(duration)) {
      markers.pop();
      markers.push(formatTime(duration));
    }
    
    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-md text-xs">
          <p className="font-medium">{`Time: ${payload[0].payload.formattedTime}`}</p>
          <p className="text-[#FF0000]">{`Audience: ${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    
    return null;
  };

  // Position hotspots on the chart
  const renderHotspots = () => {
    return hotspots.map((hotspot) => {
      // Find the closest data point
      const closestPoint = chartData.reduce((prev, curr) => {
        return Math.abs(curr.time - hotspot.timestamp) < Math.abs(prev.time - hotspot.timestamp) ? curr : prev;
      });
      
      // Calculate position
      const timePosition = (hotspot.timestamp / duration) * 100;
      const valuePosition = 100 - closestPoint.percentage; // Invert Y since SVG coordinates start from top
      
      let color;
      switch (hotspot.type) {
        case 'SIGNIFICANT_DROP':
          color = 'bg-[#E53935]';
          break;
        case 'INTEREST_POINT':
          color = 'bg-[#FFC107]';
          break;
        case 'ENGAGEMENT_PEAK':
          color = 'bg-[#4CAF50]';
          break;
        default:
          color = 'bg-[#1976D2]';
      }
      
      const hotspotId = hotspot.id;
      const index = parseInt(hotspotId.slice(-1), 10) || hotspots.indexOf(hotspot) + 1;

      return (
        <div 
          key={hotspot.id}
          className={`hotspot absolute w-6 h-6 rounded-full ${color} flex items-center justify-center text-white cursor-pointer z-10`}
          style={{ 
            left: `calc(${timePosition}% - 12px)`, 
            top: `calc(${valuePosition}% - 12px)` 
          }}
          onMouseEnter={() => onHotspotHover(hotspot.id)}
          onMouseLeave={() => onHotspotHover(null)}
        >
          {index}
        </div>
      );
    });
  };

  return (
    <div className="retention-graph-container mb-6">
      <h3 className="text-lg font-medium mb-4">Audience Retention</h3>
      <div className="bg-[#F9F9F9] p-4 rounded-lg">
        <div className="retention-graph relative h-64" ref={containerRef}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1976D2" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="formattedTime"
                ticks={timeMarkers}
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={false}
                axisLine={{ stroke: '#eee' }}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: '#666666' }}
                tickLine={false}
                axisLine={{ stroke: '#eee' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="#1976D2" 
                fillOpacity={1}
                fill="url(#colorRetention)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          {renderHotspots()}
        </div>
        <div className="text-center text-sm text-[#666666] mt-2">
          Video timeline (minutes:seconds)
        </div>
      </div>
    </div>
  );
}
