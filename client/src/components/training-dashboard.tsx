import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, Square, BarChart3, Brain } from 'lucide-react';

interface TrainingProgress {
  processed: string;
  target: string;
  percentage: string;
  successRate: string;
  isTraining: boolean;
  remainingImages: string;
}

interface AIStats {
  accuracy: number;
  trainingPoints: number;
  lastUpdated: string;
  massTraining: {
    processed: number;
    target: number;
    successRate: number;
    isTraining: boolean;
  };
}

export function TrainingDashboard() {
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch initial stats
    fetchStats();

    // Set up polling for progress updates
    const interval = setInterval(() => {
      fetchProgress();
      fetchStats();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/mass-training-progress');
      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to fetch training progress:', error);
    }
  };

  const startMassTraining = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/start-mass-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Mass training started:', data.message);
        fetchProgress();
      }
    } catch (error) {
      console.error('Failed to start mass training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMassTraining = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stop-mass-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Mass training stopped');
        fetchProgress();
      }
    } catch (error) {
      console.error('Failed to stop mass training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startImageRecognitionTraining = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/train-image-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Image recognition training completed:', data.report);
        alert(`✅ AI Image Recognition Training Completed!\n\nPhases trained:\n${data.report.trainingPhases.join('\n')}\n\nNew capabilities:\n${data.report.capabilities.join('\n')}`);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to start image recognition training:', error);
      alert('❌ Image recognition training failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Training Dashboard</h1>
          <p className="text-muted-foreground">
            Mass training system for processing millions of medication images
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={startMassTraining}
            disabled={isLoading || (stats?.massTraining?.isTraining ?? false)}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Start Mass Training
          </Button>
          <Button
            onClick={stopMassTraining}
            disabled={isLoading || !(stats?.massTraining?.isTraining ?? false)}
            variant="destructive"
            size="lg"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Training
          </Button>
          <Button
            onClick={startImageRecognitionTraining}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Brain className="w-4 h-4 mr-2" />
            Train Image Recognition
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.accuracy ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              Current model accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Points</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.trainingPoints?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total data points processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Status</CardTitle>
            <div className="h-4 w-4">
              {stats?.massTraining?.isTraining ? (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={stats?.massTraining?.isTraining ? "default" : "secondary"}>
                {stats?.massTraining?.isTraining ? "Active" : "Idle"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Mass training system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress?.successRate ?? stats?.massTraining?.successRate?.toFixed(1) ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Training success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Mass Training Progress</CardTitle>
            <CardDescription>
              Processing {progress.target} medication images to enhance AI recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {progress.processed} / {progress.target}</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={parseFloat(progress.percentage)} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Processed:</span> {progress.processed}
              </div>
              <div>
                <span className="font-medium">Remaining:</span> {progress.remainingImages}
              </div>
              <div>
                <span className="font-medium">Success Rate:</span> {progress.successRate}%
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={progress.isTraining ? "default" : "secondary"}>
                  {progress.isTraining ? "Training" : "Stopped"}
                </Badge>
              </div>
            </div>

            {progress.isTraining && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Training in progress:</strong> The AI is learning from millions of 
                  medication images including synthetic labels, real-world photo conditions, 
                  and edge cases. This process will significantly improve recognition accuracy.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Information</CardTitle>
          <CardDescription>
            About the mass training system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Training Phases</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Phase 1: Medication database variations (100K)</li>
                <li>• Phase 2: Synthetic medication labels (500K)</li>
                <li>• Phase 3: Real-world photo conditions (300K)</li>
                <li>• Phase 4: Edge cases and corrupted text (100K)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Expected Improvements</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 95%+ accuracy on clear medication labels</li>
                <li>• Better handling of poor lighting conditions</li>
                <li>• Improved recognition of damaged/partial text</li>
                <li>• Enhanced multi-language support</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Mass training will run in the background and may take 
              24-48 hours to complete all 1 million images. The AI will become progressively 
              smarter as training continues.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}