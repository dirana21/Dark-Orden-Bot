import type { Clock, IdGenerator } from "@/domain/auth/ports";

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
