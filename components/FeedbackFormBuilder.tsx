
import React, { useState } from 'react';
import { FeedbackForm, FeedbackFormField } from '../types';
import { Plus, X, GripVertical, FileText, Type, Mail, Calendar, Hash, List, Radio, CheckSquare, Star } from 'lucide-react';

interface FeedbackFormBuilderProps {
  form?: FeedbackForm | null;
  onSave: (form: Omit<FeedbackForm, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => void;
  onCancel: () => void;
}

export const FeedbackFormBuilder: React.FC<FeedbackFormBuilderProps> = ({ form, onSave, onCancel }) => {
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<FeedbackFormField[]>(form?.fields || []);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(form?.allowMultipleSubmissions || false);
  const [deadline, setDeadline] = useState(form?.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '');
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

  const fieldTypes: Array<{ value: FeedbackFormField['type']; label: string; icon: any }> = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'textarea', label: 'Textarea', icon: FileText },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'select', label: 'Dropdown', icon: List },
    { value: 'radio', label: 'Radio', icon: Radio },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'rating', label: 'Rating', icon: Star },
  ];

  const addField = () => {
    const newField: FeedbackFormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setFields([...fields, newField]);
    setEditingFieldIndex(fields.length);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  };

  const updateField = (index: number, updates: Partial<FeedbackFormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const addOption = (index: number) => {
    const field = fields[index];
    if (!field.options) field.options = [];
    updateField(index, { options: [...field.options, ''] });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    const updated = [...field.options];
    updated[optionIndex] = value;
    updateField(fieldIndex, { options: updated });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field.options) return;
    updateField(fieldIndex, { options: field.options.filter((_, i) => i !== optionIndex) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }
    if (fields.length === 0) {
      alert('Please add at least one field to the form');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      fields: fields.map(f => ({
        ...f,
        label: f.label.trim(),
        placeholder: f.placeholder?.trim() || undefined,
        options: f.options?.filter(opt => opt.trim() !== '').map(opt => opt.trim())
      })),
      status: form?.status || 'active',
      allowMultipleSubmissions,
      deadline: deadline ? new Date(deadline).toISOString() : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{form ? 'Edit Feedback Form' : 'Create Feedback Form'}</h3>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 font-bold hover:text-rose-500 transition-colors">Cancel</button>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Form Title *</label>
        <input
          autoFocus
          className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm font-medium transition-all"
          placeholder="e.g., Employee Satisfaction Survey"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
        <textarea
          className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm min-h-[80px] leading-relaxed transition-all resize-none"
          placeholder="Describe the purpose of this form..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase">Form Fields *</label>
          <button
            type="button"
            onClick={addField}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
          >
            <Plus size={12} /> Add Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500">Field {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="ml-auto p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Label *</label>
                  <input
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Type *</label>
                  <select
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as FeedbackFormField['type'] })}
                    required
                  >
                    {fieldTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Placeholder</label>
                <input
                  className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                />
              </div>

              {['select', 'radio', 'checkbox'].includes(field.type) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Options *</label>
                    <button
                      type="button"
                      onClick={() => addOption(index)}
                      className="px-2 py-1 bg-blue-600 text-white text-[9px] font-bold rounded-lg flex items-center gap-1"
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(field.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          className="flex-1 p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                          value={option}
                          onChange={(e) => updateOption(index, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index, optIndex)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(!field.options || field.options.length === 0) && (
                      <p className="text-[9px] text-slate-400">Add at least one option</p>
                    )}
                  </div>
                </div>
              )}

              {field.type === 'rating' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Min</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                      value={field.min || 1}
                      onChange={(e) => updateField(index, { min: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Max</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                      value={field.max || 5}
                      onChange={(e) => updateField(index, { max: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>
              )}

              {field.type === 'textarea' && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Rows</label>
                  <input
                    type="number"
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 focus:border-blue-500 text-xs font-medium transition-all"
                    value={field.rows || 4}
                    onChange={(e) => updateField(index, { rows: parseInt(e.target.value) || 4 })}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs font-bold text-slate-700">Required field</span>
              </label>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-xs text-slate-400 font-medium">No fields added yet</p>
              <p className="text-[10px] text-slate-300 mt-1">Click "Add Field" to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={allowMultipleSubmissions}
            onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-bold text-slate-700">Allow users to submit multiple times</span>
        </label>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline (Optional)</label>
          <input
            type="datetime-local"
            className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 text-sm font-medium transition-all"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
        <FileText size={16} /> {form ? 'Update Form' : 'Create Form'}
      </button>
    </form>
  );
};

