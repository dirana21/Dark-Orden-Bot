import type {
  AuthUser,
  NewUser,
  StoredUser,
  UpdateProfileInput,
} from "./model";

export interface UserRepository {
  findByUsername(username: string): Promise<StoredUser | null>;
  create(user: NewUser): Promise<AuthUser>;
}

export interface ProfileRepository {
  updateProfile(userId: string, profile: UpdateProfileInput): Promise<AuthUser>;
}

export interface SessionRepository {
  create(
    userId: string,
    tokenHash: string,
    createdAt: number,
    expiresAt: number,
  ): Promise<void>;
  findUserByTokenHash(tokenHash: string, now: number): Promise<AuthUser | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteExpired(now: number): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, encodedHash: string): Promise<boolean>;
}

export interface RegistrationIdentifierVerifier {
  matches(candidate: string): Promise<boolean>;
}

export interface SessionTokenService {
  generate(): string;
  hash(token: string): Promise<string>;
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  generate(): string;
}
