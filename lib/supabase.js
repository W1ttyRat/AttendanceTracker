import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export async function getOrCreateAnonymousSession() {
  const { data: existingSession, error: existingSessionError } =
    await supabase.auth.getSession();

  if (existingSessionError) {
    throw existingSessionError;
  }

  if (existingSession.session) {
    return existingSession.session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getCurrentUserId() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("An anonymous Supabase session is required.");
  }

  return session.user.id;
}