// src/app/dashboard/onboarding/page.tsx
'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/app/components/HelperComponents';

// --- Type Definitions ---
type OnboardingStep = {
  step_id: string;
  title: string;
  status: 'pending' | 'completed';
  type: string;
  description: string;
  link_url?: string | null;
  document_id?: string | null;
  due_date?: string | null;
};

// --- Reusable Components ---
const FileUploader = ({ onFileUpload, step, onMessage }: { onFileUpload: (stepId: string, files: FileList, title: string) => void, step: OnboardingStep, onMessage: (msg: string, type: 'success' | 'error') => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = fileInputRef.current?.files;

    if (!files || files.length === 0) {
      onMessage('Please select a file to upload.', 'error');
      return;
    }
    if (!fileTitle.trim()) {
      onMessage('Please provide a title for your document.', 'error');
      return;
    }
    setIsUploading(true);
    await onFileUpload(step.step_id, files, fileTitle.trim());
    setIsUploading(false);
    setFileTitle('');
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleUploadClick}>
      <div className="flex flex-col gap-2 mt-4 p-4 border rounded-lg bg-slate-50">
         <label htmlFor={`file-title-${step.step_id}`} className="text-sm font-medium text-gray-700">Document Title</label>
        <input
          id={`file-title-${step.step_id}`}
          type="text"
          value={fileTitle}
          onChange={(e) => setFileTitle(e.target.value)}
          placeholder="e.g., 'Signed Contract'"
          className="p-2 border border-gray-300 rounded-lg text-sm"
          disabled={isUploading}
          required
        />
        <label htmlFor={`file-upload-${step.step_id}`} className="text-sm font-medium text-gray-700">Attach File</label>
        <input
          id={`file-upload-${step.step_id}`}
          type="file"
          ref={fileInputRef}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
          multiple
        />
        <button
          type="submit"
          disabled={isUploading}
          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload & Complete'}
        </button>
      </div>
    </form>
  );
};

const StepIcon = ({ step, index }: { step: OnboardingStep, index: number }) => {
  if (step.status === 'completed') {
    return (
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
      {index + 1}
    </div>
  );
};

// --- Main Onboarding Page Component ---
export default function OnboardingPage() {
  const router = useRouter();
  const { showToast, Toast } = useToast();

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingStep, setPendingStep] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data: stepsRes } = await supabase.from('onboarding_steps').select('*').eq('client_id', user.id).order('sort_order', { ascending: true });
        if (stepsRes) setSteps(stepsRes as OnboardingStep[]);
      } catch (error: any) {
        showToast('An unexpected error occurred: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  const handleFileUpload = async (stepId: string, files: FileList, fileTitle: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || files.length === 0) return;

    setPendingStep(stepId);

    try {
        const file = files[0];
        const filePath = `${user.id}/${uuidv4()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('clientdocuments').upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('clientdocuments').getPublicUrl(filePath);

        const { data: newDoc, error: insertError } = await supabase
          .from('documents')
          .insert({
            client_id: user.id,
            name: fileTitle,
            file_url: publicUrl,
            file_path: filePath,
            status: 'Awaiting Review'
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        
        const { error: stepUpdateError } = await supabase
          .from('onboarding_steps')
          .update({ status: 'completed', document_id: newDoc.id })
          .eq('step_id', stepId);

        if (stepUpdateError) throw stepUpdateError;

        showToast('File uploaded successfully!', 'success');
        setSteps(prev => prev.map(step => step.step_id === stepId ? { ...step, status: 'completed' } : step));
    } catch (error: any) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        setPendingStep(null);
    }
  };
  
  const handleMarkAsComplete = async (stepId: string) => {
    setPendingStep(stepId);
    const { error } = await supabase.from('onboarding_steps').update({ status: 'completed' }).eq('step_id', stepId);
    
    if (error) {
      showToast('Failed to update step.', 'error');
    } else {
      showToast('Step marked as complete!', 'success');
      setSteps(prev => prev.map(step => step.step_id === stepId ? { ...step, status: 'completed' } : step));
    }
    setPendingStep(null);
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading your dashboard...</div>;
  }

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Journey</h1>
        <p className="text-lg text-gray-600 mt-1">Let's get everything set up for our project together.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Your Progress</h3>
            <span className="text-lg font-semibold text-purple-600">{completedSteps} of {totalSteps} Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.step_id} className={`border rounded-2xl p-6 transition-all duration-200 ${step.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start gap-6">
                <StepIcon step={step} index={index} />
                <div className="flex-1">
                  <h4 className={`text-xl font-bold mb-2 ${step.status === 'completed' ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>{step.title}</h4>
                  <p className="text-base leading-relaxed text-gray-600">{step.description}</p>
                  {step.due_date && <p className="text-sm text-red-500 font-medium mt-2">Due: {new Date(step.due_date).toLocaleDateString()}</p>}
                  
                  {step.status === 'pending' && (
                    <div className="mt-4">
                      {step.type === 'file-upload' && <FileUploader onFileUpload={handleFileUpload} step={step} onMessage={showToast} />}
                      {step.link_url && <a href={step.link_url} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200">Start Here</a>}
                      {step.type !== 'file-upload' && !step.link_url && (
                        <button
                          onClick={() => handleMarkAsComplete(step.step_id)}
                          className="px-6 py-2 text-purple-700 bg-purple-100 hover:bg-purple-200 font-medium rounded-xl transition-all duration-200"
                          disabled={pendingStep === step.step_id}
                        >
                          {pendingStep === step.step_id ? 'Completing...' : 'Mark as Complete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Fragment>
  );
}
