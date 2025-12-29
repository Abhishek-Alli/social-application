
import React, { useState, useMemo } from 'react';
import { FeedbackForm, FeedbackFormResponse, FeedbackFormField } from '../types';
import { FileText, X, Download, Eye, Trash2, User as UserIcon, Mail, Calendar } from 'lucide-react';

interface FormSubmissionsViewProps {
  form: FeedbackForm;
  submissions: FeedbackFormResponse[];
  onClose: () => void;
  onDeleteSubmission?: (id: string) => void;
}

export const FormSubmissionsView: React.FC<FormSubmissionsViewProps> = ({
  form,
  submissions,
  onClose,
  onDeleteSubmission
}) => {
  const [selectedSubmission, setSelectedSubmission] = useState<FeedbackFormResponse | null>(null);

  const exportToCSV = () => {
    // Create CSV header
    const headers = ['Submitted By', 'Email', 'Submitted At', ...form.fields.map(f => f.label)];
    const rows = submissions.map(sub => {
      const row = [
        sub.userName || 'Anonymous',
        sub.userEmail || '',
        new Date(sub.submittedAt).toLocaleString(),
        ...form.fields.map(field => {
          const value = sub.responses[field.id];
          if (Array.isArray(value)) {
            return value.join('; ');
          }
          return value?.toString() || '';
        })
      ];
      return row.map(cell => `"${cell}"`).join(',');
    });

    const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title}_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getFieldValue = (field: FeedbackFormField, response: FeedbackFormResponse): string => {
    const value = response.responses[field.id];
    if (value === undefined || value === null) return '—';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return value.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} /> {form.title} - Submissions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Table View */}
          <div className={`flex-1 overflow-auto ${selectedSubmission ? 'border-r border-slate-200' : ''}`}>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="pb-3 text-xs font-bold text-slate-600 uppercase sticky left-0 bg-white z-10">Submitted By</th>
                      <th className="pb-3 text-xs font-bold text-slate-600 uppercase">Email</th>
                      {form.fields.slice(0, 5).map(field => (
                        <th key={field.id} className="pb-3 text-xs font-bold text-slate-600 uppercase min-w-[150px]">
                          {field.label}
                        </th>
                      ))}
                      {form.fields.length > 5 && (
                        <th className="pb-3 text-xs font-bold text-slate-600 uppercase">+{form.fields.length - 5} more</th>
                      )}
                      <th className="pb-3 text-xs font-bold text-slate-600 uppercase">Submitted</th>
                      <th className="pb-3 text-xs font-bold text-slate-600 uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length > 0 ? (
                      submissions.map((submission) => (
                        <tr
                          key={submission.id}
                          onClick={() => setSelectedSubmission(submission)}
                          className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            selectedSubmission?.id === submission.id ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="py-3 text-xs font-bold text-slate-800 sticky left-0 bg-inherit z-10">
                            <div className="flex items-center gap-2">
                              <UserIcon size={12} className="text-slate-400" />
                              {submission.userName || 'Anonymous'}
                            </div>
                          </td>
                          <td className="py-3 text-xs text-slate-600">
                            {submission.userEmail || '—'}
                          </td>
                          {form.fields.slice(0, 5).map(field => (
                            <td key={field.id} className="py-3 text-xs text-slate-700 max-w-[200px] truncate" title={getFieldValue(field, submission)}>
                              {getFieldValue(field, submission)}
                            </td>
                          ))}
                          {form.fields.length > 5 && (
                            <td className="py-3 text-xs text-slate-400">
                              View details →
                            </td>
                          )}
                          <td className="py-3 text-xs text-slate-500">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmission(submission);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {onDeleteSubmission && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this submission?')) {
                                    onDeleteSubmission(submission.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={form.fields.length + 4} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={32} className="opacity-20" />
                            <p className="text-sm font-bold">No submissions yet</p>
                            <p className="text-xs">Submissions will appear here once users fill out the form</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detail View */}
          {selectedSubmission && (
            <div className="w-96 bg-slate-50 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">Submitted By</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{selectedSubmission.userName || 'Anonymous'}</p>
                  {selectedSubmission.userEmail && (
                    <div className="flex items-center gap-1 mt-1">
                      <Mail size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-600">{selectedSubmission.userEmail}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar size={12} className="text-slate-400" />
                    <p className="text-xs text-slate-500">
                      {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.fields.map(field => {
                    const value = selectedSubmission.responses[field.id];
                    return (
                      <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                          {value === undefined || value === null ? (
                            <span className="text-slate-400 italic">No response</span>
                          ) : Array.isArray(value) ? (
                            <ul className="list-disc list-inside space-y-1">
                              {value.map((v, idx) => (
                                <li key={idx}>{v.toString()}</li>
                              ))}
                            </ul>
                          ) : (
                            value.toString()
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};





