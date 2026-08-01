<?php

namespace App\Mail;

use App\Models\Appointment;
use Hms\Notifications\Templates\AppointmentMailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentStatusMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Pre-built template data from hms-notifications.
     *
     * @var array<string, mixed>
     */
    protected array $templateData;

    /**
     * Create a new message instance.
     *
     * Delegates all data-building to AppointmentMailTemplate so this
     * Mailable stays thin — single-responsibility principle.
     */
    public function __construct(
        public readonly Appointment $appointment,
    ) {
        $this->templateData = AppointmentMailTemplate::build($appointment);
    }

    /**
     * Get the message envelope.
     *
     * Subject is resolved centrally via AppointmentMailTemplate::subject().
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: AppointmentMailTemplate::subject($this->appointment),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.appointment-status',
            with: $this->templateData,
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
