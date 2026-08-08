import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { prescriptionsApi } from '../../api/prescriptionsApi';
import { appointmentsApi } from '../../api/appointments';
import { Printer, ArrowLeft, Activity } from 'lucide-react';

// Zod Schema for validation
const prescriptionSchema = z.object({
    id: z.number(),
    patient: z.object({
        id: z.number(),
        user: z.object({
            name: z.string(),
            phone: z.string().nullable().optional(),
        }),
        patient_code: z.string(),
        gender: z.string().nullable().optional(),
        date_of_birth: z.string().nullable().optional(),
    }),
    doctor: z.object({
        id: z.number(),
        user: z.object({
            name: z.string(),
        }),
        specialization: z.string().nullable().optional(),
    }),
    appointment: z.object({
        id: z.number(),
        date: z.string(),
    }),
    diagnosis: z.object({
        id: z.number(),
        description: z.string().nullable().optional(),
        icd_code: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        physical_examination: z.any().nullable().optional(),
    }).nullable().optional(),
    lab_requests: z.array(z.object({
        id: z.number(),
        test: z.object({
            name: z.string(),
        }).nullable().optional(),
        notes: z.string().nullable().optional(),
    })).optional(),
    symptoms: z.array(z.object({
        id: z.number(),
        name: z.string(),
    })).optional(),
    items: z.array(z.object({
        id: z.number(),
        medicine: z.object({
            name: z.string(),
        }).nullable().optional(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string().nullable().optional(),
    })),
    notes: z.string().nullable().optional(),
    created_at: z.string(),
});

export const PrescriptionView = () => {
    const { id } = useParams();

    const { data: rawData, isLoading, isError, error } = useQuery({
        queryKey: ['prescription', id],
        queryFn: () => prescriptionsApi.getPrescription(id),
    });

    // Validating the response data
    let data = null;
    let validationError = null;
    
    if (rawData) {
        // Support { data: {...} } envelope often returned by Laravel Resources
        const payload = rawData.data || rawData;
        const result = prescriptionSchema.safeParse(payload);
        if (result.success) {
            data = result.data;
        } else {
            validationError = result.error;
            console.error("Prescription validation error:", result.error);
        }
    }

    const handlePrint = async () => {
        if (!data || !data.appointment || !data.appointment.id) {
            window.print();
            return;
        }
        
        try {
            const blob = await appointmentsApi.downloadPrescription(data.appointment.id);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (err) {
            console.error("Failed to download prescription PDF", err);
            // Fallback to normal print if API fails
            window.print();
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto animate-pulse">
                <div className="h-8 w-32 bg-slate-200 rounded mb-6"></div>
                <div className="bg-white p-8 border border-slate-200 rounded-lg shadow-sm">
                    <div className="h-16 bg-slate-200 rounded mb-8"></div>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="h-24 bg-slate-100 rounded"></div>
                        <div className="h-24 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-32 bg-slate-100 rounded mb-8"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="h-48 bg-slate-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (isError || validationError) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Activity className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading prescription</h3>
                            <div className="mt-2 text-sm text-red-700">
                                {isError ? error?.message || 'Failed to fetch prescription.' : 'The data received from the server was invalid.'}
                            </div>
                            {validationError && (
                                <pre className="mt-4 p-2 bg-red-100 text-xs overflow-auto rounded">
                                    {JSON.stringify(validationError.format(), null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Derived values
    const age = data.patient.date_of_birth ? new Date().getFullYear() - new Date(data.patient.date_of_birth).getFullYear() : 'N/A';
    
    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto print:p-0 print:max-w-none print:m-0 print:bg-white">
            
            {/* Action Bar - Hidden on print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Link to="/appointments" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Appointments
                </Link>
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Print / Download PDF
                </button>
            </div>

            {/* Prescription Document Area */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
                
                {/* Hospital Header */}
                <div className="bg-indigo-50/50 p-6 md:p-8 border-b border-indigo-100 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-1">HMS General Hospital</h1>
                    <p className="text-sm text-indigo-700">123 Health Avenue, Medical District, Cityville</p>
                    <p className="text-sm text-indigo-700">Phone: (555) 123-4567 | Email: contact@hmshospital.com</p>
                </div>

                <div className="p-6 md:p-8">
                    {/* Meta Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Details</h2>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Name:</span> {data.patient.user.name}</p>
                            <p className="text-sm text-slate-800"><span className="font-semibold">ID:</span> {data.patient.patient_code}</p>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Age/Gender:</span> {age} Yrs / {data.patient.gender ? data.patient.gender.charAt(0).toUpperCase() + data.patient.gender.slice(1) : 'N/A'}</p>
                            {data.patient.user.phone && <p className="text-sm text-slate-800"><span className="font-semibold">Contact:</span> {data.patient.user.phone}</p>}
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consultation Details</h2>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Doctor:</span> Dr. {data.doctor.user.name}</p>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Specialization:</span> {data.doctor.specialization || 'General'}</p>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Date:</span> {new Date(data.appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-slate-800"><span className="font-semibold">Prescription ID:</span> #{data.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Left Column: Clinical Notes */}
                        <div className="lg:col-span-1 border-r-0 lg:border-r border-slate-100 lg:pr-8 space-y-6">
                            
                            {/* Chief Complaints / Symptoms */}
                            {data.symptoms && data.symptoms.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">Chief Complaints</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                                        {data.symptoms.map(s => <li key={s.id}>{s.name}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Physical Examination */}
                            {data.diagnosis && data.diagnosis.physical_examination && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">Physical Examination</h3>
                                    <div className="text-sm text-slate-700 space-y-1">
                                        {Object.entries(data.diagnosis.physical_examination).map(([key, val]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="font-medium text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span>{typeof val === 'object' ? JSON.stringify(val) : val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lab Tests */}
                            {data.lab_requests && data.lab_requests.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">Ordered Lab Tests</h3>
                                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 ml-1">
                                        {data.lab_requests.map(req => (
                                            <li key={req.id}>
                                                {req.test?.name || 'Unknown Test'}
                                                {req.notes && <span className="text-slate-500 text-xs ml-1">- {req.notes}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Diagnosis */}
                            {data.diagnosis && (data.diagnosis.description || data.diagnosis.notes) && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">Diagnosis</h3>
                                    {data.diagnosis.description && (
                                        <p className="text-sm text-slate-800 font-semibold">
                                            {data.diagnosis.description}
                                            {data.diagnosis.icd_code && <span className="font-normal text-slate-500 text-xs ml-1">({data.diagnosis.icd_code})</span>}
                                        </p>
                                    )}
                                    {data.diagnosis.notes && (
                                        <p className="text-sm text-slate-700 mt-1">{data.diagnosis.notes}</p>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Right Column: Rx */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <div className="flex items-end mb-4">
                                    <span className="text-4xl font-serif text-slate-900 leading-none">Rx</span>
                                </div>

                                {data.items && data.items.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium">Medicine</th>
                                                    <th className="px-4 py-3 text-left font-medium">Dosage</th>
                                                    <th className="px-4 py-3 text-left font-medium">Frequency</th>
                                                    <th className="px-4 py-3 text-left font-medium">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {data.items.map((item, index) => (
                                                    <tr key={item.id || index} className="group hover:bg-slate-50 print:hover:bg-white">
                                                        <td className="px-4 py-3">
                                                            <p className="font-medium text-slate-900">{item.medicine?.name || 'Unknown'}</p>
                                                            {item.instructions && <p className="text-xs text-slate-500 mt-1">{item.instructions}</p>}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">{item.dosage}</td>
                                                        <td className="px-4 py-3 text-slate-700">{item.frequency}</td>
                                                        <td className="px-4 py-3 text-slate-700">{item.duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-200">No medicines prescribed.</p>
                                )}
                            </div>

                            {/* Advice / Notes */}
                            {data.notes && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">General Advice</h3>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
                                </div>
                            )}

                        </div>
                    </div>
                    
                    {/* Signatures */}
                    <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-end">
                        <div className="text-xs text-slate-400">
                            Generated on {new Date().toLocaleDateString()}
                        </div>
                        <div className="text-center w-48">
                            <div className="border-b border-slate-800 mb-2 h-12"></div>
                            <p className="text-sm font-semibold text-slate-900">Dr. {data.doctor.user.name}</p>
                            <p className="text-xs text-slate-500">{data.doctor.specialization || 'Medical Officer'}</p>
                        </div>
                    </div>

                </div>
            </div>
            
            <style>
                {`
                @media print {
                    @page { margin: 10mm; }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: white !important;
                    }
                    /* Assuming the layout wraps this in a container that needs to hide sidebars */
                    nav, aside, header { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
                }
                `}
            </style>
        </div>
    );
};

export default PrescriptionView;
