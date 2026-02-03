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

    console.log("Generating timeline for", repos.length, "repos");

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

    // 2. Determine Timeline Bounds (Start of first repo -> Today)
    const dates = repos
      .map(r => r.date ? new Date(r.date).getTime() : 0)
      .filter(d => d > 0);
    
    if (dates.length === 0) return { data: [], topTopics: [] };

    const minDateTs = Math.min(...dates);
    const minDate = new Date(minDateTs);
    // Align to Monday of that week
    minDate.setDate(minDate.getDate() - minDate.getDay() + 1); 

    const maxDate = new Date(); // Today

    // 3. Create Continuous Week Buckets
    const buckets: Record<string, any> = {};
    const current = new Date(minDate);
    
    while (current <= maxDate) {
      // Key format: YYYY-Www (e.g., 2023-W01)
      const year = current.getFullYear();
      const week = getWeekNumber(current);
      const key = `${year}-W${week.toString().padStart(2, '0')}`;
      
      const entry: any = { 
        name: key,
        dateObj: new Date(current), // for sorting/display
        display: current.toLocaleDateString(), // simplified
      };
      
      // Init counts to 0
      topTopics.forEach(t => entry[t] = 0);
      
      buckets[key] = entry;

      // Next week
      current.setDate(current.getDate() + 7);
    }

    // 4. Populate with Data
    repos.forEach(repo => {
      if (!repo.date) return;
      const d = new Date(repo.date);
      const year = d.getFullYear();
      const week = getWeekNumber(d);
      const key = `${year}-W${week.toString().padStart(2, '0')}`;

      // Handle edge cases where repo date is slightly out of our generated buckets (e.g. today vs bucket start)
      // Find the closest bucket if exact match missing (though logic above should cover it)
      if (buckets[key]) {
        repo.topics.forEach(topic => {
          if (topTopics.includes(topic)) {
            buckets[key][topic]++;
          }
        });
      }
    });

    const data = Object.values(buckets); // buckets is already sorted by insertion logic? 
    // Actually object keys iteration order is not guaranteed. Let's sort manually.
    data.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    return { data, topTopics };
  }, [repos]);

  if (!chartData.data.length) return null;

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '24px', margin: 0 }}>Trending Topics Over Time</h3>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px' }}>
        Showing frequency of top 10 topics per week
      </p>
      
      <div style={{ height: '400px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="dateObj" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(date) => {
                 const d = new Date(date);
                 return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
              }}
              minTickGap={50}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip 
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
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
    </div>
  );
};

// Helper: Get ISO Week Number
function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}
