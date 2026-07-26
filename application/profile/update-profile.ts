import type { AuthUser, UpdateProfileInput } from "@/domain/auth/model";
import type { ProfileRepository } from "@/domain/auth/ports";
import {
  validateDisplayName,
  validateRealName,
} from "@/domain/auth/validation";

export class UpdateProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<AuthUser> {
    return this.profiles.updateProfile(userId, {
      displayName: validateDisplayName(input.displayName),
      realName: validateRealName(input.realName),
    });
  }
}
