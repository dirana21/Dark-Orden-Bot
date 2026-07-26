import type {
  AuthUser,
  LinkDiscordProfileInput,
} from "@/domain/auth/model";
import type { ProfileRepository } from "@/domain/auth/ports";

export class LinkDiscordProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  execute(
    userId: string,
    profile: LinkDiscordProfileInput,
  ): Promise<AuthUser> {
    return this.profiles.linkDiscord(userId, profile);
  }
}
