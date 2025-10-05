
import { TrainingDashboard } from '@/components/training-dashboard';
import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrainingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Check if user is admin
  if (user && (user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You must be an administrator to access the training dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TrainingDashboard />;
}
