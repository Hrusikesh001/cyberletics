import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { format, subDays } from 'date-fns';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  BarChart2, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Users,
  Book,
  Award,
  Clock
} from 'lucide-react';
import apiService from '@/lib/api';
import { TrainingModule, TrainingStats, UserProgress } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

// Colors for charts
const COLORS = [
  '#4e46e5', // Purple
  '#0ea5e9', // Blue
  '#f97316', // Orange
  '#10b981', // Green
  '#ea384c', // Red
  '#f59e0b', // Yellow
  '#8b5cf6', // Indigo
  '#ec4899', // Pink
];

// Component for key metrics summary
const KeyMetrics = ({ stats }: { stats: TrainingStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Active in training modules
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
          <Book className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.stats.totalCompletedModules}</div>
          <p className="text-xs text-muted-foreground">
            Total completions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.stats.overallAverageScore)}%</div>
          <p className="text-xs text-muted-foreground">
            Across all modules
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.stats.averageCompletionRate * 100)}%</div>
          <p className="text-xs text-muted-foreground">
            Of assigned modules
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Component for module performance chart
const ModulePerformanceChart = ({ modules }: { modules: TrainingStats['modules'] }) => {
  const sortedModules = [...modules].sort((a, b) => b.completionCount - a.completionCount).slice(0, 10);
  
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Module Performance</CardTitle>
        <CardDescription>
          Completion counts and average scores for top modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedModules}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="title"
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 12 }}
                height={70}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#4e46e5" />
              <YAxis yAxisId="right" orientation="right" stroke="#f97316" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="completionCount" name="Completions" fill="#4e46e5" />
              <Bar yAxisId="right" dataKey="averageScore" name="Avg. Score (%)" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for difficulty distribution chart
