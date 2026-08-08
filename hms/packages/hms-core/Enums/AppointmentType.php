<?php

namespace Hms\Core\Enums;

enum AppointmentType: string
{
    case Scheduled = 'scheduled';
    case Instant = 'instant';
    case Emergency = 'emergency';
    case Vip = 'vip';
    case WalkIn = 'walk_in';
}
