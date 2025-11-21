import React from 'react';
import { ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVoteCounts, useCastVote } from '@/hooks/useVotes';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({ isOpen, onClose }) => {
  const { data: voteCounts, isLoading, error } = useVoteCounts();
  const castVote = useCastVote();

  const handleVote = (voteType: 'up' | 'down') => {
    castVote.mutate(voteType, {
      onSuccess: () => {
        // Modal stays open so user can see updated results
      }
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sistema de Votación
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Cargando...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sistema de Votación
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-destructive">Error al cargar votos</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const upVotes = voteCounts?.up || 0;
  const downVotes = voteCounts?.down || 0;
  const totalVotes = upVotes + downVotes;
  const upPercentage = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0;
  const downPercentage = totalVotes > 0 ? (downVotes / totalVotes) * 100 : 0;
  const userVote = voteCounts?.user_vote;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sistema de Votación
          </DialogTitle>
          <DialogDescription>
            ¿Qué te parece nuestra aplicación?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {totalVotes === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  ¡Sé el primero en votar!
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu opinión nos ayuda a mejorar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Positivos</span>
                  </div>
                  <span className="text-muted-foreground">
                    {upVotes} ({upPercentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={upPercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Negativos</span>
                  </div>
                  <span className="text-muted-foreground">
                    {downVotes} ({downPercentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={downPercentage} className="h-2 bg-red-100" />
              </div>

              <div className="text-center text-sm text-muted-foreground pt-2">
                Total de votos: {totalVotes}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => handleVote('up')}
              disabled={castVote.isPending}
              className="flex-1"
              variant={userVote === 'up' ? 'default' : 'outline'}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {userVote === 'up' ? 'Tu voto' : 'Me gusta'}
            </Button>
            <Button
              onClick={() => handleVote('down')}
              disabled={castVote.isPending}
              className="flex-1"
              variant={userVote === 'down' ? 'default' : 'outline'}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              {userVote === 'down' ? 'Tu voto' : 'No me gusta'}
            </Button>
          </div>

          {userVote && (
            <p className="text-xs text-center text-muted-foreground">
              Puedes cambiar tu voto en cualquier momento
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
