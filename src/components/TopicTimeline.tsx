import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Repo } from "../types";

interface TopicTimelineProps {
  repos: Repo[];
}

interface TimelineDatum {
  name: string;
  dateObj: Date;
  display: string;
  [topic: string]: string | number | Date;
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7",
  "#ec4899", "#f43f5e", "#64748b", "#0ea5e9", "#84cc16",
];

export const TopicTimeline: React.FC<TopicTimelineProps> = ({ repos }) => {
  const chartData = useMemo(() => {
    if (!repos.length) return { data: [], topTopics: [] };

    console.log("Generating timeline for", repos.length, "repos");

    const topicCounts: Record<string, number> = {};
    repos.forEach((repo) => {
      repo.topics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topicCounts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 10)
      .map(([topic]) => topic);

    const dates = repos
      .map((repo) => repo.date ? new Date(repo.date).getTime() : 0)
      .filter((value) => value > 0);

    if (dates.length === 0) return { data: [], topTopics: [] };

    const minDateTs = Math.min(...dates);
    const minDate = new Date(minDateTs);
    minDate.setDate(minDate.getDate() - minDate.getDay() + 1);

    const maxDate = new Date();
    const buckets: Record<string, TimelineDatum> = {};
    const current = new Date(minDate);

    while (current <= maxDate) {
      const year = current.getFullYear();
      const week = getWeekNumber(current);
      const key = `${year}-W${week.toString().padStart(2, "0")}`;

      const entry: TimelineDatum = {
        name: key,
        dateObj: new Date(current),
        display: current.toLocaleDateString(),
      };

      topTopics.forEach((topic) => {
        entry[topic] = 0;
      });

      buckets[key] = entry;
      current.setDate(current.getDate() + 7);
    }

    repos.forEach((repo) => {
      if (!repo.date) return;
      const date = new Date(repo.date);
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      const key = `${year}-W${week.toString().padStart(2, "0")}`;

      if (buckets[key]) {
        repo.topics.forEach((topic) => {
          if (topTopics.includes(topic)) {
            const currentCount = typeof buckets[key][topic] === "number" ? buckets[key][topic] : 0;
            buckets[key][topic] = currentCount + 1;
          }
        });
      }
    });

    const data = Object.values(buckets);
    data.sort((left, right) => left.dateObj.getTime() - right.dateObj.getTime());

    return { data, topTopics };
  }, [repos]);

  if (!chartData.data.length) return null;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Trending Topics Over Time</h3>
      <p className="text-muted" style={{ marginBottom: "20px" }}>
        Showing frequency of top 10 topics per week
      </p>

      <div style={{ height: "400px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="dateObj"
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
              }}
              minTickGap={50}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b" }}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontSize: "13px", padding: "2px 0" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
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

function getWeekNumber(dateValue: Date) {
  const date = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
