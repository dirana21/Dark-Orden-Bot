import type { AuthUser } from "@/domain/auth/model";
import type { ProfileRepository } from "@/domain/auth/ports";

export class DisconnectDiscordProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  execute(userId: string): Promise<AuthUser> {
    return this.profiles.disconnectDiscord(userId);
  }
}
