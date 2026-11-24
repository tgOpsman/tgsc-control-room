import { supabase } from "@/integrations/supabase/client";
export const BUCKET = "control-room-files";
export async function uploadFile(file: Blob, folder: string, ext = "jpg") {
  const { data } = await supabase.rpc("current_room" as never);
  const room = data as unknown as string;
  if (!room) throw new Error("No control room assigned");
  const path = `${room}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}
// Short-lived so removed room members lose photo access almost immediately.
export const SIGNED_URL_TTL = 60;
export async function signedUrl(path: string) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? "";
}
