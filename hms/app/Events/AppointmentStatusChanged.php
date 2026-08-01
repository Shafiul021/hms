<?php

namespace App\Events;

use App\Models\Appointment;
use Hms\Notifications\Channels\PusherChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Appointment $appointment
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * Uses PusherChannel from hms-notifications to keep channel-name
     * logic centralised and testable.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return PusherChannel::privateChannels([
            PusherChannel::channelName('patient', $this->appointment->patient?->user_id),
            PusherChannel::channelName('doctor',  $this->appointment->doctor?->user_id),
        ]);
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'appointment_id' => $this->appointment->id,
            'status'         => $this->appointment->status->value,
            'patient_name'   => $this->appointment->patient?->name,
            'doctor_name'    => $this->appointment->doctor?->name,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'AppointmentStatusChanged';
    }
}
