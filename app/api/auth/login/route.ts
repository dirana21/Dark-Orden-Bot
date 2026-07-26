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
      password?: string;
    };
    const result = await authUseCases.login.execute({
      username: input.username ?? "",
      password: input.password ?? "",
    });

    return Response.json(
      { user: result.user },
      {
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
