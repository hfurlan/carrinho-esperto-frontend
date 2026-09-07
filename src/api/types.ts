/** GET /api/me response. */
export interface CurrentUserResponse {
  subject: string;
  username: string | null;
}
