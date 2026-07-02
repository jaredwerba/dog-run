import type { SqlFn } from '@/lib/db';

export interface Participant {
  userId: string;
  email: string;
  /* Display name: runner_name for runners, owner_name for owners */
  name: string;
  /* e.g. "Dan (Tank's owner)" for owners, plain name for runners */
  label: string;
}

export interface ConvParticipants {
  owner: Participant;
  runner: Participant;
  bySide(userId: string): { me: Participant; other: Participant } | null;
}

/* Fetch both participants of a conversation with emails + display names */
export async function getConvParticipants(
  sql: SqlFn,
  conversationId: string
): Promise<ConvParticipants | null> {
  const rows = await sql`
    SELECT
      c.owner_id, c.runner_id,
      ou.username AS owner_email, ru.username AS runner_email,
      dp.owner_name, dp.dog_name, rp.runner_name
    FROM conversations c
    JOIN users ou ON ou.id = c.owner_id
    JOIN users ru ON ru.id = c.runner_id
    LEFT JOIN dog_profiles dp ON dp.user_id = c.owner_id
    LEFT JOIN runner_profiles rp ON rp.user_id = c.runner_id
    WHERE c.id = ${conversationId}
  `;
  if (rows.length === 0) return null;
  const r = rows[0];

  const ownerName = (r.owner_name as string) ?? 'A dog owner';
  const dogName = (r.dog_name as string) ?? 'their dog';
  const runnerName = (r.runner_name as string) ?? 'A runner';

  const owner: Participant = {
    userId: r.owner_id as string,
    email: r.owner_email as string,
    name: ownerName,
    label: `${ownerName} (${dogName}'s owner)`,
  };
  const runner: Participant = {
    userId: r.runner_id as string,
    email: r.runner_email as string,
    name: runnerName,
    label: runnerName,
  };

  return {
    owner,
    runner,
    bySide(userId: string) {
      if (userId === owner.userId) return { me: owner, other: runner };
      if (userId === runner.userId) return { me: runner, other: owner };
      return null;
    },
  };
}
