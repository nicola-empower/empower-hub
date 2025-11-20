// src/app/dashboard/documents/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaUpload } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions ---
type Document = {
  id: string;
  name: string;
  created_at: string;
  file_url: string;
  file_path: string; // Needed for potential future delete operations
  status: 'Awaiting Review' | 'Viewed';
  due_date?: string | null;
};

// --- Helper Components ---
const DocumentIcon = ({ fileName }: { fileName: string }) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <FaFilePdf className="w-8 h-8 text-red-500" />;
    if (extension === 'doc' || extension === 'docx') return <FaFileWord className="w-8 h-8 text-blue-500" />;
    if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) return <FaFileImage className="w-8 h-8 text-green-500" />;
    return <FaFileAlt className="w-8 h-8 text-gray-500" />;
};

// --- Main Documents Page Component ---
export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, Toast } = useToast();
  
  // --- ADDED STATE FOR UPLOADS ---
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadTitle, setFileUploadTitle] = useState('');

  useEffect(() => {
    const fetchClientDocuments = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Could not fetch documents.', 'error');
      } else if (data) {
        setDocuments(data as Document[]);
      }
      setLoading(false);
    };

    fetchClientDocuments();
  }, []);

  const handleDocumentView = async (docId: string, docStatus: Document['status']) => {
    if (docStatus === 'Awaiting Review') {
        setDocuments(prevDocs => prevDocs.map(doc =>
          doc.id === docId ? { ...doc, status: 'Viewed' } : doc
        ));
        await supabase.from('read_receipts').insert({ document_id: docId });
    }
  };

  // --- ADDED UPLOAD HANDLER FUNCTION ---
  const handleClientFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = (e.target as HTMLFormElement).elements.namedItem('client-file-upload') as HTMLInputElement;
    const files = fileInput?.files;

    if (!files || files.length === 0) {
        showToast('Please select a file to upload.', 'error');
        return;
    }
    if (!fileUploadTitle.trim()) {
        showToast('Please provide a title for your document.', 'error');
        return;
    }
    
    setFileUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showToast('You must be logged in to upload.', 'error');
        setFileUploading(false);
        return;
    }

    try {
        const file = files[0];
        const filePath = `${user.id}/${uuidv4()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('clientdocuments').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('clientdocuments').getPublicUrl(filePath);
        
        const { data: newDoc, error: insertError } = await supabase
            .from('documents')
            .insert({
                client_id: user.id,
                name: fileUploadTitle,
                file_url: publicUrlData.publicUrl,
                file_path: filePath,
                status: 'Awaiting Review',
            })
            .select()
            .single();
        
        if (insertError) throw insertError;

        setDocuments(prev => [newDoc as Document, ...prev]);
        setFileUploadTitle('');
        fileInput.value = '';
        showToast('Document uploaded successfully!', 'success');
    } catch (error: any) {
        showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
        setFileUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading documents...</div>;
  }

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Documents</h1>
        <p className="text-lg text-gray-600 mt-1">All your important documents in one secure place.</p>
      </header>

      {/* --- ADDED UPLOAD FORM SECTION --- */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8" aria-label="Upload a Document">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload a Document</h3>
        <form onSubmit={handleClientFileUpload} className="space-y-4">
            <div>
                <label htmlFor="file-title" className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                <input
                    id="file-title"
                    type="text"
                    value={fileUploadTitle}
                    onChange={(e) => setFileUploadTitle(e.target.value)}
                    placeholder="e.g., 'Signed Contract'"
                    className="w-full p-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    disabled={fileUploading}
                    required
                />
            </div>
            <div>
                <label htmlFor="client-file-upload" className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
                <input
                    id="client-file-upload"
                    name="client-file-upload"
                    type="file"
                    disabled={fileUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
            </div>
            <button
                type="submit"
                disabled={fileUploading}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <FaUpload />
                {fileUploading ? 'Uploading...' : 'Upload Document'}
            </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8" aria-label="Documents List">
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FaFileAlt className="mx-auto text-5xl text-gray-300 mb-4" />
              <h4 className="text-xl font-medium text-gray-900">No Documents Yet</h4>
              <p className="text-gray-500">Documents you upload or we share with you will appear here.</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-purple-200 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                      <DocumentIcon fileName={doc.file_url} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-gray-500">Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                    {doc.due_date && <p className="text-sm font-semibold text-red-500">Due: {new Date(doc.due_date).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${doc.status === 'Viewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {doc.status}
                  </span>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition-all"
                    onClick={() => handleDocumentView(doc.id, doc.status)}
                  >
                    View
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </Fragment>
  );
}
