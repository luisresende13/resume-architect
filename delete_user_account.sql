create or replace function delete_user_account()
returns void as $$
begin
  -- Delete all user-related data from the public schema
  delete from public.documents where user_id = auth.uid();
  delete from public.master_profiles where user_id = auth.uid();
  delete from public.opportunities where user_id = auth.uid();
  delete from public.resume_drafts where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();

  -- Finally, delete the user from the auth.users table
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;