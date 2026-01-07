import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserService } from '@/lib/app-data';

const normalizeId = (id: unknown) => String(id ?? '');

export function useBlockedUsers(currentUserId?: string) {
  const normalizedCurrentUserId = normalizeId(currentUserId);
  const disabled = !normalizedCurrentUserId || normalizedCurrentUserId === 'current-user';

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (disabled) {
      setBlockedUserIds([]);
      return;
    }

    const me = await UserService.getUserById(normalizedCurrentUserId);
    const ids = Array.isArray(me?.blockedUsers) ? me!.blockedUsers.map(normalizeId).filter(Boolean) : [];
    setBlockedUserIds(ids);
  }, [disabled, normalizedCurrentUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onUpdated = () => {
      void refresh();
    };

    window.addEventListener('chitz:blocked-users-updated', onUpdated as any);
    return () => window.removeEventListener('chitz:blocked-users-updated', onUpdated as any);
  }, [refresh]);

  const blockedSet = useMemo(() => new Set(blockedUserIds.map(normalizeId)), [blockedUserIds]);

  const isBlocked = useCallback(
    (userId: string) => blockedSet.has(normalizeId(userId)),
    [blockedSet]
  );

  const blockUser = useCallback(
    async (targetUserId: string) => {
      if (disabled) return;
      await UserService.blockUser(normalizedCurrentUserId, normalizeId(targetUserId));
    },
    [disabled, normalizedCurrentUserId]
  );

  const unblockUser = useCallback(
    async (targetUserId: string) => {
      if (disabled) return;
      await UserService.unblockUser(normalizedCurrentUserId, normalizeId(targetUserId));
    },
    [disabled, normalizedCurrentUserId]
  );

  const toggleBlockUser = useCallback(
    async (targetUserId: string) => {
      if (isBlocked(targetUserId)) {
        await unblockUser(targetUserId);
      } else {
        await blockUser(targetUserId);
      }
    },
    [blockUser, isBlocked, unblockUser]
  );

  return {
    blockedUserIds,
    isBlocked,
    blockUser,
    unblockUser,
    toggleBlockUser,
    refresh,
    disabled,
  };
}
