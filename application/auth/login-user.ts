import type { CreateSession } from "./create-session";
import { AuthError } from "@/domain/auth/errors";
import type { AuthResult, LoginUserInput } from "@/domain/auth/model";
import type { PasswordHasher, UserRepository } from "@/domain/auth/ports";
import { validateUsername } from "@/domain/auth/validation";

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly sessions: CreateSession,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthResult> {
    const username = validateUsername(input.username);
    const user = await this.users.findByUsername(username);

    if (!user || !(await this.passwords.verify(input.password, user.passwordHash))) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "Неверный логин или пароль.",
      );
    }

    const session = await this.sessions.execute(user.id);
    const publicUser = {
      id: user.id,
      guildId: user.guildId,
      guildName: user.guildName,
      username: user.username,
      displayName: user.displayName,
      realName: user.realName,
      role: user.role,
      createdAt: user.createdAt,
    };

    return {
      user: publicUser,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }
}
