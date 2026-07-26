import type {
  Clock,
  SessionRepository,
  SessionTokenService,
} from "@/domain/auth/ports";

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export class CreateSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string) {
    const now = this.clock.now();
    const expiresAt = now + SESSION_LIFETIME_MS;
    const token = this.tokens.generate();
    const tokenHash = await this.tokens.hash(token);

    await this.sessions.deleteExpired(now);
    await this.sessions.create(userId, tokenHash, now, expiresAt);

    return { token, expiresAt };
  }
}
