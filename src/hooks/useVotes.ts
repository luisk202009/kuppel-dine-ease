import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export type VoteType = 'up' | 'down';

interface VoteCounts {
  up: number;
  down: number;
  total: number;
  user_vote?: VoteType | null;
}

export const useVoteCounts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['votes', 'counts'],
    queryFn: async (): Promise<VoteCounts> => {
      const { data, error } = await supabase.rpc('get_vote_counts');
      
      if (error) {
        console.error('Error fetching vote counts:', error);
        throw error;
      }

      return data as unknown as VoteCounts;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });

  // Set up realtime subscription for vote changes
  useEffect(() => {
    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        () => {
          // Refetch vote counts when any vote changes
          queryClient.invalidateQueries({ queryKey: ['votes', 'counts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useCastVote = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voteType: VoteType) => {
      const { data, error } = await supabase.rpc('cast_vote', { vote_type: voteType });
      
      if (error) {
        throw error;
      }

      return data as unknown as VoteCounts;
    },
    onSuccess: (data) => {
      // Update the query cache with the new data
      queryClient.setQueryData(['votes', 'counts'], data);
      
      toast({
        title: "¡Voto registrado!",
        description: `Tu voto ha sido registrado correctamente.`,
      });
    },
    onError: (error: any) => {
      console.error('Error casting vote:', error);
      toast({
        title: "Error al votar",
        description: error.message || "No se pudo registrar tu voto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  });
};

export const useVoteHistory = () => {
  return useQuery({
    queryKey: ['votes', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          vote,
          created_at,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};