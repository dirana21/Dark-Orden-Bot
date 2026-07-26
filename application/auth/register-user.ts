import type { CreateSession } from "./create-session";
import { AuthError } from "@/domain/auth/errors";
import type { AuthResult, RegisterUserInput } from "@/domain/auth/model";
import type {
  Clock,
  IdGenerator,
  PasswordHasher,
  UserRepository,
} from "@/domain/auth/ports";
import {
  validateDisplayName,
  validatePassword,
  validateUsername,
} from "@/domain/auth/validation";

const DARK_ORDEN_GUILD_ID = "dark-orden";

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly sessions: CreateSession,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthResult> {
    const username = validateUsername(input.username);
    const displayName = validateDisplayName(input.displayName);
    const password = validatePassword(input.password);

    if (await this.users.findByUsername(username)) {
      throw new AuthError("USER_EXISTS", "Этот логин уже занят.");
    }

    const user = await this.users.create({
      id: this.ids.generate(),
      guildId: DARK_ORDEN_GUILD_ID,
      username,
      displayName,
      realName: null,
      passwordHash: await this.passwords.hash(password),
      role: "member",
      createdAt: this.clock.now(),
    });
    const session = await this.sessions.execute(user.id);

    return {
      user,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }
}