const DifficultyDistributionChart = ({ modules }: { modules: TrainingModule[] }) => {
  // Calculate distribution by difficulty
  const difficultyData = [
    { name: 'Beginner', value: 0 },
    { name: 'Intermediate', value: 0 },
    { name: 'Advanced', value: 0 }
  ];
  
  modules.forEach(module => {
    if (module.difficulty === 'beginner') difficultyData[0].value++;
    else if (module.difficulty === 'intermediate') difficultyData[1].value++;
    else if (module.difficulty === 'advanced') difficultyData[2].value++;
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulty Distribution</CardTitle>
        <CardDescription>
          Modules by difficulty level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  return [`${value} modules`, name];
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for top categories chart
const TopCategoriesChart = ({ modules }: { modules: TrainingModule[] }) => {
  // Calculate distribution by category
  const categoryMap = new Map<string, number>();
  
  modules.forEach(module => {
    if (categoryMap.has(module.category)) {
      categoryMap.set(module.category, (categoryMap.get(module.category) || 0) + 1);
    } else {
      categoryMap.set(module.category, 1);
    }
  });
  
  // Convert to array and sort by count
  const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Get top 5
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>
          Most common training categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={categoryData}
              margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12 }} 
              />
              <Tooltip />
              <Bar dataKey="value" name="Modules" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for module completion rate chart
const ModuleCompletionRateChart = ({ modules }: { modules: TrainingStats['modules'] }) => {
  // Sort modules by completion count
  const sortedModules = [...modules].sort((a, b) => b.completionCount - a.completionCount);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Completion Distribution</CardTitle>
        <CardDescription>
          Completion counts across all modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sortedModules}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ title, completionCount, percent }) => 
                  completionCount > 0 ? `${title}: ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={120}
                fill="#8884d8"
                dataKey="completionCount"
                nameKey="title"
              >
                {sortedModules.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  return [`${value} completions`, props.payload.title];
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for module score distribution chart
const ModuleScoreDistributionChart = ({ modules }: { modules: TrainingStats['modules'] }) => {
  // Sort modules by average score
  const sortedModules = [...modules]
    .filter(module => module.completionCount > 0) // Only show modules with completions
    .sort((a, b) => b.averageScore - a.averageScore);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Average Scores</CardTitle>
        <CardDescription>
          Average score percentage by module
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedModules}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="title"
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 12 }}
                height={70}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
              <Bar 
                dataKey="averageScore" 
                name="Average Score" 
                fill="#10b981"
                radius={[4, 4, 0, 0]} 
              >
                {sortedModules.map((entry, index) => {
                  // Color bars based on score
                  let color = '#ea384c'; // Red for low scores
                  if (entry.averageScore >= 70) color = '#10b981'; // Green for high scores
                  else if (entry.averageScore >= 50) color = '#f59e0b'; // Yellow for medium scores
                  
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for radar chart showing module performance metrics
const ModulePerformanceRadarChart = ({ 
  modules, 
  selectedModuleId 
}: { 
  modules: TrainingModule[], 
  selectedModuleId: string 
}) => {
  // If "all" is selected, show top 5 modules
  const topModules = selectedModuleId === 'all' 
    ? modules.sort((a, b) => b.completionCount - a.completionCount).slice(0, 5)
    : modules.filter(m => m.id === selectedModuleId);
  
  // Create radar data with normalized metrics
  const radarData = [
    { subject: 'Completions', fullMark: 100 },
    { subject: 'Avg. Score', fullMark: 100 },
    { subject: 'Duration', fullMark: 100 },
    { subject: 'Questions', fullMark: 100 },
    { subject: 'Difficulty', fullMark: 100 }
  ];
  
  // Add module data to radar data
  topModules.forEach(module => {
    // Normalize values
    const maxCompletions = Math.max(...modules.map(m => m.completionCount));
    const maxDuration = Math.max(...modules.map(m => m.estimatedDuration));
    const maxQuestions = Math.max(...modules.map(m => m.questions.length));
    
    // Map difficulty to numeric value
    const difficultyValue = 
      module.difficulty === 'beginner' ? 33 : 
      module.difficulty === 'intermediate' ? 66 : 100;
    
    radarData[0][module.title] = Math.round((module.completionCount / maxCompletions) * 100);
    radarData[1][module.title] = module.averageScore;
    radarData[2][module.title] = Math.round((module.estimatedDuration / maxDuration) * 100);
    radarData[3][module.title] = Math.round((module.questions.length / maxQuestions) * 100);
    radarData[4][module.title] = difficultyValue;
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Performance Radar</CardTitle>
        <CardDescription>
          Comparative analysis of module metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={130} width={500} height={500} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              
              {topModules.map((module, index) => (
                <Radar
                  key={module.id}
                  name={module.title}
                  dataKey={module.title}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
              
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for user progress over time
const UserProgressTimelineChart = () => {
  // Sample data - in a real app, this would come from an API call
  const [progressData, setProgressData] = useState([
    { date: '2023-01', completions: 12 },
    { date: '2023-02', completions: 18 },
    { date: '2023-03', completions: 15 },
    { date: '2023-04', completions: 25 },
    { date: '2023-05', completions: 32 },
    { date: '2023-06', completions: 28 },
  ]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Completion Timeline</CardTitle>
        <CardDescription>
          Module completions over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={progressData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completions" 
                name="Module Completions" 
                stroke="#4e46e5" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for user score distribution
const UserScoreDistributionChart = () => {
  // Sample data - in a real app, this would come from an API call
  const [scoreData, setScoreData] = useState([
    { range: '0-20%', count: 5 },
    { range: '21-40%', count: 12 },
    { range: '41-60%', count: 25 },
    { range: '61-80%', count: 48 },
    { range: '81-100%', count: 35 },
  ]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Score Distribution</CardTitle>
        <CardDescription>
          Distribution of user scores across all modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scoreData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                name="Users" 
                fill="#4e46e5"
                radius={[4, 4, 0, 0]}
              >
                {scoreData.map((entry, index) => {
                  // Color gradient based on score range
                  const colors = ['#ea384c', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
                  return <Cell key={`cell-${index}`} fill={colors[index]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for completion time distribution
const CompletionTimeDistributionChart = () => {
  // Sample data - in a real app, this would come from an API call
  const [timeData, setTimeData] = useState([
    { range: '<30 min', count: 25 },
    { range: '30-60 min', count: 42 },
    { range: '1-2 hours', count: 18 },
    { range: '2-4 hours', count: 8 },
    { range: '>4 hours', count: 3 },
  ]);
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Completion Time Distribution</CardTitle>
        <CardDescription>
          Time spent by users to complete modules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={timeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="range"
              >
                {timeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  return [`${value} users`, props.payload.range];
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for top performing users
const TopPerformingUsersChart = () => {
  // Sample data - in a real app, this would come from an API call
  const [topUsers, setTopUsers] = useState([
    { name: 'John Doe', avgScore: 95, completions: 12 },
    { name: 'Jane Smith', avgScore: 92, completions: 15 },
    { name: 'Alex Johnson', avgScore: 90, completions: 8 },
    { name: 'Maria Garcia', avgScore: 88, completions: 10 },
    { name: 'David Lee', avgScore: 85, completions: 9 },
  ]);
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Top Performing Users</CardTitle>
        <CardDescription>
          Users with highest average scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topUsers}
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }} 
                width={70}
              />
              <Tooltip 
                formatter={(value, name) => {
                  return [`${value}${name === 'avgScore' ? '%' : ''}`, 
                    name === 'avgScore' ? 'Average Score' : 'Completions'];
                }} 
              />
              <Legend />
              <Bar 
                dataKey="avgScore" 
                name="Average Score" 
                fill="#4e46e5"
                radius={[0, 4, 4, 0]}
              />
              <Bar 
                dataKey="completions" 
                name="Completions" 
                fill="#10b981"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const TrainingReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("overview");
  
  // Fetch training statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const response = await apiService.getTrainingStats();
      return response.data;
    }
  });
  
  // Fetch all training modules
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ['training-modules'],
    queryFn: async () => {
      const response = await apiService.getTrainingModules({ published: true });
      return response.data;
    }
  });
  
  const handleExport = () => {
    // Generate CSV data
    const csvContent = `data:text/csv;charset=utf-8,${generateCSVData()}`;
    const encodedUri = encodeURI(csvContent);
    
    // Create download link and trigger click
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `training-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const generateCSVData = () => {
    // This would be implemented to format data as CSV
    if (!statsData) return '';
    
    const headers = ['Module', 'Completion Count', 'Average Score'];
    const rows = statsData.modules.map((module: any) => 
      [module.title, module.completionCount, module.averageScore].join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  };
  
  if (statsLoading || modulesLoading) {
    return <div className="p-6">
      <PageHeader title="Training Reports" description="Visualize training data and user progress" />
      <div className="grid gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>;
  }
  
  return (
    <div className="p-6">
      <PageHeader title="Training Reports" description="Visualize training data and user progress" />
      
      <div className="flex flex-col-reverse md:flex-row gap-4 justify-between items-start mb-6 mt-6">
        <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="modules">
              <Book className="h-4 w-4 mr-2" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-full md:w-60">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modulesData?.map((module: TrainingModule) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-60">
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange} 
            />
          </div>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Render different views based on selectedView */}
      <TabsContent value="overview" className="m-0">
        {statsData && <KeyMetrics stats={statsData} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statsData && <ModulePerformanceChart modules={statsData.modules} />}
          
          <div className="grid grid-cols-1 gap-6">
            {modulesData && <DifficultyDistributionChart modules={modulesData} />}
            {modulesData && <TopCategoriesChart modules={modulesData} />}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="modules" className="m-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statsData && <ModuleCompletionRateChart modules={statsData.modules} />}
          {statsData && <ModuleScoreDistributionChart modules={statsData.modules} />}
        </div>
        
        <div className="mt-6">
          {modulesData && (
            <ModulePerformanceRadarChart 
              modules={modulesData}
              selectedModuleId={selectedModule}
            />
          )}
        </div>
        
        {selectedModule !== 'all' && modulesData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const module = modulesData.find(m => m.id === selectedModule);
                  if (!module) return <p>Module not found</p>;
                  
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Category</h3>
                        <p>{module.category}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Difficulty</h3>
                        <p className="capitalize">{module.difficulty}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Duration</h3>
                        <p>{module.estimatedDuration} minutes</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Questions</h3>
                        <p>{module.questions.length} questions</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Passing Score</h3>
                        <p>{module.passingScore}%</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Tags</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {module.tags.map(tag => (
                            <span key={tag} className="bg-secondary text-xs px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Completion Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const module = modulesData.find(m => m.id === selectedModule);
                  const moduleStats = statsData?.modules.find(m => m.id === selectedModule);
                  
                  if (!module || !moduleStats) return <p>Statistics not available</p>;
                  
                  return (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Completions</h3>
                          <p className="text-2xl font-bold">{moduleStats.completionCount}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Average Score</h3>
                          <p className="text-2xl font-bold">{moduleStats.averageScore}%</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">Score Distribution</h3>
                        <div className="bg-secondary h-3 rounded-full w-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${moduleStats.averageScore}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="users" className="m-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserProgressTimelineChart />
          <UserScoreDistributionChart />
        </div>
        
        <div className="grid grid-cols-1 gap-6 mt-6">
          <TopPerformingUsersChart />
          <CompletionTimeDistributionChart />
        </div>
      </TabsContent>
      
    </div>
  );
};

export default TrainingReportsPage; 