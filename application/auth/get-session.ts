import type { AuthUser } from "@/domain/auth/model";
import type {
  Clock,
  SessionRepository,
  SessionTokenService,
} from "@/domain/auth/ports";

export class GetSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokenService,
    private readonly clock: Clock,
  ) {}

  async execute(token: string): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }

    return this.sessions.findUserByTokenHash(
      await this.tokens.hash(token),
      this.clock.now(),
    );
  }
}
