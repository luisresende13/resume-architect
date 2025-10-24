
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Document } from '../types';
import { supabase } from '../services/supabaseClient';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && document) {
      setIsLoading(true);
      supabase.storage
        .from('documents')
        .download(document.storage_path)
        .then(({ data, error }) => {
          if (error) throw error;
          return data.text();
        })
        .then(text => {
          setContent(text);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error downloading document:', error);
          setContent('Failed to load document content.');
          setIsLoading(false);
        });
    } else {
      setContent('');
    }
  }, [isOpen, document]);

  if (!document) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.name}>
      <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
        {isLoading ? 'Loading...' : content}
      </pre>
    </Modal>
  );
};
