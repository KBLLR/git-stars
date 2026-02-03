import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Repo } from '../types';

interface TopicTimelineProps {
  repos: Repo[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', 
  '#ec4899', '#f43f5e', '#64748b', '#0ea5e9', '#84cc16'
];

export const TopicTimeline: React.FC<TopicTimelineProps> = ({ repos }) => {
  const chartData = useMemo(() => {
    if (!repos.length) return { data: [], topTopics: [] };

    // 1. Calculate Top 10 Topics globally
    const topicCounts: Record<string, number> = {};
    repos.forEach(repo => {
      repo.topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);

    // 2. Group Repos by Month
    const reposByMonth: Record<string, Repo[]> = {};
    const minDate = new Date(Math.min(...repos.map(r => new Date(r.date || new Date()).getTime())));
    const maxDate = new Date(); // As of now

    // Create a continuous timeline of months
    let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (currentDate <= maxDate) {
      const monthKey = currentDate.toISOString().slice(0, 7); // YYYY-MM
      reposByMonth[monthKey] = [];
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Populate with actual data
    repos.forEach(repo => {
      const date = new Date(repo.date || new Date());
      const monthKey = date.toISOString().slice(0, 7);
      if (reposByMonth[monthKey]) {
        reposByMonth[monthKey].push(repo);
      }
    });

    // 3. Aggregate Top Topic Counts per Month
    const data = Object.entries(reposByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthRepos]) => {
        const entry: any = { month };
        
        // Initialize top topics to 0
        topTopics.forEach(topic => entry[topic] = 0);

        // Count occurences in this month
        monthRepos.forEach(repo => {
          repo.topics.forEach(topic => {
            if (topTopics.includes(topic)) {
              entry[topic] = (entry[topic] || 0) + 1;
            }
          });
        });

        return entry;
      });

    return { data, topTopics };
  }, [repos]);

  if (!chartData.data.length) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Trending Topics Over Time</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${month}/${year.slice(2)}`;
              }}
              minTickGap={30}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              itemStyle={{ fontSize: '13px', padding: '2px 0' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {chartData.topTopics.map((topic, index) => (
              <Line
                key={topic}
                type="monotone"
                dataKey={topic}
                name={topic}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-slate-400 mt-4 text-center italic">
        Showing frequency of top 10 topics per month
      </p>
    </div>
  );
};
