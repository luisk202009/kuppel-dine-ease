import React from 'react';
import { ThumbsUp, ThumbsDown, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVoteCounts, useCastVote, VoteType } from '@/hooks/useVotes';
import { cn } from '@/lib/utils';

interface VotingWidgetProps {
  className?: string;
}

export const VotingWidget: React.FC<VotingWidgetProps> = ({ className }) => {
  const { data: voteCounts, isLoading, error } = useVoteCounts();
  const castVoteMutation = useCastVote();

  const handleVote = async (voteType: VoteType) => {
    await castVoteMutation.mutateAsync(voteType);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sistema de Votación
          </CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-muted rounded flex-1"></div>
              <div className="h-10 bg-muted rounded flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !voteCounts) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TrendingUp className="h-5 w-5" />
            Error en Votación
          </CardTitle>
          <CardDescription>
            No se pudieron cargar los datos de votación
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const upPercentage = voteCounts.total > 0 ? (voteCounts.up / voteCounts.total) * 100 : 0;
  const downPercentage = voteCounts.total > 0 ? (voteCounts.down / voteCounts.total) * 100 : 0;

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sistema de Votación
        </CardTitle>
        <CardDescription>
          ¿Qué opinas del sistema POS?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote Counts Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center text-green-600">
              <ThumbsUp className="h-6 w-6 mr-1" />
              <span className="text-2xl font-bold">{voteCounts.up}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Positivos ({upPercentage.toFixed(0)}%)
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center text-red-600">
              <ThumbsDown className="h-6 w-6 mr-1" />
              <span className="text-2xl font-bold">{voteCounts.down}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Negativos ({downPercentage.toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Total de votos: {voteCounts.total}
            </span>
          </div>
          
          {voteCounts.total > 0 && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${upPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Voting Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={voteCounts.user_vote === 'up' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-colors",
              voteCounts.user_vote === 'up' && "bg-green-600 hover:bg-green-700"
            )}
            onClick={() => handleVote('up')}
            disabled={castVoteMutation.isPending}
          >
            <ThumbsUp className="h-4 w-4" />
            {voteCounts.user_vote === 'up' ? 'Tu voto' : 'Me gusta'}
          </Button>

          <Button
            variant={voteCounts.user_vote === 'down' ? 'destructive' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleVote('down')}
            disabled={castVoteMutation.isPending}
          >
            <ThumbsDown className="h-4 w-4" />
            {voteCounts.user_vote === 'down' ? 'Tu voto' : 'No me gusta'}
          </Button>
        </div>

        {/* User's current vote status */}
        {voteCounts.user_vote && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {voteCounts.user_vote === 'up' 
                ? '👍 Has votado positivo' 
                : '👎 Has votado negativo'
              }
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Puedes cambiar tu voto en cualquier momento
            </p>
          </div>
        )}

        {voteCounts.total === 0 && (
          <div className="text-center text-muted-foreground text-sm">
            ¡Sé el primero en votar! 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
};