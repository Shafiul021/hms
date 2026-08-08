import React from 'react';
import { Activity } from 'lucide-react';

const EXAM_FIELDS = [
    { id: 'blood_pressure', label: 'Blood Pressure', placeholder: 'e.g. 120/80 mmHg' },
    { id: 'heart_rate', label: 'Heart Rate', placeholder: 'e.g. 75 bpm' },
    { id: 'temperature', label: 'Temperature', placeholder: 'e.g. 98.6 F' },
    { id: 'respiratory_rate', label: 'Respiratory Rate', placeholder: 'e.g. 16 breaths/min' },
    { id: 'oxygen_saturation', label: 'Oxygen Saturation', placeholder: 'e.g. 99% SpO2' },
    { id: 'chest_condition', label: 'Chest Condition', placeholder: 'e.g. clear, wheezing' }
];

export const PhysicalExamination = ({ physicalExam, setPhysicalExam }) => {
    
    const handleToggle = (fieldId) => {
        setPhysicalExam(prev => {
            const next = { ...prev };
            if (next[fieldId] !== undefined) {
                // If exists, remove it
                delete next[fieldId];
            } else {
                // If not, add empty string
                next[fieldId] = '';
            }
            return next;
        });
    };

    const handleChange = (fieldId, value) => {
        setPhysicalExam(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                Physical Examination
            </label>

            <div className="flex flex-wrap gap-3">
                {EXAM_FIELDS.map(field => (
                    <label key={field.id} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            checked={physicalExam[field.id] !== undefined}
                            onChange={() => handleToggle(field.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    </label>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {EXAM_FIELDS.filter(f => physicalExam[f.id] !== undefined).map(field => (
                    <div key={field.id} className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            value={physicalExam[field.id] || ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
