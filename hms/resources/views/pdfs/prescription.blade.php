<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Prescription</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 13px; color: #333; margin: 0; padding: 0; }
        .header { width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
        .header td { vertical-align: middle; }
        .hospital-name { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .tagline { font-size: 12px; color: #64748b; margin-top: 2px; }
        .hospital-details { text-align: right; font-size: 11px; color: #475569; line-height: 1.4; }
        
        .title-band { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 20px; text-transform: uppercase; }
        
        .info-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
        .info-table td { width: 50%; vertical-align: top; padding: 10px; border: 1px solid #e2e8f0; }
        .info-title { font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
        
        .medicines-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .medicines-table th { background: #2563eb; color: #ffffff; text-align: left; padding: 10px; font-size: 12px; border: 1px solid #2563eb; }
        .medicines-table td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
        .medicines-table tr:nth-child(even) { background-color: #f8fafc; }
        
        .footer { position: fixed; bottom: -20px; left: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; }
        .signature-box { float: right; text-align: center; width: 200px; margin-top: 20px; margin-right: 10px; }
        .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px; }
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
        Prescription
    </div>

    <table class="info-table">
        <tr>
            <td>
                <div class="info-title">Patient Information</div>
                <strong>Name:</strong> {{ $appointment->patient->user->name ?? 'N/A' }}<br>
                <strong>Patient ID:</strong> {{ $appointment->patient->patient_code ?? 'N/A' }}<br>
                <strong>Gender:</strong> {{ ucfirst($appointment->patient->gender ?? 'N/A') }}<br>
                <strong>Date of Birth:</strong> {{ $appointment->patient->date_of_birth ?? 'N/A' }}<br>
                <strong>Contact:</strong> {{ $appointment->patient->user->phone ?? 'N/A' }}
            </td>
            <td>
                <div class="info-title">Consultation Details</div>
                <strong>Doctor:</strong> Dr. {{ $appointment->doctor->user->name ?? 'N/A' }}<br>
                <strong>Specialization:</strong> {{ $appointment->doctor->specialization ?? 'N/A' }}<br>
                <strong>Date:</strong> {{ \Carbon\Carbon::parse($appointment->date)->format('F j, Y') }}<br>
                <strong>Appointment ID:</strong> #{{ str_pad($appointment->id, 6, '0', STR_PAD_LEFT) }}<br>
                <strong>Type:</strong> {{ ucfirst($appointment->type?->value ?? $appointment->type ?? 'OPD') }}
            </td>
        </tr>
    </table>

    @if($appointment->diagnosis)
    <div style="margin-bottom: 20px; padding-top: 10px;">
        <div class="info-title" style="margin-bottom: 8px;">Clinical Notes & Diagnosis</div>
        @if($appointment->diagnosis->physical_examination && is_array($appointment->diagnosis->physical_examination))
            <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Physical Examination:</strong></p>
            <ul style="font-size: 13px; margin-top: 0; padding-left: 20px; margin-bottom: 10px;">
                @foreach($appointment->diagnosis->physical_examination as $key => $val)
                    <li><strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ is_array($val) ? json_encode($val) : $val }}</li>
                @endforeach
            </ul>
        @endif
        @if($appointment->diagnosis->notes)
            <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Notes:</strong> {{ $appointment->diagnosis->notes }}</p>
        @endif
        @if($appointment->diagnosis->description)
            <p style="margin: 0; font-size: 13px;"><strong>Diagnosis:</strong> {{ $appointment->diagnosis->description }} 
            @if($appointment->diagnosis->icd_code) ({{ $appointment->diagnosis->icd_code }}) @endif
            </p>
        @endif
    </div>
    @endif

    @if($appointment->labRequests && $appointment->labRequests->count() > 0)
    <div style="margin-bottom: 20px;">
        <div class="info-title" style="margin-bottom: 8px;">Ordered Lab Tests</div>
        <ul style="font-size: 13px; margin: 0; padding-left: 20px;">
            @foreach($appointment->labRequests as $request)
                <li>{{ $request->test->name ?? 'Lab Test' }} @if($request->notes) - <span style="color: #64748b; font-size: 12px;">{{ $request->notes }}</span> @endif</li>
            @endforeach
        </ul>
    </div>
    @endif

    <div class="info-title" style="margin-bottom: 10px;">Prescribed Medicines</div>
    <table class="medicines-table">
        <thead>
            <tr>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
            </tr>
        </thead>
        <tbody>
            @if($appointment->prescription && $appointment->prescription->items && count($appointment->prescription->items) > 0)
                @foreach($appointment->prescription->items as $item)
                    <tr>
                        <td><strong>{{ $item->medicine->name ?? 'Unknown Medicine' }}</strong></td>
                        <td>{{ $item->dosage }}</td>
                        <td>{{ $item->frequency }}</td>
                        <td>{{ $item->duration }}</td>
                        <td>{{ $item->instructions ?? '-' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="5" style="text-align: center; color: #64748b;">No medicines prescribed.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div style="width: 100%; display: block; margin-top: 50px;">
        <div class="signature-box">
            <div class="signature-line"></div>
            <strong>Dr. {{ $appointment->doctor->user->name ?? 'Doctor' }}</strong><br>
            <span style="font-size: 10px; color: #64748b;">{{ $appointment->doctor->specialization ?? '' }}</span>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        Generated on {{ now()->format('d M Y, H:i A') }} by {{ config('hospital.name') }} System.
        <span style="float: right;">Page 1 of 1</span>
    </div>
</body>
</html>
