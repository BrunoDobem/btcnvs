import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../lib/types';

interface ChartRendererProps {
  chartData: ChartData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function ChartRenderer({ chartData }: ChartRendererProps) {
  const { type, data, xKey, yKey, title, labels } = chartData;

  // Preparar dados para o gráfico
  const chartDataFormatted = data.map((item) => {
    const formatted: Record<string, any> = {};
    Object.keys(item).forEach((key) => {
      const label = labels?.[key] || key;
      formatted[label] = item[key];
    });
    return formatted;
  });

  const xLabel = labels?.[xKey] || xKey;

  // Determinar se yKey é um array (múltiplas séries)
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xLabel} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={labels?.[key] || key}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xLabel} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={labels?.[key] || key}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xLabel} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={labels?.[key] || key}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // Para gráfico de pizza, usar apenas a primeira série
        const firstYKey = yKeys[0];
        const yLabel = labels?.[firstYKey] || firstYKey;
        const pieData = chartDataFormatted.map((item, index) => ({
          name: item[xLabel] || `Item ${index + 1}`,
          value: Number(item[yLabel]) || 0,
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full mt-4">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      )}
      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

