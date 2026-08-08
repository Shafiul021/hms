<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Medical History</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 13px; color: #333; margin: 0; padding: 0; }
        .header { width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
        .header td { vertical-align: middle; }
        .hospital-name { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .tagline { font-size: 12px; color: #64748b; margin-top: 2px; }
        .hospital-details { text-align: right; font-size: 11px; color: #475569; line-height: 1.4; }
        
        .title-band { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 20px; text-transform: uppercase; }
        
        .info-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
        .info-table td { width: 100%; vertical-align: top; padding: 10px; border: 1px solid #e2e8f0; }
        .info-title { font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
        
        .timeline-entry { margin-bottom: 20px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
        .timeline-header { background: #2563eb; color: #ffffff; padding: 8px 10px; font-weight: bold; font-size: 14px; }
        .timeline-body { padding: 10px; }
        
        .section-title { font-weight: bold; color: #1e3a8a; margin-top: 10px; margin-bottom: 5px; font-size: 13px; text-transform: uppercase; }
        .data-list { margin: 0 0 10px 0; padding-left: 20px; }
        .data-list li { margin-bottom: 3px; }
        
        .footer { position: fixed; bottom: -20px; left: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <h1 class="hospital-name">{{ config('hospital.name') }}</h1>
                <div class="tagline">{{ config('hospital.tagline') }}</div>
            </td>
            <td class="hospital-details">
                {{ config('hospital.address') }}<br>
                Phone: {{ config('hospital.phone') }}<br>
                Email: {{ config('hospital.email') }}<br>
                Reg No: {{ config('hospital.registration_number') }}
            </td>
        </tr>
    </table>

    <div class="title-band">
        Patient Medical History
    </div>

    <table class="info-table">
        <tr>
            <td>
                <div class="info-title">Patient Information</div>
                <strong>Name:</strong> {{ $patient->user->name ?? 'N/A' }} &nbsp;|&nbsp;
                <strong>Patient ID:</strong> {{ $patient->patient_code ?? 'N/A' }} &nbsp;|&nbsp;
                <strong>Gender:</strong> {{ ucfirst($patient->gender ?? 'N/A') }} &nbsp;|&nbsp;
                <strong>DOB:</strong> {{ $patient->date_of_birth ?? 'N/A' }}<br>
                <strong>Contact:</strong> {{ $patient->user->phone ?? 'N/A' }} &nbsp;|&nbsp;
                <strong>Total Visits:</strong> {{ $patient->appointments->count() }}
            </td>
        </tr>
    </table>

    @forelse($patient->appointments as $appointment)
        <div class="timeline-entry">
            <div class="timeline-header">
                Visit on {{ \Carbon\Carbon::parse($appointment->date)->format('d M Y, h:i A') }} 
                (Dr. {{ $appointment->doctor->user->name ?? 'Unknown' }})
            </div>
            <div class="timeline-body">
                
                <div class="section-title">Symptoms</div>
                @if($appointment->symptoms && $appointment->symptoms->count() > 0)
                    <ul class="data-list">
                        @foreach($appointment->symptoms as $symptom)
                            <li>{{ $symptom->description }}</li>
                        @endforeach
                    </ul>
                @else
                    <p style="margin: 0 0 10px 0; color: #64748b; font-style: italic; font-size: 12px;">No symptoms recorded.</p>
                @endif

                <div class="section-title">Diagnosis</div>
                @if($appointment->diagnosis)
                    <ul class="data-list">
                        <li>{{ $appointment->diagnosis->description ?? 'Diagnosis recorded' }}
                        @if($appointment->diagnosis->icd_code) ({{ $appointment->diagnosis->icd_code }}) @endif
                        </li>
                    </ul>
                @else
                    <p style="margin: 0 0 10px 0; color: #64748b; font-style: italic; font-size: 12px;">No diagnoses recorded.</p>
                @endif

                <div class="section-title">Lab Requests</div>
                @if($appointment->labRequests && $appointment->labRequests->count() > 0)
                    <ul class="data-list">
                        @foreach($appointment->labRequests as $request)
                            <li>{{ $request->test->name ?? 'Lab Test' }} - <strong>{{ ucfirst($request->status) }}</strong></li>
                        @endforeach
                    </ul>
                @else
                    <p style="margin: 0 0 10px 0; color: #64748b; font-style: italic; font-size: 12px;">No lab requests recorded.</p>
                @endif
                
                <div class="section-title">Prescription Summary</div>
                @if($appointment->prescription && $appointment->prescription->items && $appointment->prescription->items->count() > 0)
                    <ul class="data-list">
                        @foreach($appointment->prescription->items as $item)
                            <li>{{ $item->medicine->name ?? 'Unknown' }} ({{ $item->dosage }}, {{ $item->frequency }})</li>
                        @endforeach
                    </ul>
                @else
                    <p style="margin: 0 0 10px 0; color: #64748b; font-style: italic; font-size: 12px;">No medicines prescribed.</p>
                @endif

            </div>
        </div>
    @empty
        <div style="text-align: center; color: #64748b; padding: 20px; border: 1px dashed #cbd5e1;">
            No medical history or appointments found for this patient.
        </div>
    @endforelse

    <div class="footer">
        Generated on {{ now()->format('d M Y, H:i A') }} by {{ config('hospital.name') }} System.
        <span style="float: right;">Chronological Record</span>
    </div>
</body>
</html>
