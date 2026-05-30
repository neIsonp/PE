import { cookies } from "next/headers";

const tokenKey = "caca_auth_token";

export async function getServerToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey)?.value;
  return token ?? null;
}
