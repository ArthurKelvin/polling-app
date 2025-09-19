"use client";

import { useState } from "react";
import { PollResults } from "@/types/poll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, BarChart as BarChartIcon } from "lucide-react";

interface PollResultChartProps {
  results: PollResults[];
  totalVotes: number;
}

type ChartType = 'bar' | 'pie' | 'line' | 'horizontal-bar';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export function PollResultChart({ results, totalVotes }: PollResultChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Prepare data for charts
  const chartData = results.map((result, index) => ({
    name: result.label,
    votes: result.votes_count,
    percentage: totalVotes > 0 ? ((result.votes_count / totalVotes) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Votes: {payload[0].value}
          </p>
          <p className="text-gray-600">
            Percentage: {((payload[0].value / totalVotes) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="votes"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="votes" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="votes" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Poll Results</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'horizontal-bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('horizontal-bar')}
            >
              <BarChartIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No votes yet. Be the first to vote!
          </div>
        ) : (
          <>
            {renderChart()}
            
            {/* Results Summary */}
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Results Summary</h4>
              {results.map((result, index) => {
                const percentage = totalVotes > 0 ? (result.votes_count / totalVotes) * 100 : 0;
                return (
                  <div key={result.option_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{result.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{result.votes_count}</span>
                      <span className="text-gray-500 ml-1">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 text-center">
                Total votes: <span className="font-semibold">{totalVotes}</span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
