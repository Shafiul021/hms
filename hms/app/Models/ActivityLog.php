<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_log';

    protected $fillable = [
        'log_name',
        'description',
        'subject_type',
        'subject_id',
        'event',
        'causer_type',
        'causer_id',
        'attribute_changes',
        'properties',
    ];

    protected $casts = [
        'attribute_changes' => 'array',
        'properties'        => 'array',
    ];

    /**
     * The user that triggered this activity.
     */
    public function causer()
    {
        return $this->morphTo();
    }

    /**
     * The subject (model) this activity is about.
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Log an activity programmatically.
     */
    public static function record(
        string $description,
        string $logName = 'default',
        ?Model $subject = null,
        ?Model $causer = null,
        string $event = 'action',
        array $properties = []
    ): self {
        return self::create([
            'log_name'     => $logName,
            'description'  => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'causer_type'  => $causer ? get_class($causer) : null,
            'causer_id'    => $causer?->getKey(),
            'event'        => $event,
            'properties'   => $properties,
        ]);
    }
}
