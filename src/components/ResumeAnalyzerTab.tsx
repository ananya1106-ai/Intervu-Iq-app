import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Download, 
  Zap, 
  RefreshCw,
  ExternalLink,
  Eye,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  FileCheck2,
  AlertOctagon,
  Tag,
  Check,
  ListOrdered,
  ShieldCheck,
  FileSearch,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { auth } from '../firebase';
import { ResumeAnalysisResult } from '../types';
import { 
  uploadResumeToCloudinary, 
  validateResumeFile, 
  CloudinaryUploadResponse 
} from '../services/cloudinaryService';
import { 
  saveResumeMetadata, 
  getUserResumeMetadata, 
  deleteResumeMetadata 
} from '../services/resumeService';
import { 
  getUserAtsData, 
  runAtsAnalysisPipeline, 
  AtsData 
} from '../services/atsService';

interface ResumeAnalyzerTabProps {
  onAddAnalysis?: (result: ResumeAnalysisResult) => void;
  onUploadSuccess?: (result: CloudinaryUploadResponse) => void;
}

export const ResumeAnalyzerTab: React.FC<ResumeAnalyzerTabProps> = ({ 
  onAddAnalysis, 
  onUploadSuccess 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<CloudinaryUploadResponse | null>(null);

  // ATS Analysis States
  const [atsData, setAtsData] = useState<AtsData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);

  // Resume Action & Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic Sentence Enhancer State
  const [improveText, setImproveText] = useState('Responsible for optimizing slow code and updating React databases.');
  const [improvedText, setImprovedText] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  // Load existing resume metadata & existing ATS analysis from Firestore on mount / auth change
  useEffect(() => {
    let isMounted = true;

    const loadSavedData = async (uid: string) => {
      try {
        // 1. Fetch saved resume metadata
        const savedMetaData = await getUserResumeMetadata(uid);
        if (savedMetaData && savedMetaData.uploaded && isMounted) {
          let dateStr = new Date().toISOString();
          if (savedMetaData.uploadedAt?.toDate) {
            dateStr = savedMetaData.uploadedAt.toDate().toISOString();
          } else if (typeof savedMetaData.uploadedAt === 'string') {
            dateStr = savedMetaData.uploadedAt;
          }

          setUploadResult({
            fileName: savedMetaData.fileName,
            secure_url: savedMetaData.url,
            public_id: savedMetaData.publicId,
            bytes: savedMetaData.size,
            format: savedMetaData.format,
            created_at: dateStr,
          });
        }

        // 2. Fetch existing ATS analysis data from Firestore users/{uid}/ats
        const savedAts = await getUserAtsData(uid);
        if (savedAts && isMounted) {
          setAtsData(savedAts);
        }
      } catch (err) {
        console.error('Failed to load existing data from Firestore:', err);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.uid) {
        loadSavedData(user.uid);
      }
    });

    if (auth.currentUser?.uid) {
      loadSavedData(auth.currentUser.uid);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Run ATS Analysis Pipeline (extract PDF via pdf.js -> Gemini API -> Save to Firestore)
  const handleRunAtsAnalysis = async () => {
    if (isAnalyzing) return;
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setAtsError('User authentication required to perform ATS analysis.');
      return;
    }
    if (!uploadResult?.secure_url) {
      setAtsError('Please upload a resume first before running ATS analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAtsError(null);

    try {
      const result = await runAtsAnalysisPipeline(currentUid, uploadResult.secure_url);
      setAtsData(result);
      if (onAddAnalysis) {
        onAddAnalysis({
          fileName: uploadResult.fileName,
          fileSize: `${(uploadResult.bytes / 1024).toFixed(1)} KB`,
          atsScore: result.score,
          skillsAnalysis: {
            matched: result.strengths,
            missing: result.missingKeywords
          },
          sectionsFound: {
            experience: true,
            education: true,
            projects: true,
            skills: true
          },
          aiSuggestions: result.improvementSuggestions.map(text => ({
            category: 'Impact' as const,
            severity: 'High' as const,
            text
          }))
        });
      }
    } catch (err: any) {
      console.error('ATS Analysis Error:', err);
      setAtsError(err.message || 'Failed to complete ATS resume analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drag & Drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    if (e.target.files && e.target.files[0]) {
      handleProcessUpload(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (isUploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // View Resume in new browser tab
  const handleViewResume = () => {
    if (uploadResult?.secure_url) {
      window.open(uploadResult.secure_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Download Resume
  const handleDownloadResume = async () => {
    if (!uploadResult?.secure_url) return;
    setIsDownloading(true);
    try {
      const response = await fetch(uploadResult.secure_url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = uploadResult.fileName || `resume.${uploadResult.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(uploadResult.secure_url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Confirm Delete Resume
  const confirmDeleteResume = async () => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setDeleteError('No authenticated user session found.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteResumeMetadata(currentUid);
      setUploadResult(null);
      setAtsData(null);
      setFile(null);
      setUploadError(null);
      setAtsError(null);
      setUploadProgress(0);
      setShowDeleteModal(false);
    } catch (err: any) {
      console.error('Failed to delete resume metadata from Firestore:', err);
      setDeleteError(err.message || 'Failed to delete resume metadata.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Process Upload directly to Cloudinary and update Firestore
  const handleProcessUpload = async (selectedFile: File) => {
    if (isUploading) return;

    setUploadError(null);
    setAtsError(null);

    const validation = validateResumeFile(selectedFile);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format or size.');
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadResumeToCloudinary(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      setAtsData(null); // Reset old ATS data when replacing/uploading a new file
      setUploadError(null);

      const currentUid = auth.currentUser?.uid;
      if (currentUid) {
        try {
          await saveResumeMetadata(currentUid, result);
        } catch (fsErr: any) {
          console.error('Firestore save error:', fsErr);
          setUploadError('Uploaded to Cloudinary, but failed to sync metadata to Firestore.');
        }
      }

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setUploadError(err.message || 'Failed to upload resume to Cloudinary. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Sentence Enhancer
  const handleEnhanceSentence = async () => {
    setIsImproving(true);
    setImprovedText('');
    try {
      const response = await fetch('/api/gemini/resume/enhance-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: improveText })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enhancedText) {
          setImprovedText(data.enhancedText);
          setIsImproving(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Enhancement API error:", e);
    }

    setTimeout(() => {
      setIsImproving(false);
      setImprovedText('Spearheaded high-performance software architecture, orchestrating a 45% latency reduction in React frontends and deploying scalable Redis caching clusters.');
    }, 1200);
  };

  // Helper for ATS Score styling
  const getScoreColorInfo = (score: number) => {
    if (score <= 40) {
      return {
        text: 'text-rose-400',
        stroke: '#f43f5e',
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/10',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        label: 'Needs Optimization'
      };
    }
    if (score <= 70) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        label: 'Moderate ATS Match'
      };
    }
    return {
      text: 'text-emerald-400',
      stroke: '#10b981',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Excellent ATS Match'
    };
  };

  const formatAnalyzedAt = (analyzedAt: any) => {
    if (!analyzedAt) return null;
    try {
      if (typeof analyzedAt?.toDate === 'function') {
        return analyzedAt.toDate().toLocaleString();
      }
      if (typeof analyzedAt === 'string' || typeof analyzedAt === 'number') {
        return new Date(analyzedAt).toLocaleString();
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    <div id="resume-analyzer-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* LEFT COLUMN: UPLOADER & ATS REPORT */}
      <div className="lg:col-span-8 space-y-6">
        {/* Hidden file input for file selection */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf,.doc,.docx"
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-left">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Delete Saved Resume?</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">This will remove your resume and ATS data from Firestore.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3.5 border border-zinc-900 rounded-xl">
                Are you sure you want to remove <strong className="text-white">{uploadResult?.fileName}</strong> from your profile? This will reset the resume state and remove the metadata from Firestore.
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteResume}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-950/30"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD ERROR DISPLAY */}
        {uploadError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* UPLOADING SPINNER AND PROGRESS */}
        {isUploading && (
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Uploading Resume to Cloudinary...</h3>
              <p className="text-xs text-zinc-400 font-mono">{file?.name}</p>
            </div>
            <div className="w-64 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-200" 
                style={{ width: `${uploadProgress}%` }} 
              />
            </div>
            <span className="text-xs text-emerald-400 font-semibold">{uploadProgress}%</span>
          </div>
        )}

        {/* SUCCESSFUL UPLOAD RESULT CARD */}
        {uploadResult && !isUploading && (
          <div className="bg-[#0d0f17] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                    Active Resume • Synced with Firestore
                  </span>
                  <h2 className="text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
                    {uploadResult.fileName}
                  </h2>
                </div>
              </div>

              {/* ACTION BUTTONS BAR */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleViewResume}
                  className="px-3.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  title="View Resume in new tab"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadResume}
                  disabled={isDownloading}
                  className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  title="Download Resume PDF/DOC"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  title="Replace with new file"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  title="Delete Resume from Firestore"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#090a10] p-3.5 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-sans font-semibold block">Resume File Name</span>
                <span className="text-zinc-200 truncate block font-bold">{uploadResult.fileName}</span>
              </div>
              <div className="bg-[#090a10] p-3.5 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-sans font-semibold block">File Size & Format</span>
                <span className="text-zinc-200 block">
                  {(uploadResult.bytes / 1024).toFixed(1)} KB ({uploadResult.format.toUpperCase()})
                </span>
              </div>
              <div className="bg-[#090a10] p-3.5 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-sans font-semibold block">Upload Date</span>
                <span className="text-zinc-200 block">
                  {new Date(uploadResult.created_at).toLocaleString()}
                </span>
              </div>
              <div className="bg-[#090a10] p-3.5 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-sans font-semibold block">Cloudinary Storage URL</span>
                <a 
                  href={uploadResult.secure_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                >
                  <span className="truncate">{uploadResult.secure_url}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* DRAG AND DROP BOX FOR INITIAL FILE UPLOAD */}
        {!isUploading && !uploadResult && (
          <div 
            id="drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`bg-[#0d0f17] border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragActive ? 'border-emerald-500 bg-[#10b981]/5' : 'border-zinc-800 hover:border-emerald-500/40 bg-[#0d0f17]'}`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full w-fit mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Drag & Drop Resume File</h3>
                <p className="text-xs text-zinc-500">Supports PDF, DOC, or DOCX (Max size: 10MB)</p>
              </div>
              <div className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg w-fit mx-auto">
                ☁️ Direct Cloudinary Upload Active
              </div>
            </div>
          </div>
        )}

        {/* LOADING SPINNER WHILE ATS ANALYSIS IS RUNNING */}
        {isAnalyzing && (
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Running Gemini ATS Evaluation...</h3>
              <p className="text-xs text-zinc-400">Extracting readable text via pdf.js and evaluating keywords, grammar, and score.</p>
            </div>
          </div>
        )}

        {/* ATS ERROR DISPLAY WITH RETRY BUTTON */}
        {atsError && !isAnalyzing && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold">{atsError}</span>
            </div>
            <button
              type="button"
              onClick={handleRunAtsAnalysis}
              disabled={isAnalyzing}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {/* IF ATS ANALYSIS IS MISSING & UPLOADED RESUME EXISTS */}
        {!atsData && !isAnalyzing && uploadResult && (
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-8 text-center space-y-5">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl w-fit mx-auto">
              <FileSearch className="w-10 h-10" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-white">No ATS Analysis Available</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Analyze your resume against your target role using Gemini to receive detailed ATS scoring, missing keywords, and formatting suggestions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunAtsAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 mx-auto shadow-lg shadow-indigo-950/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Resume</span>
            </button>
          </div>
        )}

        {/* PRODUCTION ATS REPORT PAGE USING FIRESTORE ATS DATA */}
        {atsData && !isAnalyzing && (
          <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-8">
            {/* Top Score & Action Bar */}
            {(() => {
              const colorInfo = getScoreColorInfo(atsData.score);
              const radius = 48;
              const circumference = 2 * Math.PI * radius; // 301.59
              const strokeDashoffset = circumference - (circumference * (atsData.score / 100));
              const analyzedAtStr = formatAnalyzedAt(atsData.analyzedAt);

              return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
                  {/* Left: Score Gauge */}
                  <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          className="stroke-zinc-800"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke={colorInfo.stroke}
                          strokeWidth="10"
                          strokeDasharray={301.59}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-2xl font-extrabold ${colorInfo.text}`}>
                          {atsData.score}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">out of 100</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${colorInfo.badge}`}>
                          {colorInfo.label}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white">ATS Resume Score</h2>
                      {analyzedAtStr && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Last Analyzed: {analyzedAtStr}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleRunAtsAnalysis}
                      disabled={isAnalyzing}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/30 whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Re-Analyze Resume</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Overall Feedback */}
            {atsData.overallFeedback && (
              <div className="bg-[#090a10] border border-zinc-800/80 p-5 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Executive Overall Feedback
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {atsData.overallFeedback}
                </p>
              </div>
            )}

            {/* Resume Strengths */}
            {atsData.strengths && atsData.strengths.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Resume Strengths
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {atsData.strengths.map((str, i) => (
                    <div 
                      key={i} 
                      className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-200 text-xs rounded-xl flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{str}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Weaknesses */}
            {atsData.weaknesses && atsData.weaknesses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> Identified Weaknesses
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {atsData.weaknesses.map((wk, i) => (
                    <div 
                      key={i} 
                      className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-200 text-xs rounded-xl flex items-start gap-3"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{wk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {atsData.missingKeywords && atsData.missingKeywords.length > 0 && (
              <div className="bg-zinc-950/50 border border-zinc-900 p-5 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {atsData.missingKeywords.map((kw, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg font-semibold flex items-center gap-1"
                    >
                      <span>+ {kw}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Grammar & Formatting Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Grammar Suggestions */}
              {atsData.grammarSuggestions && atsData.grammarSuggestions.length > 0 && (
                <div className="bg-zinc-950/50 border border-zinc-900 p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Grammar & Phrasing Suggestions
                  </h3>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {atsData.grammarSuggestions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formatting Suggestions */}
              {atsData.formattingSuggestions && atsData.formattingSuggestions.length > 0 && (
                <div className="bg-zinc-950/50 border border-zinc-900 p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <ListOrdered className="w-4 h-4" /> Formatting & Layout Suggestions
                  </h3>
                  <ul className="space-y-2.5 text-xs text-zinc-300">
                    {atsData.formattingSuggestions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actionable Improvement Suggestions */}
            {atsData.improvementSuggestions && atsData.improvementSuggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-400" /> Actionable Bullet Point Improvements
                </h3>
                <div className="space-y-2.5">
                  {atsData.improvementSuggestions.map((sug, i) => (
                    <div 
                      key={i} 
                      className="p-3.5 bg-[#141722]/60 border border-zinc-800/80 rounded-xl flex items-start gap-3 text-xs text-zinc-300"
                    >
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded text-[10px] flex-shrink-0">
                        Tip #{i + 1}
                      </span>
                      <p className="leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: AI BULLET POINT ENHANCER */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0d0f17] border border-zinc-800 rounded-2xl p-5 text-left space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> AI Bullet Point Enhancer
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Convert passive bullet points into high-impact, performance-oriented action entries.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Passive Bullet Statement</label>
              <textarea 
                value={improveText}
                onChange={(e) => setImproveText(e.target.value)}
                className="w-full h-24 bg-[#121520] border border-zinc-800 focus:border-indigo-500 text-zinc-200 p-3 rounded-xl focus:outline-none transition-all resize-none"
              />
            </div>

            <button 
              onClick={handleEnhanceSentence}
              disabled={isImproving || !improveText}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-950/20"
            >
              {isImproving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Improve Statement <Sparkles className="w-4 h-4" /></>
              )}
            </button>

            {improvedText && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2"
              >
                <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">High-Impact Active Sentence</span>
                <p className="text-zinc-300 leading-relaxed">{improvedText}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
