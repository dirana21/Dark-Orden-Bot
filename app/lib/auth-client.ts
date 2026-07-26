import type { AuthUser } from "@/domain/auth/model";

interface UserResponse {
  user: AuthUser | null;
  error?: string;
}

async function parse(response: Response): Promise<UserResponse> {
  const body = (await response.json()) as UserResponse;
  if (!response.ok) {
    throw new Error(body.error ?? "Не удалось выполнить запрос.");
  }
  return body;
}

export interface AuthGateway {
  getSession(): Promise<AuthUser | null>;
  login(username: string, password: string): Promise<AuthUser>;
  register(
    displayName: string,
    username: string,
    password: string,
    guildIdentifier: string,
  ): Promise<AuthUser>;
  updateProfile(
    displayName: string,
    realName: string,
  ): Promise<AuthUser>;
  logout(): Promise<void>;
}

export class HttpAuthGateway implements AuthGateway {
  async getSession(): Promise<AuthUser | null> {
    return (await parse(await fetch("/api/auth/session", { cache: "no-store" })))
      .user;
  }

  async login(username: string, password: string): Promise<AuthUser> {
    const result = await parse(
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),
    );
    if (!result.user) {
      throw new Error("Сессия не была создана.");
    }
    return result.user;
  }

  async register(
    displayName: string,
    username: string,
    password: string,
    guildIdentifier: string,
  ): Promise<AuthUser> {
    const result = await parse(
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          password,
          guildIdentifier,
        }),
      }),
    );
    if (!result.user) {
      throw new Error("Сессия не была создана.");
    }
    return result.user;
  }

  async updateProfile(
    displayName: string,
    realName: string,
  ): Promise<AuthUser> {
    const result = await parse(
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, realName }),
      }),
    );
    if (!result.user) {
      throw new Error("Не удалось обновить профиль.");
    }
    return result.user;
  }

  async logout(): Promise<void> {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Не удалось завершить сессию.");
    }
  }
}
