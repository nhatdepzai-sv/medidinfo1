import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, Square, BarChart3, Brain, RefreshCw, Pause, Target, Database, Image } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

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

interface TrainingStats {
  totalTrainingPoints: number;
  backgroundTraining: {
    isTraining: boolean;
    hoursRemaining: number;
    cyclesCompleted: number;
    intensiveMode: boolean;
    trainingSpeed: number;
  };
  performanceMetrics: {
    accuracy: number;
    ocrSuccessRate: number;
    medicationRecognitionRate: number;
    imageProcessingRate: number;
    confidenceScore: number;
  };
  databaseStats: {
    totalMedications: number;
    categoriesSupported: number;
    languagesSupported: number;
    recentlyAdded: number;
  };
  aiCapabilities: {
    neuralPatterns: number;
    errorCorrections: number;
    contextualPatterns: number;
    medicationFrequency: number;
  };
  syntheticTraining: {
    imagesGenerated: number;
    scenariosProcessed: number;
    ocrChallengesTrained: number;
    packagingVariations: number;
  };
}

export function TrainingDashboard() {
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchProgress();

      const interval = setInterval(() => {
        fetchProgress();
        fetchStats();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/ai-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
    }
  };

  const fetchProgress = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/mass-training-progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to fetch training progress:', error);
    }
  };

  const startMassTraining = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/start-mass-training', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Mass training started:', data.message);
        fetchProgress();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to start mass training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMassTraining = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/stop-mass-training', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Mass training stopped');
        fetchProgress();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to stop mass training:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
    fetchProgress();
  };

  const toggleTraining = () => {
    if (stats?.backgroundTraining.isTraining) {
      stopMassTraining();
    } else {
      startMassTraining();
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-blue-600" />
            Advanced AI Training Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of intensive medication recognition AI training system
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant={progress?.isTraining ? "default" : "secondary"}>
            {progress?.isTraining ? "🔥 TRAINING ACTIVE" : "⏸️ PAUSED"}
          </Badge>
          <Button onClick={refreshStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={toggleTraining} 
            variant={progress?.isTraining ? "destructive" : "default"}
            disabled={isLoading}
          >
            {progress?.isTraining ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Training
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Training
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Training Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Training Progress</CardTitle>
          <CardDescription>Current AI training status and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress: {progress?.processed || 0} / {progress?.target || 0}</span>
              <span>{progress?.percentage || 0}% Complete</span>
            </div>
            <Progress value={parseFloat(progress?.percentage || "0")} className="w-full" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress?.successRate || "0%"}</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalTrainingPoints || 0}</div>
                <div className="text-xs text-muted-foreground">Training Points</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {stats?.performanceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>AI system performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.performanceMetrics.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.performanceMetrics.ocrSuccessRate}%</div>
                <div className="text-xs text-muted-foreground">OCR Success</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.performanceMetrics.medicationRecognitionRate}%</div>
                <div className="text-xs text-muted-foreground">Med Recognition</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Information */}
        <Card>
          <CardHeader>
            <CardTitle>10-Day Automated Training Program</CardTitle>
            <CardDescription>Continuous AI training system running 24/7</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Training Schedule</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Duration: 10 days continuous training</li>
                  <li>• Target: 1,000,000 training samples</li>
                  <li>• Interval: Every 30 seconds (100 samples/batch)</li>
                  <li>• Daily Progress: ~115,700 samples per day</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Expected Improvements</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 95%+ accuracy on clear medication labels</li>
                  <li>• Better handling of poor lighting conditions</li>
                  <li>• Improved recognition of damaged/partial text</li>
                  <li>• Enhanced multi-language support</li>
                  <li>• Advanced OCR pattern recognition</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Automated Training Active:</strong> The system will automatically train the AI model over the next 10 days, 
                processing medication variations, synthetic labels, and edge cases to achieve maximum accuracy.
              </p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}