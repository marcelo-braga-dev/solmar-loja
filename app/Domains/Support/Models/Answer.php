<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Answer extends Model
{
    protected $fillable = ['question_id', 'user_id', 'answer', 'is_official'];

    protected $casts = ['is_official' => 'boolean'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
