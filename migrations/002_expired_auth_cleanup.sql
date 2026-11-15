CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_mangaforge_auth_data()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
    DELETE FROM public.otp_verifications WHERE expires_at <= now();
    DELETE FROM public.password_reset_tokens WHERE expires_at <= now();
    DELETE FROM public.user_sessions WHERE expires_at <= now();
END;
$function$;

DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM cron.job
        WHERE jobname = 'mangaforge-expired-auth-cleanup'
    ) THEN
        PERFORM cron.schedule(
            'mangaforge-expired-auth-cleanup',
            '* * * * *',
            'SELECT public.cleanup_mangaforge_auth_data();'
        );
    END IF;
END;
$block$;
