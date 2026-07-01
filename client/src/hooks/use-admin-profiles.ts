import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Profile } from "@shared/schema";
import { useAuth } from "./use-auth";
import { supabase } from "@/hooks/lib/supabase";
import { AUTH_CONFIG } from "@/config/auth";

type AdminUserDetailsResponse = {
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    role: "user" | "admin";
    isSubscriber: boolean;
    createdAt: string | null;
    lastActiveAt: string | null;
    lastSignInAt: string | null;
  };
  sessions: {
    id: string;
    device: string;
    ipAddress: string | null;
    status: "active" | "expired";
    createdAt: string | null;
    expiresAt: string | null;
  }[];
  sessionsUnavailable: boolean;
  providers: {
    id: string;
    provider: string;
    status: "connected";
    connectedAt: string | null;
    lastSignInAt: string | null;
  }[];
};

function mapProfileDates(profile: any): Profile {
  return {
    ...profile,
    createdAt: profile.created_at ?? profile.createdAt,
    updatedAt: profile.updated_at ?? profile.updatedAt,
  } as Profile;
}

export function useAllProfiles(options?: { enabled?: boolean }) {
  const { isAdmin } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery<Profile[]>({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapProfileDates);
    },
    enabled: isAdmin && enabled,
  });
}

export type PaginatedProfilesResponse = {
  profiles: Profile[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

type UsePaginatedProfilesParams = {
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string;
};

export function usePaginatedProfiles({
  page,
  pageSize,
  searchQuery,
  roleFilter,
}: UsePaginatedProfilesParams) {
  const { isAdmin } = useAuth();

  return useQuery<PaginatedProfilesResponse>({
    queryKey: ["profiles", "paginated", page, pageSize, searchQuery, roleFilter],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const normalizedSearch = searchQuery.trim().replace(/[^\w@.\-\s]/g, "");

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (roleFilter === "subscriber") {
        query = query.eq("is_subscriber", true);
      } else if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      if (normalizedSearch) {
        query = query.or(`email.ilike.%${normalizedSearch}%,full_name.ilike.%${normalizedSearch}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const profiles = (data || []).map(mapProfileDates);
      const total = count ?? 0;

      return {
        profiles,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        page,
        pageSize,
      };
    },
    enabled: isAdmin,
    placeholderData: keepPreviousData,
  });
}

async function fetchWithAuth(url: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = typeof payload?.message === "string" ? payload.message : `Request failed (${response.status})`;

    if (response.status === 401 && message === "Invalid authorization token") {
      await supabase.auth.signOut({ scope: "local" });
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      sessionStorage.removeItem("sb-access-token");
      sessionStorage.removeItem("sb-refresh-token");
      window.location.replace(AUTH_CONFIG.LOGIN_PATH);
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    throw new Error(message);
  }

  return response;
}

export function useAdminUserDetails(userId?: string) {
  const { isAdmin, session } = useAuth();

  return useQuery<AdminUserDetailsResponse>({
    queryKey: ["admin", "user-details", userId],
    queryFn: async () => {
      if (!userId || !session?.access_token) {
        throw new Error("Missing user id or session token");
      }

      const response = await fetchWithAuth(`/api/admin/users/${userId}/details`, session.access_token);
      const contentType = response.headers.get("content-type") ?? "";
      const bodyText = await response.text();

      if (!contentType.includes("application/json")) {
        throw new Error("Réponse API invalide (non JSON). Vérifiez que le backend est bien redémarré et que la route /api/admin/users/:id/details existe.");
      }

      try {
        return JSON.parse(bodyText) as AdminUserDetailsResponse;
      } catch {
        throw new Error("Réponse API invalide (JSON mal formé). Vérifiez les logs backend.");
      }
    },
    enabled: isAdmin && !!userId && !!session?.access_token,
  });
}

export function useRevokeAdminSession(userId?: string) {
  const { isAdmin, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!isAdmin || !session?.access_token || !userId) {
        throw new Error("Admin session required");
      }

      await fetchWithAuth(`/api/admin/users/${userId}/sessions/${sessionId}`, session.access_token, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-details", userId] });
    },
  });
}

export function useRevokeAllAdminSessions(userId?: string) {
  const { isAdmin, session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!isAdmin || !session?.access_token || !userId) {
        throw new Error("Admin session required");
      }

      await fetchWithAuth(`/api/admin/users/${userId}/sessions/revoke-all`, session.access_token, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-details", userId] });
    },
  });
}
