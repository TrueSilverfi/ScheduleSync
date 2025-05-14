import { ActionableInsight } from '@/types';

interface ActionableInsightsProps {
  insights: ActionableInsight;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

export default function ActionableInsights({ 
  insights, 
  onGenerateReport,
  isGeneratingReport
}: ActionableInsightsProps) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
        <h3 className="text-lg font-medium">Actionable Insights For Your Next Video</h3>
        <button 
          className="bg-[#1976D2] hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center mt-2 md:mt-0"
          onClick={onGenerateReport}
          disabled={isGeneratingReport}
        >
          <span className="material-icons mr-2">mail</span>
          {isGeneratingReport ? "Sending..." : "Email Report"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <span className="material-icons text-[#E53935] mr-2">warning</span>
            What to Avoid
          </h4>
          <ul className="space-y-2 text-sm">
            {insights.toAvoid.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="material-icons text-[#FF0000] mr-2 text-sm">close</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <span className="material-icons text-[#4CAF50] mr-2">tips_and_updates</span>
            What to Include
          </h4>
          <ul className="space-y-2 text-sm">
            {insights.toInclude.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="material-icons text-[#4CAF50] mr-2 text-sm">check_circle</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center">
          <span className="material-icons text-[#1976D2] mr-2">auto_awesome</span>
          AI Recommendation
        </h4>
        <p className="text-sm text-gray-700 mb-3">{insights.aiRecommendation}</p>
        <p className="text-sm text-gray-700 mt-3">{insights.estimatedImprovement}</p>
      </div>
    </div>
  );
}
