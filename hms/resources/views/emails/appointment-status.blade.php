<x-mail::message>
# Appointment {{ $statusLabel }}

Dear **{{ $details['patient_name'] }}**,

Your appointment status has been updated to **{{ $statusLabel }}**.

---

<x-mail::panel>
**Appointment Details**

| Field       | Details                        |
|-------------|--------------------------------|
| Date        | {{ $details['date'] }}         |
| Time        | {{ $details['time'] }}         |
| Doctor      | {{ $details['doctor_name'] }}  |
| Speciality  | {{ $details['speciality'] }}   |
| Notes       | {{ $details['notes'] }}        |
</x-mail::panel>

@if($isCancelled)
> We apologise for any inconvenience. Please contact us to reschedule your appointment.
@elseif($isConfirmed)
> Please arrive **15 minutes** before your scheduled time with your patient ID card.
@else
> If you have questions about your appointment, please contact our reception.
@endif

<x-mail::button :url="config('app.url')">
Visit HMS Portal
</x-mail::button>

Thanks,<br>
{{ config('app.name') }} Team
</x-mail::message>
