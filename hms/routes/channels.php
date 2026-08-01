<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
| Laravel 11/12 might load this file via the BroadcastServiceProvider or bootstrap app configuration.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('patient.{patientId}', function ($user, $patientId) {
    if ($user->hasAnyRole(['admin', 'doctor', 'nurse', 'receptionist'])) {
        return true;
    }
    return $user->patient && (int) $user->patient->id === (int) $patientId;
});

Broadcast::channel('doctor.{doctorId}', function ($user, $doctorId) {
    if ($user->hasRole('admin')) {
        return true;
    }
    return $user->doctor && (int) $user->doctor->id === (int) $doctorId;
});

Broadcast::channel('admin', function ($user) {
    return $user->hasRole('admin');
});
