import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipdApi } from '../../api/ipd';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { NursingNotes } from '../ipd/NursingNotes';
import { PatientCodeChip } from '@hms/ui';
import { 
    Activity, 
    Bed, 
    Layers, 
    UserPlus, 
    FileText, 
    ClipboardList, 
    LogOut 
} from 'lucide-react';

export const NurseDashboard = () => {
    const navigate = useNavigate();

    const [wards, setWards] = useState([]);
    const [admissions, setAdmissions] = useState([]); // Mock/list of active patients config
    const [loading, setLoading] = useState(true);

    // Selected admission for writing notes
    const [activeAdmissionId, setActiveAdmissionId] = useState(null);
    const [activePatientName, setActivePatientName] = useState('');

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const wardsData = await ipdApi.getWards();
                const list = wardsData.data || wardsData;
                setWards(list);

                // Compile all admissions from occupied beds dynamically
                const allAdmissions = [];
                for (const ward of list) {
                    const bedsData = await ipdApi.getBeds(ward.id);
                    const bedList = bedsData.data || bedsData;
                    bedList.forEach((bed) => {
                        if (bed.current_admission) {
                            allAdmissions.push({
                                ...bed.current_admission,
                                wardName: ward.name,
                                bedNumber: bed.bed_number
                            });
                        }
                    });
                }
                setAdmissions(allAdmissions);
            } catch (err) {
                // Silently catch
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const handleOpenNotes = (admission) => {
        setActiveAdmissionId(admission.id);
        setActivePatientName(admission.patient?.name || 'Patient');
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-gray-150 rounded-2xl" />
                    <div className="h-32 bg-gray-150 rounded-2xl" />
                    <div className="h-32 bg-gray-150 rounded-2xl" />
                </div>
            </div>
        );
    }

    // Totals calculations
    const totalWards = wards.length;
    const occupiedBedsCount = admissions.length;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-indigo-500" />
                        Nurse Station Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage inpatient admissions, check ward status, and log nursing observations.
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate('/ipd')}
                        icon={<Layers className="w-4 h-4" />}
                    >
                        Ward Bed Map
                    </Button>
                    <Button 
                        onClick={() => navigate('/ipd/admit')}
                        icon={<UserPlus className="w-4 h-4" />}
                    >
                        Admit Patient
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-500">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Wards Tracked</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalWards}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-red-50 rounded-2xl text-red-500">
                        <Bed className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Occupied Beds</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{occupiedBedsCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-green-50 rounded-2xl text-green-500">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Active Inpatients</p>
                        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{admissions.length}</p>
                    </div>
                </div>

            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Wards occupancy list */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-500" />
                        Ward Occupancy
                    </h2>
                    
                    <div className="space-y-3.5">
                        {wards.map((ward) => (
                            <div key={ward.id} className="space-y-1.5">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-gray-800">{ward.name}</span>
                                    <span className="text-gray-500 text-xs font-semibold">{ward.type}</span>
                                </div>
                                <div className="w-full bg-gray-155/30 bg-gray-100 rounded-full h-2">
                                    <div 
                                        className="bg-indigo-600 h-2 rounded-full" 
                                        style={{ width: '40%' }} // Simple indicator width
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Occupied beds & active patient notes */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-500" />
                        Current Inpatient Roster
                    </h2>

                    {admissions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-12">No patients currently admitted to any wards.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {['Patient', 'Ward / Bed', 'Admitted At', 'Observations'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {admissions.map((adm) => (
                                        <tr key={adm.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800">{adm.patient?.name}</span>
                                                    <PatientCodeChip code={adm.patient?.patient_code} size="xs" />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {adm.wardName} — Bed {adm.bedNumber}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(adm.admitted_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleOpenNotes(adm)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                                >
                                                    <FileText className="w-4 h-4" /> Open Logs
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal: Write Nursing Notes */}
            <Modal
                isOpen={!!activeAdmissionId}
                title={`Nursing Logs: ${activePatientName}`}
                onClose={() => setActiveAdmissionId(null)}
            >
                {activeAdmissionId && <NursingNotes admissionId={activeAdmissionId} />}
            </Modal>
        </div>
    );
};
