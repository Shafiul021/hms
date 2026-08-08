<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Consultation Bill</title>
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
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background: #2563eb; color: #ffffff; text-align: left; padding: 10px; font-size: 12px; border: 1px solid #2563eb; }
        .items-table td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
        .items-table tr:nth-child(even) { background-color: #f8fafc; }
        .items-table .text-right { text-align: right; }
        
        .summary-box { float: right; width: 300px; border: 1px solid #e2e8f0; padding: 10px; background: #f8fafc; margin-bottom: 40px; }
        .summary-table { width: 100%; border-collapse: collapse; }
        .summary-table td { padding: 5px 0; }
        .summary-label { font-weight: bold; text-align: right; padding-right: 10px; }
        .summary-value { text-align: right; width: 100px; }
        .total-row td { border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 5px; font-size: 16px; font-weight: bold; color: #1e3a8a; }
        
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-unpaid { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-partial { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        
        .footer { position: fixed; bottom: -20px; left: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; }
        .signature-box { float: left; text-align: center; width: 200px; margin-top: 50px; }
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
        Consultation Bill
    </div>

    <table class="info-table">
        <tr>
            <td>
                <div class="info-title">Patient Information</div>
                <strong>Name:</strong> {{ $appointment->patient->user->name ?? 'N/A' }}<br>
                <strong>Patient ID:</strong> {{ $appointment->patient->patient_code ?? 'N/A' }}<br>
                <strong>Contact:</strong> {{ $appointment->patient->user->phone ?? 'N/A' }}
            </td>
            <td>
                <div class="info-title">Bill Details</div>
                <strong>Bill ID:</strong> #{{ str_pad($appointment->bill->id ?? 0, 6, '0', STR_PAD_LEFT) }}<br>
                <strong>Date:</strong> {{ \Carbon\Carbon::parse($appointment->date)->format('F j, Y') }}<br>
                <strong>Consulting Doctor:</strong> Dr. {{ $appointment->doctor->user->name ?? 'N/A' }}<br>
                <strong>Status:</strong> 
                @php $status = strtolower($appointment->bill->status ?? 'unpaid'); @endphp
                <span class="status-badge status-{{ $status }}">{{ $appointment->bill->status ?? 'Unpaid' }}</span>
            </td>
        </tr>
    </table>

    <div class="info-title" style="margin-bottom: 10px;">Itemized Charges</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 20%;" class="text-right">Unit Price</th>
                <th style="width: 20%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @if($appointment->bill && $appointment->bill->items && count($appointment->bill->items) > 0)
                @foreach($appointment->bill->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td style="text-align: center;">{{ $item->quantity }}</td>
                        <td class="text-right">${{ number_format($item->unit_price, 2) }}</td>
                        <td class="text-right">${{ number_format($item->total, 2) }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" style="text-align: center; color: #64748b;">No items found.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div style="width: 100%; display: block;">
        <div class="signature-box">
            <div class="signature-line"></div>
            <strong>Authorized Signatory</strong><br>
            <span style="font-size: 10px; color: #64748b;">Accounts Department</span>
        </div>

        <div class="summary-box">
            <table class="summary-table">
                <tr>
                    <td class="summary-label">Subtotal:</td>
                    <td class="summary-value">${{ number_format($appointment->bill->total_amount ?? 0, 2) }}</td>
                </tr>
                <tr>
                    <td class="summary-label">Discount:</td>
                    <td class="summary-value">$0.00</td>
                </tr>
                <tr>
                    <td class="summary-label">Tax:</td>
                    <td class="summary-value">$0.00</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label">Grand Total:</td>
                    <td class="summary-value">${{ number_format($appointment->bill->total_amount ?? 0, 2) }}</td>
                </tr>
            </table>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        Generated on {{ now()->format('d M Y, H:i A') }} by {{ config('hospital.name') }} System.
        <span style="float: right;">Page 1 of 1</span>
    </div>
</body>
</html>
