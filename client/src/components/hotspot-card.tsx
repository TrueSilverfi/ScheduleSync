import { Hotspot, HotspotType } from '@/types';

interface HotspotCardProps {
  hotspot: Hotspot;
  isHighlighted?: boolean;
}

export default function HotspotCard({ hotspot, isHighlighted = false }: HotspotCardProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  let borderColor, bgColor, title;
  
  switch (hotspot.type) {
    case HotspotType.SIGNIFICANT_DROP:
      borderColor = 'border-[#E53935]';
      bgColor = 'bg-red-50';
      title = `Significant Drop (${hotspot.percentageChange > 0 ? '+' : ''}${hotspot.percentageChange}%)`;
      break;
    case HotspotType.INTEREST_POINT:
      borderColor = 'border-[#FFC107]';
      bgColor = 'bg-yellow-50';
      title = `Interest Point (${hotspot.percentageChange > 0 ? '+' : ''}${hotspot.percentageChange}%)`;
      break;
    case HotspotType.ENGAGEMENT_PEAK:
      borderColor = 'border-[#4CAF50]';
      bgColor = 'bg-green-50';
      title = `Engagement Peak (${hotspot.percentageChange > 0 ? '+' : ''}${hotspot.percentageChange}%)`;
      break;
    default:
      borderColor = 'border-[#1976D2]';
      bgColor = 'bg-blue-50';
      title = `Retention Hotspot (${hotspot.percentageChange > 0 ? '+' : ''}${hotspot.percentageChange}%)`;
  }

  return (
    <div 
      className={`mb-4 p-4 border-l-4 ${borderColor} ${bgColor} rounded-r-lg ${isHighlighted ? 'ring-2 ring-opacity-50 ring-blue-500' : ''}`}
      id={`hotspot-${hotspot.id}`}
    >
      <div className="flex flex-wrap justify-between items-start mb-2">
        <h4 className="text-base font-medium">{title}</h4>
        <span className="text-sm bg-white px-2 py-1 rounded border">
          At {formatTime(hotspot.timestamp)}
        </span>
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-700 italic mb-2">"{hotspot.transcriptText}"</p>
      </div>
      <div className="mb-2">
        <h5 className="text-sm font-medium mb-1">
          {hotspot.type === HotspotType.SIGNIFICANT_DROP ? 'Possible Reasons:' : 
           hotspot.type === HotspotType.INTEREST_POINT || hotspot.type === HotspotType.ENGAGEMENT_PEAK ? 'Why It Worked:' : 
           'Analysis:'}
        </h5>
        <ul className="text-sm list-disc list-inside space-y-1 text-gray-700">
          {hotspot.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-sm font-medium mb-1">
          {hotspot.type === HotspotType.SIGNIFICANT_DROP ? 'Suggested Improvement:' : 
           hotspot.type === HotspotType.INTEREST_POINT || hotspot.type === HotspotType.ENGAGEMENT_PEAK ? 'Suggested Action:' : 
           'Recommendation:'}
        </h5>
        <p className="text-sm text-gray-700">{hotspot.suggestion}</p>
      </div>
    </div>
  );
}
