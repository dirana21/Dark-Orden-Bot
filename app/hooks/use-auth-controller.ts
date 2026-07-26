"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/domain/auth/model";
import { HttpAuthGateway } from "@/app/lib/auth-client";

export function useAuthController() {
  const gateway = useMemo(() => new HttpAuthGateway(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    gateway
      .getSession()
      .then((sessionUser) => {
        if (active) {
          setUser(sessionUser);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsBooting(false);
        }
      });
    return () => {
      active = false;
    };
  }, [gateway]);

  const run = useCallback(
    async (action: () => Promise<AuthUser>) => {
      setError("");
      setIsSubmitting(true);
      try {
        setUser(await action());
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Не удалось выполнить запрос.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const login = useCallback(
    (username: string, password: string) =>
      run(() => gateway.login(username, password)),
    [gateway, run],
  );

  const register = useCallback(
    (
      displayName: string,
      username: string,
      password: string,
      guildIdentifier: string,
    ) =>
      run(() =>
        gateway.register(displayName, username, password, guildIdentifier),
      ),
    [gateway, run],
  );

  const updateProfile = useCallback(
    async (displayName: string, realName: string) => {
      setError("");
      setIsSubmitting(true);
      try {
        setUser(await gateway.updateProfile(displayName, realName));
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Не удалось сохранить изменения профиля.",
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [gateway],
  );

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await gateway.logout();
      setUser(null);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось выйти из аккаунта.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [gateway]);

  const disconnectDiscord = useCallback(async () => {
    setError("");
    setIsSubmitting(true);
    try {
      setUser(await gateway.disconnectDiscord());
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось отключить Discord.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [gateway]);

  return {
    user,
    isBooting,
    isSubmitting,
    error,
    clearError: () => setError(""),
    login,
    register,
    updateProfile,
    disconnectDiscord,
    logout,
  };
}
