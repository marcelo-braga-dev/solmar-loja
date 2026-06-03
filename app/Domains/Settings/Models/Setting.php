<?php

declare(strict_types=1);

namespace App\Domains\Settings\Models;

use Illuminate\Database\Eloquent\Model;

final class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value', 'type', 'label', 'description'];

    public function typedValue(): mixed
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json'    => json_decode($this->value ?? '{}', true),
            default   => $this->value,
        };
    }
}
