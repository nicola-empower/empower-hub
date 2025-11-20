// src/app/admin/[clientId]/documents/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { v4 as uuidv4 } from 'uuid';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaUpload, FaTrash, FaArrowLeft } from 'react-icons/fa';

// --- Type Definitions ---
type Document = {
  id: string;
  name: string;
  created_at: string;
  file_url: string;
  file_path: string;
  status: 'Awaiting Review' | 'Viewed';
};

// --- Helper Components ---
const DocumentIcon = ({ fileName }: { fileName: string }) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FaFilePdf className="w-8 h-8 text-red-500" />;
    if (extension === 'doc' || extension === 'docx') return <FaFileWord className="w-8 h-8 text-blue-500" />;
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return <FaFileImage className="w-8 h-8 text-green-500" />;
    return <FaFileAlt className="w-8 h-8 text-gray-500" />;
};

// --- Main Admin Documents Page ---
export default function AdminDocumentsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const { showToast, Toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the upload form
  const [uploading, setUploading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!clientId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Could not fetch documents.', 'error');
      } else {
        setDocuments(data as Document[]);
      }
      setLoading(false);
    };
    fetchDocuments();

    // --- REAL-TIME SUBSCRIPTION ---
    const channel = supabase
      .channel(`documents-for-${clientId}`)
      .on<Document>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          // When an update is received, update the specific document in our local state
          setDocuments((currentDocs) =>
            currentDocs.map((doc) =>
              doc.id === payload.new.id ? payload.new : doc
            )
          );
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  // THE FIX: Removed showToast from the dependency array to prevent the loop
  }, [clientId]);

  const handleAdminDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = (e.target as HTMLFormElement).elements.namedItem('admin-file-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      showToast('Please select a file.', 'error');
      return;
    }
    if (!documentTitle.trim()) {
      showToast('Please provide a title.', 'error');
      return;
    }

    setUploading(true);
    try {
      const filePath = `${clientId}/${uuidv4()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('clientdocuments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('clientdocuments').getPublicUrl(filePath);

      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          client_id: clientId,
          name: documentTitle,
          file_url: publicUrlData.publicUrl,
          file_path: filePath,
          status: 'Awaiting Review',
        })
        .select()
        .single();
      
      if (insertError) throw insertError;

      setDocuments(prev => [newDoc as Document, ...prev]);
      setDocumentTitle('');
      fileInput.value = '';
      showToast('Document uploaded successfully!', 'success');
    } catch (error: any) {
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    const { error: storageError } = await supabase.storage.from('clientdocuments').remove([doc.file_path]);
    if (storageError) {
        showToast('Failed to delete file from storage.', 'error');
        return;
    }

    const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
    if (dbError) {
        showToast('Failed to delete document record.', 'error');
    } else {
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        showToast('Document deleted.', 'success');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Fragment>
      <Toast />
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full">
          <FaArrowLeft />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Manage Documents</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold mb-4">Client Documents</h3>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="bg-slate-50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <DocumentIcon fileName={doc.file_url} />
                    <div>
                        <p className="font-semibold">{doc.name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${doc.status === 'Viewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {doc.status}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200">View</a>
                    <button onClick={() => handleDeleteDocument(doc)} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold mb-4">Upload New Document</h3>
          <form onSubmit={handleAdminDocumentUpload} className="space-y-4">
            <input type="text" value={documentTitle} onChange={e => setDocumentTitle(e.target.value)} placeholder="Document Title" className="w-full p-2 border rounded-lg" required />
            <input type="file" name="admin-file-upload" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            <button type="submit" disabled={uploading} className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50">
              <FaUpload /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      </div>
    </Fragment>
  );
}
