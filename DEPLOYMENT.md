# Production deployment: Vercel + Neon

## 1. Create the Neon database

Create a Neon project and copy its pooled PostgreSQL connection string into
the Vercel `DATABASE_URL` environment variable. Use the connection string
provided by Neon; do not commit it to the repository.

For migrations, use a connection that can run DDL. If the pooled URL does
not support migrations in your Neon configuration, temporarily use Neon’s
direct/unpooled connection for the migration command.

Apply migrations from a trusted local shell or a protected deployment step:

```bash
npx prisma migrate deploy
```

The seed script contains fictional data only and must not be used against a
production database:

```bash
npm run db:seed
```

## 2. Configure Vercel

Import the repository into Vercel and add these environment variables for the
Preview and Production environments as appropriate:

- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BOOTSTRAP_ADMIN_EMAILS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_SITE_URL`

Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS URL, for example
`https://family.example.com`.

## 3. Configure Google OAuth

Add the production callback URL in Google Cloud Console:

```text
https://family.example.com/api/auth/callback/google
```

Keep the local callback URL as well when local development is needed:

```text
http://localhost:3000/api/auth/callback/google
```

Set `BOOTSTRAP_ADMIN_EMAILS` before the first administrator signs in. Remove
or clear the bootstrap list after the initial admin accounts are established.

## 4. Backups and restore

Enable Neon’s backup or point-in-time recovery appropriate to the selected
plan. At minimum:

1. Take a logical backup before schema changes:

   ```bash
   pg_dump "$DATABASE_URL" --format=custom --file=backup.dump
   ```

2. Restore into a separate verification database:

   ```bash
   pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" backup.dump
   ```

3. Run the application checks against the restored database before treating
   the backup as verified.

Never test restore procedures against the live production database.

## 5. Release checks

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Confirm that public pages work signed out, private/admin routes redirect or
reject unauthorized users, and Cloudinary assets are inaccessible until
approved.
