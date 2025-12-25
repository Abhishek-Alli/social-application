
import React, { useState, useMemo, useEffect } from 'react';
import { User, Feedback as FeedbackType, Survey, Poll, PollOption, Role, FeedbackForm, FeedbackFormField, FeedbackFormResponse } from '../types';
import { MessageSquare, Send, Lock, Globe, Search, User as UserIcon, Mail, Eye, EyeOff, FileText, Calendar, ClipboardList, BarChart3, Plus, X, CheckCircle2, Edit, List, Star } from 'lucide-react';
import { FormSubmissionsView } from './FormSubmissionsView';

interface FeedbackViewProps {
  currentUser: User | null;
  feedbacks: FeedbackType[];
  surveys: Survey[];
  polls: Poll[];
  forms: FeedbackForm[];
  onSubmitFeedback: (subject: string, message: string, userName: string, userEmail: string, isPrivate: boolean, surveyId?: string) => void;
  onDeleteFeedback?: (id: string) => void;
  onCreateSurvey?: (title: string, description: string, type: 'program' | 'event' | 'general', programName?: string, eventName?: string, deadline?: string) => void;
  onDeleteSurvey?: (id: string) => void;
  onCloseSurvey?: (id: string) => void;
  onCreatePoll?: (question: string, description: string, options: string[], allowMultipleVotes: boolean, showResultsBeforeVoting: boolean, deadline?: string) => void;
  onVotePoll?: (pollId: string, optionId: string) => void;
  onDeletePoll?: (id: string) => void;
  onClosePoll?: (id: string) => void;
  onCreateForm?: (title: string, description: string, fields: FeedbackFormField[], allowMultipleSubmissions: boolean, deadline?: string) => void;
  onSubmitForm?: (formId: string, responses: { [fieldId: string]: string | string[] | number }, userName: string, userEmail: string) => void;
  onDeleteForm?: (id: string) => void;
  onCloseForm?: (id: string) => void;
  onGetFormSubmissions?: (formId: string) => Promise<FeedbackFormResponse[]>;
  onDeleteFormSubmission?: (id: string) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ 
  currentUser, 
  feedbacks,
  surveys,
  polls,
  forms,
  onSubmitFeedback,
  onDeleteFeedback,
  onCreateSurvey,
  onDeleteSurvey,
  onCloseSurvey,
  onCreatePoll,
  onVotePoll,
  onDeletePoll,
  onClosePoll,
  onCreateForm,
  onSubmitForm,
  onDeleteForm,
  onCloseForm,
  onGetFormSubmissions,
  onDeleteFormSubmission
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [isPrivate, setIsPrivate] = useState(true);
  
