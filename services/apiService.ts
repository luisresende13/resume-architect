import { supabase } from './supabaseClient';
import { Document, MasterProfile, Opportunity, ResumeDraft } from '../types';

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
export const updateDocument = async (id: string, name: string) => {
  const { data, error } = await supabase
    .from('documents')
    .update({ name })
    .match({ id })
    .select();

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

// Opportunities
export const getOpportunities = async () => {
  const { data, error } = await supabase.from('opportunities').select('*');
  if (error) throw error;
  return data as Opportunity[];
};
export const getOpportunity = async (id: string) => {
  const { data, error } = await supabase.from('opportunities').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Opportunity;
};

export const updateOpportunity = async (id: string, opportunityData: Pick<Opportunity, 'title' | 'job_description'>) => {
    const { data, error } = await supabase
        .from('opportunities')
        .update(opportunityData)
        .match({ id })
        .select()
        .single();
    if (error) throw error;
    return data as Opportunity;
};

export const addOpportunity = async (opportunityData: Pick<Opportunity, 'title' | 'job_description'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('opportunities').insert([{ ...opportunityData, user_id: user.id }]).select().single();
    if (error) throw error;
    return data as Opportunity;
};

export const deleteOpportunity = async (id: string) => {
    const { error } = await supabase.from('opportunities').delete().match({ id });
    if (error) throw error;
};

export const updateResumeDraft = async (id: string, draftData: Partial<ResumeDraft>) => {
    const { data, error } = await supabase
        .from('resume_drafts')
        .update(draftData)
        .match({ id })
        .select()
        .single();
    if (error) throw error;
    return data as ResumeDraft;
};

export const duplicateResumeDraft = async (draftId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First, get the original draft
    const originalDraft = await getResumeDraft(draftId);

    // Create a new draft with a modified name
    const newDraftData = {
        ...originalDraft,
        name: `${originalDraft.name} (Copy)`,
    };
    delete newDraftData.id; // Remove the original ID
    delete newDraftData.created_at; // Let the DB handle the new timestamp
    delete newDraftData.updated_at;

    const { data, error } = await supabase
        .from('resume_drafts')
        .insert([{ ...newDraftData, user_id: user.id }])
        .select()
        .single();

    if (error) throw error;
    return data as ResumeDraft;
};

// Resume Drafts
export const getResumeDraft = async (id: string) => {
  const { data, error } = await supabase.from('resume_drafts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as ResumeDraft;
};
export const getResumeDrafts = async (opportunityId: string) => {
  const { data, error } = await supabase.from('resume_drafts').select('*').eq('opportunity_id', opportunityId);
  if (error) throw error;
  return data as ResumeDraft[];
};

export const addResumeDraft = async (draftData: Pick<ResumeDraft, 'opportunity_id' | 'name' | 'markdown_content'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase.from('resume_drafts').insert([{ ...draftData, user_id: user.id }]).select();
    if (error) throw error;
    return data[0] as ResumeDraft;
};

export const deleteResumeDraft = async (id: string) => {
    const { error } = await supabase.from('resume_drafts').delete().match({ id });
    if (error) throw error;
};
