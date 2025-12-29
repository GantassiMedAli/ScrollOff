ScrollOff Backend (local dev notes)

Setup

1. Copy `.env.example` to `.env` and fill in your database credentials and a strong `JWT_SECRET`.

2. Install dependencies:
   npm install

3. Run locally in development (auto-reload):
   npm run dev

JWT / Token notes

- The server expects JWT tokens in the `Authorization` header as `Bearer <token>`, or in the `x-access-token` header, or (for convenience/testing) in the request body as `token`.
- If `JWT_SECRET` is not set the server will use a development fallback and print a warning; set `JWT_SECRET` in `.env` to avoid token validation mismatches across environments.
- When token verification fails the server returns HTTP 401 with `{ error: "Token mismatch" }` to be compatible with some clients that expect that message.

Troubleshooting

- If your admin login succeeds (200 + token returned) but subsequent protected requests fail with `401 Token mismatch`, check that:
  - The frontend sends the `Authorization: Bearer <token>` header (it does by default via the admin service).
  - `JWT_SECRET` in your `.env` is set and the server was restarted after setting it.
  - The token has not expired (login token expires in 24 hours by default).
