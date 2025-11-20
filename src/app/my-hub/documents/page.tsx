// src/app/my-hub/documents/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { v4 as uuidv4 } from 'uuid';

// Define the type for our document object
type AdminDoc = {
    id: string;
    name: string;
    file_url: string;
    file_path: string; // Keep track of the file path for deletion
};

export default function AdminDocumentsPage() {
    const { showToast, Toast } = useToast();
    const [documents, setDocuments] = useState<AdminDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [docTitle, setDocTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Fetch documents on component mount
    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_documents')
                .select('*')
                .order('created_at', { ascending: false }); // Show newest first

            if (error) {
                showToast('Could not load documents.', 'error');
                console.error('Error fetching documents:', error);
            } else {
                setDocuments(data as AdminDoc[]);
            }
            setLoading(false);
        };
        fetchDocs();
    }, []); // <-- FIX: Changed dependency from [showToast] to [] to prevent infinite loop

    // Handle file upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !docTitle) {
            showToast('Please provide a title and select a file.', 'error');
            return;
        }

        setUploading(true);
        
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            showToast('You must be logged in to upload.', 'error');
            setUploading(false);
            return;
        }

        const filePath = `${user.id}/${uuidv4()}-${file.name}`;

        // Upload file to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from('clientdocuments')
            .upload(filePath, file);

        if (uploadError) {
            showToast('Upload failed. Please try again.', 'error');
            console.error('Upload error:', uploadError);
            setUploading(false);
            return;
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from('clientdocuments')
            .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
            showToast('Could not get public URL for the file.', 'error');
            setUploading(false);
            return;
        }

        // Insert document record into the database
        const { data: newDoc, error: insertError } = await supabase
            .from('admin_documents')
            .insert({
                name: docTitle,
                file_url: urlData.publicUrl,
                file_path: filePath, // Save the path for deletion
                user_id: user.id
            })
            .select()
            .single();

        if (insertError) {
            showToast('Failed to save document record.', 'error');
            console.error('Insert error:', insertError);
            // Clean up by deleting the orphaned file from storage
            await supabase.storage.from('clientdocuments').remove([filePath]);
        } else {
            setDocuments(prev => [newDoc as AdminDoc, ...prev]);
            setDocTitle('');
            setFile(null);
            // Reset the file input visually
            const fileInput = document.getElementById('admin-doc-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            showToast('Document uploaded successfully!', 'success');
        }
        setUploading(false);
    };

    // Handle document deletion
    const handleDelete = async (doc: AdminDoc) => {
        // Optimistically remove from UI
        setDocuments(prev => prev.filter(d => d.id !== doc.id));

        // Delete the record from the 'admin_documents' table
        // The trigger will handle deleting the file from storage
        const { error } = await supabase
            .from('admin_documents')
            .delete()
            .match({ id: doc.id });

        if (error) {
            showToast('Failed to delete document.', 'error');
            console.error('Delete error:', error);
            // If deletion fails, add the document back to the UI
            setDocuments(prev => [...prev, doc].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            showToast('Document deleted successfully.', 'success');
        }
    };

    return (
        <Fragment>
            <Toast />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Business Documents</h1>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Uploaded Documents</h3>
                    {loading ? (
                        <p>Loading documents...</p>
                    ) : documents.length > 0 ? (
                        <ul className="space-y-3">
                            {documents.map(doc => (
                                <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline truncate pr-4">
                                        {doc.name}
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc)}
                                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No documents have been uploaded yet.</p>
                    )}
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit">
                    <h3 className="text-xl font-bold mb-4">Upload Document</h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <input
                            type="text"
                            value={docTitle}
                            onChange={e => setDocTitle(e.target.value)}
                            placeholder="Document Name"
                            className="w-full p-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            required
                        />
                        <input
                            type="file"
                            id="admin-doc-upload"
                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            required
                        />
                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </div>
            </div>
        </Fragment>
    );
}