  // Management survey creation state
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyType, setSurveyType] = useState<'program' | 'event' | 'general'>('general');
  const [surveyProgramName, setSurveyProgramName] = useState('');
  const [surveyEventName, setSurveyEventName] = useState('');
  const [surveyDeadline, setSurveyDeadline] = useState('');

  // Management poll creation state
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultipleVotes, setPollAllowMultipleVotes] = useState(false);
  const [pollShowResultsBeforeVoting, setPollShowResultsBeforeVoting] = useState(false);
  const [pollDeadline, setPollDeadline] = useState('');

  // Management form creation state
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<FeedbackFormField[]>([]);
  const [formAllowMultipleSubmissions, setFormAllowMultipleSubmissions] = useState(false);
  const [formDeadline, setFormDeadline] = useState('');

  // Form submission state
  const [selectedFormForSubmission, setSelectedFormForSubmission] = useState<FeedbackForm | null>(null);
  const [formResponses, setFormResponses] = useState<{ [fieldId: string]: string | string[] | number }>({});
  const [submittingForm, setSubmittingForm] = useState(false);

  // View submissions state
  const [selectedFormForView, setSelectedFormForView] = useState<FeedbackForm | null>(null);
  const [formSubmissions, setFormSubmissions] = useState<FeedbackFormResponse[]>([]);

  // Update name and email when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name || '');
      setUserEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Check if user is admin or management (can see private feedbacks, delete, and create surveys)
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isManagement = currentUser?.role === Role.ADMIN || currentUser?.role === Role.MANAGEMENT || currentUser?.role === Role.HOD;
  
  // Get active surveys
  const activeSurveys = useMemo(() => {
    return surveys.filter(s => s.status === 'active');
  }, [surveys]);

  // Get active polls
  const activePolls = useMemo(() => {
    return polls.filter(p => p.status === 'active');
  }, [polls]);

  // Get active forms
  const activeForms = useMemo(() => {
    return forms.filter(f => f.status === 'active');
  }, [forms]);

  // Helper to check if user has voted on a poll
  const hasUserVoted = (poll: Poll): boolean => {
    if (!currentUser) return false;
    return poll.options.some(opt => opt.voters.includes(currentUser.id));
  };

  // Helper to get total votes for a poll
  const getTotalVotes = (poll: Poll): number => {
    return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  // Helper to get percentage for an option
  const getOptionPercentage = (option: PollOption, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((option.votes / totalVotes) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      alert('Please fill in both subject and message.');
      return;
    }
    
    // If user is not logged in, require name and email
    if (!currentUser) {
      if (!userName || !userEmail) {
        alert('Please provide your name and email.');
        return;
      }
    }

    onSubmitFeedback(
      subject, 
      message, 
      currentUser?.name || userName, 
      currentUser?.email || userEmail,
      isPrivate,
      selectedSurveyId
    );
    
    // Reset form
    setSubject('');
    setMessage('');
    setSelectedSurveyId(undefined);
    if (!currentUser) {
      setUserName('');
      setUserEmail('');
    }
    setIsSubmitting(false);
    setIsPrivate(true);
  };
  
  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle || !onCreateSurvey) return;
    
    onCreateSurvey(
      surveyTitle,
      surveyDescription,
      surveyType,
      surveyType === 'program' ? surveyProgramName : undefined,
      surveyType === 'event' ? surveyEventName : undefined,
      surveyDeadline || undefined
    );
    
    // Reset form
    setSurveyTitle('');
    setSurveyDescription('');
    setSurveyType('general');
    setSurveyProgramName('');
    setSurveyEventName('');
    setSurveyDeadline('');
    setIsCreatingSurvey(false);
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion || !onCreatePoll) return;
    
    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please add at least 2 poll options.');
      return;
    }
    
    onCreatePoll(
      pollQuestion,
      pollDescription,
      validOptions,
      pollAllowMultipleVotes,
      pollShowResultsBeforeVoting,
      pollDeadline || undefined
    );
    
    // Reset form
    setPollQuestion('');
    setPollDescription('');
    setPollOptions(['', '']);
    setPollAllowMultipleVotes(false);
    setPollShowResultsBeforeVoting(false);
    setPollDeadline('');
    setIsCreatingPoll(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!currentUser) {
      alert('Please log in to vote.');
      return;
    }
    if (!onVotePoll) return;
    
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    
    if (!poll.allowMultipleVotes && hasUserVoted(poll)) {
      alert('You have already voted on this poll.');
      return;
    }
    
    if (poll.deadline && new Date(poll.deadline) < new Date()) {
      alert('This poll has closed.');
      return;
    }
    
    onVotePoll(pollId, optionId);
  };

  const handleAddFormField = () => {
    const newField: FeedbackFormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      label: '',
      type: 'text',
      required: false
    };
    setFormFields([...formFields, newField]);
  };

  const handleRemoveFormField = (fieldId: string) => {
    setFormFields(formFields.filter(f => f.id !== fieldId));
  };

  const handleUpdateFormField = (fieldId: string, updates: Partial<FeedbackFormField>) => {
    setFormFields(formFields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !onCreateForm) return;
    
    const validFields = formFields.filter(f => f.label.trim() !== '');
    if (validFields.length === 0) {
      alert('Please add at least one form field.');
      return;
    }
    
    onCreateForm(
      formTitle,
      formDescription,
      validFields,
      formAllowMultipleSubmissions,
      formDeadline || undefined
    );
    
    // Reset form
    setFormTitle('');
    setFormDescription('');
    setFormFields([]);
    setFormAllowMultipleSubmissions(false);
    setFormDeadline('');
    setIsCreatingForm(false);
  };

  const handleOpenFormForSubmission = async (form: FeedbackForm) => {
    setSelectedFormForSubmission(form);
    setFormResponses({});
  };

  const handleFormFieldChange = (fieldId: string, value: string | string[] | number) => {
    setFormResponses({ ...formResponses, [fieldId]: value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormForSubmission || !onSubmitForm) return;
    
    // Validate required fields
    const missingFields = selectedFormForSubmission.fields.filter(f => 
      f.required && !formResponses[f.id]
    );
    
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }
    
    setSubmittingForm(true);
    try {
      onSubmitForm(
        selectedFormForSubmission.id,
        formResponses,
        currentUser?.name || userName,
        currentUser?.email || userEmail
      );
      setSelectedFormForSubmission(null);
      setFormResponses({});
      if (!currentUser) {
        setUserName('');
        setUserEmail('');
      }
      alert('Form submitted successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleViewFormSubmissions = async (form: FeedbackForm) => {
    if (!onGetFormSubmissions) return;
    try {
      const submissions = await onGetFormSubmissions(form.id);
      setFormSubmissions(submissions);
      setSelectedFormForView(form);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      alert('Failed to load form submissions.');
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (!searchQuery) return feedbacks;
    const query = searchQuery.toLowerCase();
    return feedbacks.filter(f => 
      f.subject.toLowerCase().includes(query) || 
      f.message.toLowerCase().includes(query) ||
      (f.userName && f.userName.toLowerCase().includes(query))
    );
  }, [feedbacks, searchQuery]);

  // Filter feedbacks based on privacy and user role
  const visibleFeedbacks = useMemo(() => {
    return filteredFeedbacks.filter(f => {
      // Admins can see all feedbacks
      if (isAdmin) return true;
      // Others can only see public (non-private) feedbacks
      return !f.isPrivate;
    });
  }, [filteredFeedbacks, isAdmin]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Feedback</h2>
          <p className="text-xs text-slate-400 font-medium">
            Share your thoughts and suggestions with us
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className={`p-2 rounded-xl border transition-all ${isSearching ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-100 text-slate-400'}`}
          >
            <Search size={18} />
          </button>
          {!isSubmitting && (
            <button 
              onClick={() => setIsSubmitting(true)}
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-100 flex items-center gap-2"
            >
              <MessageSquare size={14} /> New
            </button>
          )}
        </div>
      </div>

      {isSearching && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <input 
            autoFocus
            type="text"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 transition-all shadow-sm text-sm font-medium"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Active Surveys Section */}
      {activeSurveys.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <ClipboardList size={16} /> Active Surveys & Reviews
          </h3>
          {activeSurveys.map(survey => {
            const surveyFeedbacks = feedbacks.filter(f => f.surveyId === survey.id);
            const isPastDeadline = survey.deadline && new Date(survey.deadline) < new Date();
            return (
              <div key={survey.id} className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {survey.type === 'program' && <FileText size={14} className="text-orange-600" />}
                      {survey.type === 'event' && <Calendar size={14} className="text-orange-600" />}
                      <h4 className="text-sm font-bold text-slate-800">{survey.title}</h4>
                      {isPastDeadline && (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold uppercase">Closed</span>
                      )}
                    </div>
                    {survey.description && (
                      <p className="text-xs text-slate-600 mb-2">{survey.description}</p>
                    )}
                    {(survey.programName || survey.eventName) && (
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                        {survey.type === 'program' ? `Program: ${survey.programName}` : `Event: ${survey.eventName}`}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Created by {survey.createdByName} • {surveyFeedbacks.length} response{surveyFeedbacks.length !== 1 ? 's' : ''}
                      {survey.deadline && ` • Deadline: ${new Date(survey.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isManagement && (
                    <div className="flex gap-1">
                      {survey.status === 'active' && onCloseSurvey && (
                        <button
                          onClick={() => onCloseSurvey(survey.id)}
                          className="px-2 py-1 text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white rounded-lg border border-slate-200"
                        >
                          Close
                        </button>
                      )}
                      {onDeleteSurvey && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this survey? All associated feedback will remain.')) {
                              onDeleteSurvey(survey.id);
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold text-rose-600 hover:text-rose-700 bg-white rounded-lg border border-rose-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!isPastDeadline && survey.status === 'active' && (
                  <button
                    onClick={() => {
                      setSelectedSurveyId(survey.id);
                      setSubject(`Feedback for: ${survey.title}`);
                      setIsSubmitting(true);
                    }}
                    className="w-full mt-3 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-orange-700 transition-colors"
                  >
                    Provide Feedback
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Management: Create Survey */}
      {isManagement && onCreateSurvey && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ClipboardList size={16} /> Manage Surveys
            </h3>
            {!isCreatingSurvey && (
              <button
                onClick={() => setIsCreatingSurvey(true)}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
              >
                <ClipboardList size={12} /> New Survey
              </button>
            )}
          </div>

          {isCreatingSurvey && (
            <form onSubmit={handleCreateSurvey} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Create Survey/Review Request</h4>
                <button type="button" onClick={() => setIsCreatingSurvey(false)} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Survey Title *</label>
                <input
                  autoFocus
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                  placeholder="e.g., Annual Training Program Review"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm min-h-[80px] leading-relaxed transition-all resize-none"
                  placeholder="Describe what feedback you're looking for..."
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type *</label>
                <select
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                  value={surveyType}
                  onChange={(e) => setSurveyType(e.target.value as 'program' | 'event' | 'general')}
                  required
                >
                  <option value="general">General Survey</option>
                  <option value="program">Program Review</option>
                  <option value="event">Event Review</option>
                </select>
              </div>

              {surveyType === 'program' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Program Name *</label>
                  <input
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                    placeholder="e.g., Leadership Development Program"
                    value={surveyProgramName}
                    onChange={(e) => setSurveyProgramName(e.target.value)}
                    required
                  />
                </div>
              )}

              {surveyType === 'event' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Event Name *</label>
                  <input
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                    placeholder="e.g., Annual Conference 2024"
                    value={surveyEventName}
                    onChange={(e) => setSurveyEventName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                  value={surveyDeadline}
                  onChange={(e) => setSurveyDeadline(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                <ClipboardList size={16} /> Create Survey
              </button>
            </form>
          )}
        </div>
      )}

      {/* Active Polls Section */}
      {activePolls.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <BarChart3 size={16} /> Active Polls
          </h3>
          {activePolls.map(poll => {
            const totalVotes = getTotalVotes(poll);
            const userHasVoted = hasUserVoted(poll);
            const isPastDeadline = poll.deadline && new Date(poll.deadline) < new Date();
            const showResults = poll.showResultsBeforeVoting || userHasVoted || poll.status === 'closed' || isPastDeadline;
            
            return (
              <div key={poll.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 size={14} className="text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-800">{poll.question}</h4>
                      {(isPastDeadline || poll.status === 'closed') && (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold uppercase">Closed</span>
                      )}
                    </div>
                    {poll.description && (
                      <p className="text-xs text-slate-600 mb-2">{poll.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Created by {poll.createdByName} • {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                      {poll.deadline && ` • Deadline: ${new Date(poll.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isManagement && (
                    <div className="flex gap-1">
                      {poll.status === 'active' && onClosePoll && (
                        <button
                          onClick={() => onClosePoll(poll.id)}
                          className="px-2 py-1 text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white rounded-lg border border-slate-200"
                        >
                          Close
                        </button>
                      )}
                      {onDeletePoll && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this poll?')) {
                              onDeletePoll(poll.id);
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold text-rose-600 hover:text-rose-700 bg-white rounded-lg border border-rose-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {poll.options.map((option) => {
                    const percentage = showResults ? getOptionPercentage(option, totalVotes) : 0;
                    const userVotedForThis = currentUser && option.voters.includes(currentUser.id);
                    const canVote = !isPastDeadline && poll.status === 'active' && (!userHasVoted || poll.allowMultipleVotes);
                    
                    return (
                      <div key={option.id} className="relative">
                        <button
                          onClick={() => canVote && handleVote(poll.id, option.id)}
                          disabled={!canVote || isPastDeadline || poll.status === 'closed'}
                          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                            userVotedForThis
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : canVote
                              ? 'bg-white border-blue-200 hover:border-blue-400 text-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex-1">{option.text}</span>
                            {showResults && (
                              <span className="text-[10px] font-bold ml-2">
                                {option.votes} ({percentage}%)
                              </span>
                            )}
                            {userVotedForThis && <CheckCircle2 size={14} className="ml-2" />}
                          </div>
                          {showResults && (
                            <div className="mt-2 h-1.5 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white/60 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Management: Create Poll */}
      {isManagement && onCreatePoll && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BarChart3 size={16} /> Manage Polls
            </h3>
            {!isCreatingPoll && (
              <button
                onClick={() => setIsCreatingPoll(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
              >
                <BarChart3 size={12} /> New Poll
              </button>
            )}
          </div>

          {isCreatingPoll && (
            <form onSubmit={handleCreatePoll} className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Create Poll</h4>
                <button type="button" onClick={() => setIsCreatingPoll(false)} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Poll Question *</label>
                <input
                  autoFocus
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm font-medium transition-all"
                  placeholder="e.g., Which training program should we prioritize?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm min-h-[60px] leading-relaxed transition-all resize-none"
                  placeholder="Add context or instructions..."
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Poll Options * (Minimum 2)</label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm font-medium transition-all"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleUpdatePollOption(index, e.target.value)}
                      required
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(index)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 text-xs font-bold flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAllowMultipleVotes}
                    onChange={(e) => setPollAllowMultipleVotes(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow users to vote multiple times</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollShowResultsBeforeVoting}
                    onChange={(e) => setPollShowResultsBeforeVoting(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Show results before voting</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm font-medium transition-all"
                  value={pollDeadline}
                  onChange={(e) => setPollDeadline(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                <BarChart3 size={16} /> Create Poll
              </button>
            </form>
          )}
        </div>
      )}

      {/* Active Feedback Forms Section */}
      {activeForms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText size={16} /> Active Feedback Forms
          </h3>
          {activeForms.map(form => {
            const formSubmissionsCount = feedbacks.filter(f => f.surveyId === form.id).length; // We'll track this properly later
            const isPastDeadline = form.deadline && new Date(form.deadline) < new Date();
            return (
              <div key={form.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-purple-600" />
                      <h4 className="text-sm font-bold text-slate-800">{form.title}</h4>
                      {(isPastDeadline || form.status === 'closed') && (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold uppercase">Closed</span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-xs text-slate-600 mb-2">{form.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Created by {form.createdByName} • {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                      {form.deadline && ` • Deadline: ${new Date(form.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isManagement && (
                    <div className="flex gap-1">
                      {onGetFormSubmissions && (
                        <button
                          onClick={() => handleViewFormSubmissions(form)}
                          className="px-2 py-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-white rounded-lg border border-blue-200"
                          title="View Submissions"
                        >
                          <List size={10} className="inline mr-1" /> View
                        </button>
                      )}
                      {form.status === 'active' && onCloseForm && (
                        <button
                          onClick={() => onCloseForm(form.id)}
                          className="px-2 py-1 text-[9px] font-bold text-slate-600 hover:text-slate-800 bg-white rounded-lg border border-slate-200"
                        >
                          Close
                        </button>
                      )}
                      {onDeleteForm && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this form? All submissions will be deleted.')) {
                              onDeleteForm(form.id);
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold text-rose-600 hover:text-rose-700 bg-white rounded-lg border border-rose-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!isPastDeadline && form.status === 'active' && (
                  <button
                    onClick={() => handleOpenFormForSubmission(form)}
                    className="w-full mt-3 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-purple-700 transition-colors"
                  >
                    Fill Out Form
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Management: Create Feedback Form */}
      {isManagement && onCreateForm && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText size={16} /> Manage Feedback Forms
            </h3>
            {!isCreatingForm && (
              <button
                onClick={() => setIsCreatingForm(true)}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
              >
                <FileText size={12} /> New Form
              </button>
            )}
          </div>

          {isCreatingForm && (
            <form onSubmit={handleCreateForm} className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Create Feedback Form</h4>
                <button type="button" onClick={() => setIsCreatingForm(false)} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Form Title *</label>
                <input
                  autoFocus
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                  placeholder="e.g., Employee Satisfaction Survey"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm min-h-[60px] leading-relaxed transition-all resize-none"
                  placeholder="Describe what this form is for..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Form Fields *</label>
                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Field {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormField(field.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label *</label>
                        <input
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) => handleUpdateFormField(field.id, { label: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type *</label>
                        <select
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                          value={field.type}
                          onChange={(e) => handleUpdateFormField(field.id, { type: e.target.value as any })}
                          required
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="date">Date</option>
                          <option value="select">Select Dropdown</option>
                          <option value="radio">Radio Buttons</option>
                          <option value="checkbox">Checkboxes</option>
                          <option value="rating">Rating (1-5)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateFormField(field.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-xs font-bold text-slate-600">Required</span>
                        </label>
                      </div>

                      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Options (one per line) *</label>
                          <textarea
                            className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                            rows={3}
                            value={field.options?.join('\n') || ''}
                            onChange={(e) => handleUpdateFormField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                          />
                        </div>
                      )}

                      {field.type === 'textarea' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rows</label>
                          <input
                            type="number"
                            className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                            value={field.rows || 4}
                            onChange={(e) => handleUpdateFormField(field.id, { rows: parseInt(e.target.value) || 4 })}
                            min="1"
                            max="20"
                          />
                        </div>
                      )}

                      {(field.type === 'number' || field.type === 'rating') && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min</label>
                            <input
                              type="number"
                              className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                              value={field.min || ''}
                              onChange={(e) => handleUpdateFormField(field.id, { min: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max</label>
                            <input
                              type="number"
                              className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                              value={field.max || ''}
                              onChange={(e) => handleUpdateFormField(field.id, { max: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                        </div>
                      )}

                      {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Placeholder (Optional)</label>
                          <input
                            className="w-full p-2 bg-white rounded-lg border border-slate-200 text-sm"
                            placeholder="Placeholder text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateFormField(field.id, { placeholder: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddFormField}
                  className="w-full mt-2 py-2 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 text-xs font-bold flex items-center justify-center gap-2 hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <Plus size={14} /> Add Field
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAllowMultipleSubmissions}
                    onChange={(e) => setFormAllowMultipleSubmissions(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow users to submit multiple times</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-purple-100 flex items-center justify-center gap-2">
                <FileText size={16} /> Create Form
              </button>
            </form>
          )}
        </div>
      )}

      {/* Form Submission Modal */}
      {selectedFormForSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">{selectedFormForSubmission.title}</h3>
              <button
                onClick={() => {
                  setSelectedFormForSubmission(null);
                  setFormResponses({});
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {selectedFormForSubmission.description && (
                <p className="text-sm text-slate-600 mb-4">{selectedFormForSubmission.description}</p>
              )}

              {!currentUser && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Name *</label>
                    <input
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {selectedFormForSubmission.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                    <input
                      type={field.type}
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                      placeholder={field.placeholder}
                      value={(formResponses[field.id] as string) || ''}
                      onChange={(e) => handleFormFieldChange(field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all resize-none"
                      placeholder={field.placeholder}
                      rows={field.rows || 4}
                      value={(formResponses[field.id] as string) || ''}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                      value={(formResponses[field.id] as string) || ''}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-purple-500 text-sm font-medium transition-all"
                      value={(formResponses[field.id] as string) || ''}
                      onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'radio' ? (
                    <div className="space-y-2">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={(formResponses[field.id] as string) === opt}
                            onChange={(e) => handleFormFieldChange(field.id, e.target.value)}
                            required={field.required}
                            className="text-purple-600"
                          />
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-2">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                          <input
                            type="checkbox"
                            value={opt}
                            checked={((formResponses[field.id] as string[]) || []).includes(opt)}
                            onChange={(e) => {
                              const current = (formResponses[field.id] as string[]) || [];
                              const updated = e.target.checked
                                ? [...current, opt]
                                : current.filter(v => v !== opt);
                              handleFormFieldChange(field.id, updated);
                            }}
                            className="text-purple-600 rounded"
                          />
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'rating' ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleFormFieldChange(field.id, rating)}
                          className={`p-2 rounded-lg transition-all ${
                            (formResponses[field.id] as number) >= rating
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Star size={20} fill={(formResponses[field.id] as number) >= rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormForSubmission(null);
                    setFormResponses({});
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-100 hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submittingForm ? 'Submitting...' : 'Submit Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Submissions View Modal */}
      {selectedFormForView && (
        <FormSubmissionsView
          form={selectedFormForView}
          submissions={formSubmissions}
          onClose={() => {
            setSelectedFormForView(null);
            setFormSubmissions([]);
          }}
          onDeleteSubmission={onDeleteFormSubmission}
        />
      )}

      {isSubmitting && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm animate-in slide-in-from-top-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              {selectedSurveyId ? 'Feedback for Survey' : 'Share Your Feedback'}
            </h3>
            <button type="button" onClick={() => { setIsSubmitting(false); setSelectedSurveyId(undefined); }} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
          </div>

          {selectedSurveyId && (
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-xs font-bold text-orange-900">
                Survey: {surveys.find(s => s.id === selectedSurveyId)?.title}
              </p>
              {surveys.find(s => s.id === selectedSurveyId)?.description && (
                <p className="text-[10px] text-orange-700 mt-1">
                  {surveys.find(s => s.id === selectedSurveyId)?.description}
                </p>
              )}
            </div>
          )}

          {!currentUser && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Name *</label>
                <input 
                  autoFocus
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                  placeholder="John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Email *</label>
                <input 
                  type="email"
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
                  placeholder="john@example.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject *</label>
            <input 
              className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm font-medium transition-all"
              placeholder="e.g., Feature Request, Bug Report, General Feedback"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Feedback *</label>
            <textarea 
              className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-orange-500 text-sm min-h-[120px] leading-relaxed transition-all resize-none"
              placeholder="Tell us what you think..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isPrivate 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Lock size={16} />
              Private
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                !isPrivate 
                  ? 'bg-orange-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Globe size={16} />
              Public
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            {isPrivate 
              ? 'Private feedback is only visible to administrators' 
              : 'Public feedback is visible to everyone'}
          </p>

          <button type="submit" className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Send size={18} /> Submit Feedback
          </button>
        </form>
      )}

      <div className="space-y-4 pb-20">
        {visibleFeedbacks.length > 0 ? (
          visibleFeedbacks.map(feedback => (
            <div key={feedback.id} className={`bg-white rounded-2xl border ${feedback.isPrivate ? 'border-slate-100 bg-slate-50/50' : 'border-orange-50'} shadow-sm overflow-hidden animate-in slide-in-from-bottom-2`}>
              <div className="p-4 border-b border-slate-50 flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${feedback.isPrivate ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-500'}`}>
                    {feedback.isPrivate ? <Lock size={18} /> : <Globe size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{feedback.subject}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {feedback.userName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <UserIcon size={10} />
                          <span className="truncate max-w-[120px]">{feedback.userName}</span>
                        </div>
                      )}
                      {feedback.userEmail && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <Mail size={10} />
                          <span className="truncate max-w-[140px]">{feedback.userEmail}</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold">
                        • {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && feedback.isPrivate && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center gap-1">
                    <EyeOff size={8} /> Private
                  </span>
                )}
                {!feedback.isPrivate && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                    <Eye size={8} /> Public
                  </span>
                )}
              </div>
              
              <div className="p-4 bg-slate-50/50">
                <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {feedback.message}
                </p>
              </div>

              {isAdmin && onDeleteFeedback && (
                <div className="px-4 pb-4">
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this feedback?')) {
                        onDeleteFeedback(feedback.id);
                      }
                    }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-bold">{searchQuery ? 'No matching results' : 'No feedback yet'}</p>
            <p className="text-xs text-slate-400 mt-1">{searchQuery ? 'Try adjusting your search query' : 'Be the first to share your thoughts!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

