import { supabase } from './supabaseClient';
import { Document, MasterProfile, SavedJobDescription, SavedResume } from '../types';

// Documents
export const getDocuments = async () => {
  const { data, error } = await supabase.from('documents').select('*');
  if (error) throw error;
  return data as Document[];
};

export const addDocument = async (file: File) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const filePath = `${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('documents').insert([{
    user_id: user.id,
    name: file.name,
    type: file.type,
    storage_path: filePath,
    status: 'uploaded',
  }]).select();

  if (error) throw error;
  return data[0] as Document;
};

export const deleteDocument = async (id: string, storage_path: string) => {
  const { error: deleteError } = await supabase.storage.from('documents').remove([storage_path]);
  if (deleteError) throw deleteError;

  const { error } = await supabase.from('documents').delete().match({ id });
  if (error) throw error;
};

// Master Profile
export const getMasterProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('master_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return data as MasterProfile | null;
};

export const updateMasterProfile = async (profile: Partial<MasterProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('master_profiles')
        .upsert({ ...profile, user_id: user.id })
        .select()
        .single();
    
    if (error) throw error;
    return data as MasterProfile;
};

// Job Descriptions
export const getJobDescriptions = async () => {
  const { data, error } = await supabase.from('job_descriptions').select('*');
  if (error) throw error;
  return data as SavedJobDescription[];
};

export const addJobDescription = async (job: Omit<SavedJobDescription, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('job_descriptions').insert([{ ...job, user_id: user.id }]).select();
    if (error) throw error;
    return data[0] as SavedJobDescription;
};

export const deleteJobDescription = async (id: string) => {
    const { error } = await supabase.from('job_descriptions').delete().match({ id });
    if (error) throw error;
};

// Resumes
export const getResumes = async () => {
  const { data, error } = await supabase.from('resumes').select('*');
  if (error) throw error;
  return data as SavedResume[];
};

export const addResume = async (resume: Omit<SavedResume, 'id' | 'createdAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('resumes').insert([{ ...resume, user_id: user.id }]).select();
    if (error) throw error;
    return data[0] as SavedResume;
};

export const deleteResume = async (id: string) => {
    const { error } = await supabase.from('resumes').delete().match({ id });
    if (error) throw error;
};
