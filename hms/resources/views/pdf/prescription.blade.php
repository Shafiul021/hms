<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Prescription #{{ $prescription->id }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
        .header p { margin: 5px 0 0; color: #6b7280; font-size: 14px; }
        .info-grid { width: 100%; margin-bottom: 30px; }
        .info-grid td { width: 50%; vertical-align: top; }
        .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px; }
        .info-box h3 { margin: 0 0 10px; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
        .info-box p { margin: 5px 0; }
        .info-box strong { color: #1e293b; }
        .medicines-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .medicines-table th { background: #f1f5f9; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; text-transform: uppercase; }
        .medicines-table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .medicines-table tr:last-child td { border-bottom: none; }
        .notes-section { margin-bottom: 30px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; }
        .notes-section h3 { margin: 0 0 5px; color: #b45309; font-size: 14px; }
        .notes-section p { margin: 0; color: #78350f; }
        .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .signature { margin-top: 50px; width: 250px; border-top: 1px solid #94a3b8; padding-top: 10px; text-align: center; float: right; }
        .dispensed-badge { display: inline-block; padding: 5px 10px; background: #dcfce7; color: #166534; font-weight: bold; font-size: 12px; border-radius: 4px; border: 1px solid #bbf7d0; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HMS Clinic</h1>
        <p>123 Medical Center Drive, Health City</p>
        <p>Phone: +1 234 567 890 | Email: contact@hms.com</p>
    </div>

    <table class="info-grid">
        <tr>
            <td style="padding-right: 10px;">
                <div class="info-box">
                    <h3>Patient Details</h3>
                    <p><strong>Name:</strong> {{ $prescription->patient->user->first_name }} {{ $prescription->patient->user->last_name }}</p>
                    <p><strong>Gender:</strong> {{ ucfirst($prescription->patient->gender) }}</p>
                    <p><strong>Date of Birth:</strong> {{ $prescription->patient->date_of_birth ? $prescription->patient->date_of_birth->format('M d, Y') : 'N/A' }}</p>
                    <p><strong>Blood Group:</strong> {{ $prescription->patient->blood_group ?? 'N/A' }}</p>
                </div>
            </td>
            <td style="padding-left: 10px;">
                <div class="info-box">
                    <h3>Prescription Details</h3>
                    <p><strong>ID:</strong> #{{ str_pad($prescription->id, 5, '0', STR_PAD_LEFT) }}</p>
                    <p><strong>Date:</strong> {{ $prescription->created_at->format('M d, Y - h:i A') }}</p>
                    <p><strong>Doctor:</strong> Dr. {{ $prescription->doctor->user->first_name }} {{ $prescription->doctor->user->last_name }}</p>
                    @if($prescription->dispensing)
                        <div class="dispensed-badge">Dispensed on {{ $prescription->dispensing->dispensed_at->format('M d, Y') }}</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <h3 style="color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px;">Prescribed Medicines</h3>
    
    <table class="medicines-table">
        <thead>
            <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
            @forelse($prescription->items as $item)
            <tr>
                <td><strong>{{ $item->medicine ? $item->medicine->name : 'N/A' }}</strong></td>
                <td>{{ $item->dosage }}</td>
                <td>{{ $item->frequency }}</td>
                <td>{{ $item->duration }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #64748b;">No medicines prescribed.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if($prescription->notes)
    <div class="notes-section">
        <h3>Doctor's Notes & Instructions</h3>
        <p>{{ $prescription->notes }}</p>
    </div>
    @endif

    <div class="signature">
        <p style="margin: 0; font-weight: bold;">Dr. {{ $prescription->doctor->user->first_name }} {{ $prescription->doctor->user->last_name }}</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">Signature</p>
    </div>

    <div style="clear: both;"></div>

    <div class="footer">
        Generated by HMS Monorepo on {{ now()->format('M d, Y h:i A') }}.
    </div>
</body>
</html>
