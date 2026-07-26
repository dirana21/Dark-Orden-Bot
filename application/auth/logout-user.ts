import type {
  SessionRepository,
  SessionTokenService,
} from "@/domain/auth/ports";

export class LogoutUser {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokenService,
  ) {}

  async execute(token: string): Promise<void> {
    if (!token) {
      return;
    }

    await this.sessions.deleteByTokenHash(await this.tokens.hash(token));
  }
}
