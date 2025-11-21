import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VotingModal } from './VotingModal';
import { useVoteCounts } from '@/hooks/useVotes';

export const VotingButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: voteCounts, isLoading } = useVoteCounts();

  const totalVotes = voteCounts ? (voteCounts.up || 0) + (voteCounts.down || 0) : 0;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsModalOpen(true)}
        className="relative"
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        <span className="hidden md:inline">Votar</span>
        {totalVotes > 0 && (
          <Badge 
            variant="secondary" 
            className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
          >
            {totalVotes}
          </Badge>
        )}
      </Button>

      <VotingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
