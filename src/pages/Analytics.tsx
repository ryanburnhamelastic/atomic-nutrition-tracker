import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { analyticsApi } from '../lib/api';
import { AnalyticsData } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    const response = await analyticsApi.get(timeRange);
    if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  // Format date for display (handle both YYYY-MM-DD and ISO timestamps)
  const formatDate = (dateStr: string) => {
    // Normalize to YYYY-MM-DD format
    const normalized = dateStr.split('T')[0];
    const date = new Date(normalized + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate changes for weekly summary
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Protein Compliance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Compliance Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.compliance.complianceRate}%
              </p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              data.compliance.complianceRate >= 80
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <svg
                className={`w-8 h-8 ${
                  data.compliance.complianceRate >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.compliance.compliantDays} of {data.compliance.totalDays} days
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.compliance.currentStreak}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">days in a row</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.compliance.longestStreak}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">personal best</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tracking Days</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {data.compliance.totalDays}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {timeRange} day period
          </p>
        </div>
      </div>

      {/* Weekly Summary Comparison */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Weekly Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Avg Calories', thisWeek: data.weeklySummary.thisWeek.calories, lastWeek: data.weeklySummary.lastWeek.calories },
            { label: 'Avg Protein', thisWeek: data.weeklySummary.thisWeek.protein, lastWeek: data.weeklySummary.lastWeek.protein, unit: 'g' },
            { label: 'Avg Carbs', thisWeek: data.weeklySummary.thisWeek.carbs, lastWeek: data.weeklySummary.lastWeek.carbs, unit: 'g' },
            { label: 'Avg Fat', thisWeek: data.weeklySummary.thisWeek.fat, lastWeek: data.weeklySummary.lastWeek.fat, unit: 'g' },
            { label: 'Compliance', thisWeek: data.weeklySummary.thisWeek.compliance, lastWeek: data.weeklySummary.lastWeek.compliance, unit: '%' },
          ].map((metric) => {
            const change = calcChange(metric.thisWeek, metric.lastWeek);
            return (
              <div key={metric.label} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.thisWeek}{metric.unit || ''}
                </p>
                {metric.lastWeek > 0 && (
                  <div className={`text-xs mt-1 flex items-center justify-center gap-1 ${
                    change > 0 ? 'text-green-600 dark:text-green-400' : change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'
                  }`}>
                    {change > 0 && '↑'}
                    {change < 0 && '↓'}
                    {change !== 0 ? `${Math.abs(change)}%` : 'same'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight Trend Chart */}
      {data.weightTrend.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weight Trend
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-emerald-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Trend</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.weightTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                className="text-xs text-gray-500 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(30 41 59)',
                  border: '1px solid rgb(51 65 85)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'rgb(203 213 225)' }}
              />
              {/* Actual weight with dots */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
                name="Weight"
              />
              {/* Trend weight as smooth line */}
              <Line
                type="monotone"
                dataKey="trendWeight"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="Trend"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calories vs Target Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Calories vs Target
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.dailyNutrition}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs text-gray-500 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-500 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(30 41 59)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'rgb(203 213 225)' }}
            />
            <ReferenceLine
              y={data.goals.calorie_target}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Target', fill: '#ef4444', fontSize: 12 }}
            />
            <Bar
              dataKey="calories"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macro Breakdown Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Macro Breakdown Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.dailyNutrition}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs text-gray-500 dark:text-gray-400"
            />
            <YAxis className="text-xs text-gray-500 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(30 41 59)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'rgb(203 213 225)' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="protein"
              stackId="1"
              stroke="#22c55e"
              fill="#22c55e"
              name="Protein (g)"
            />
            <Area
              type="monotone"
              dataKey="carbs"
              stackId="1"
              stroke="#eab308"
              fill="#eab308"
              name="Carbs (g)"
            />
            <Area
              type="monotone"
              dataKey="fat"
              stackId="1"
              stroke="#6366f1"
              fill="#6366f1"
              name="Fat (g)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Nutrition Heatmap */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compliance Calendar
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {data.dailyNutrition.map((day) => {
            const date = new Date(day.date + 'T00:00:00');
            const dayOfWeek = date.getDay();
            return (
              <div
                key={day.date}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                  day.isCompliant
                    ? 'bg-green-500 text-white'
                    : day.calories > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
                title={`${day.date}: ${day.calories} cal, ${day.protein}g protein ${day.isCompliant ? '✓' : ''}`}
              >
                <span className="font-medium">{date.getDate()}</span>
                <span className="text-[0.6rem] opacity-75">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span>Tracked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <span>No data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
