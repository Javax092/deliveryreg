import { logoutAction } from "../../login/actions";

export async function GET() {
  await logoutAction();
}
