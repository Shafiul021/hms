<?php

namespace Hms\Notifications\Channels;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * PusherChannel
 *
 * A reusable helper for building Pusher private broadcast channel arrays.
 * Use this inside any ShouldBroadcast event to keep channel logic centralised.
 *
 * Usage in an event:
 *
 *   public function broadcastOn(): array
 *   {
 *       return PusherChannel::privateChannels([
 *           'user.' . $this->appointment->patient->user_id,
 *           'user.' . $this->appointment->doctor->user_id,
 *       ]);
 *   }
 */
class PusherChannel
{
    /**
     * Build an array of PrivateChannel instances from a list of channel names.
     *
     * @param  string[]  $channelNames
     * @return \Illuminate\Broadcasting\PrivateChannel[]
     */
    public static function privateChannels(array $channelNames): array
    {
        return array_map(
            static fn (string $name) => new PrivateChannel($name),
            $channelNames,
        );
    }

    /**
     * Build a single PrivateChannel instance.
     *
     * @param  string  $channelName
     * @return \Illuminate\Broadcasting\PrivateChannel
     */
    public static function privateChannel(string $channelName): PrivateChannel
    {
        return new PrivateChannel($channelName);
    }

    /**
     * Resolve a role-based channel name for HMS actors.
     *
     * Supported roles: 'patient', 'doctor', 'admin'
     *
     * @param  string  $role   HMS role name
     * @param  int|null  $userId  User ID (null for global admin channel)
     * @return string
     */
    public static function channelName(string $role, ?int $userId = null): string
    {
        return match ($role) {
            'patient' => "patient.{$userId}",
            'doctor'  => "doctor.{$userId}",
            'admin'   => 'admin',
            default   => "user.{$userId}",
        };
    }
}
