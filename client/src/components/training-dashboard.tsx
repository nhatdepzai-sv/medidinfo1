import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, Square, BarChart3, Brain, RefreshCw, Pause, Target, Database, Image } from 'lucide-react';

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

  useEffect(() => {
    fetchStats();
    fetchProgress();

    const interval = setInterval(() => {
      fetchProgress();
      fetchStats();
    }, 5000);

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
        fetchStats();
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
          <Badge variant={stats?.backgroundTraining?.isTraining ? "default" : "secondary"}>
            {stats?.backgroundTraining?.isTraining ? "🔥 TRAINING ACTIVE" : "⏸️ PAUSED"}
          </Badge>
          <Button onClick={refreshStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={toggleTraining} variant={stats?.backgroundTraining?.isTraining ? "destructive" : "default"}>
            {stats?.backgroundTraining?.isTraining ? (
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
          <CardTitle>Training Information</CardTitle>
          <CardDescription>About the mass training system</CardDescription>
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
        </CardContent>
      </Card>
    </div>
  );
}