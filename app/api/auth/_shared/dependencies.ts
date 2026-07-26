import { CreateSession } from "@/application/auth/create-session";
import { GetSession } from "@/application/auth/get-session";
import { LoginUser } from "@/application/auth/login-user";
import { LogoutUser } from "@/application/auth/logout-user";
import { RegisterUser } from "@/application/auth/register-user";
import { UpdateProfile } from "@/application/profile/update-profile";
import { LinkDiscordProfile } from "@/application/profile/link-discord-profile";
import { DisconnectDiscordProfile } from "@/application/profile/disconnect-discord-profile";
import { D1SessionRepository } from "@/infrastructure/auth/d1-session-repository";
import { D1UserRepository } from "@/infrastructure/auth/d1-user-repository";
import { RuntimeRegistrationIdentifier } from "@/infrastructure/auth/runtime-registration-identifier";
import { WebCryptoPasswordHasher } from "@/infrastructure/auth/web-crypto-password-hasher";
import { WebCryptoSessionToken } from "@/infrastructure/auth/web-crypto-session-token";
import {
  CryptoIdGenerator,
  SystemClock,
} from "@/infrastructure/system/system-services";

const users = new D1UserRepository();
const sessions = new D1SessionRepository();
const passwords = new WebCryptoPasswordHasher();
const tokens = new WebCryptoSessionToken();
const clock = new SystemClock();
const ids = new CryptoIdGenerator();
const registrationIdentifiers = new RuntimeRegistrationIdentifier();
const createSession = new CreateSession(sessions, tokens, clock);

export const authUseCases = {
  register: new RegisterUser(
    users,
    passwords,
    createSession,
    ids,
    clock,
    registrationIdentifiers,
  ),
  login: new LoginUser(users, passwords, createSession),
  getSession: new GetSession(sessions, tokens, clock),
  logout: new LogoutUser(sessions, tokens),
  updateProfile: new UpdateProfile(users),
  linkDiscordProfile: new LinkDiscordProfile(users),
  disconnectDiscordProfile: new DisconnectDiscordProfile(users),
};
