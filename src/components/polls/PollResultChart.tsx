"use client";

import { PollResults } from "@/types/poll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PollResultChartProps {
  results: PollResults[];
  totalVotes: number;
}

export function PollResultChart({ results, totalVotes }: PollResultChartProps) {
  const maxVotes = Math.max(...results.map(r => r.votes_count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result) => {
            const percentage = totalVotes > 0 ? (result.votes_count / totalVotes) * 100 : 0;
            const barWidth = (result.votes_count / maxVotes) * 100;

            return (
              <div key={result.option_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{result.label}</span>
                  <span className="text-sm text-gray-600">
                    {result.votes_count} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 text-center">
            Total votes: {totalVotes}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
