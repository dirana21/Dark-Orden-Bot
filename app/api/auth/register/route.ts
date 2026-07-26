import { authUseCases } from "../_shared/dependencies";
import {
  authErrorResponse,
  sessionCookie,
  validateMutationRequest,
} from "../_shared/http";

export async function POST(request: Request) {
  const rejected = validateMutationRequest(request);
  if (rejected) {
    return rejected;
  }

  try {
    const input = (await request.json()) as {
      username?: string;
      displayName?: string;
      password?: string;
      guildIdentifier?: string;
    };
    const result = await authUseCases.register.execute({
      username: input.username ?? "",
      displayName: input.displayName ?? "",
      password: input.password ?? "",
      guildIdentifier: input.guildIdentifier ?? "",
    });

    return Response.json(
      { user: result.user },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "Set-Cookie": sessionCookie(
            request,
            result.sessionToken,
            result.expiresAt,
          ),
        },
      },
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
