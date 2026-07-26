import { CreateSession } from "@/application/auth/create-session";
import { GetSession } from "@/application/auth/get-session";
import { LoginUser } from "@/application/auth/login-user";
import { LogoutUser } from "@/application/auth/logout-user";
import { RegisterUser } from "@/application/auth/register-user";
import { D1SessionRepository } from "@/infrastructure/auth/d1-session-repository";
import { D1UserRepository } from "@/infrastructure/auth/d1-user-repository";
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
const createSession = new CreateSession(sessions, tokens, clock);

export const authUseCases = {
  register: new RegisterUser(users, passwords, createSession, ids, clock),
  login: new LoginUser(users, passwords, createSession),
  getSession: new GetSession(sessions, tokens, clock),
  logout: new LogoutUser(sessions, tokens),
};
