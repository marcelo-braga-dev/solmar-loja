<?php

declare(strict_types=1);

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final class Money
{
    private function __construct(
        private readonly int $cents,
        private readonly string $currency = 'BRL',
    ) {
        if ($cents < 0) {
            throw new InvalidArgumentException('Money amount cannot be negative.');
        }
    }

    public static function fromCents(int $cents, string $currency = 'BRL'): self
    {
        return new self($cents, $currency);
    }

    public static function fromFloat(float $amount, string $currency = 'BRL'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public function cents(): int
    {
        return $this->cents;
    }

    public function currency(): string
    {
        return $this->currency;
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self($this->cents + $other->cents, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self(max(0, $this->cents - $other->cents), $this->currency);
    }

    public function multiply(float $factor): self
    {
        return new self((int) round($this->cents * $factor), $this->currency);
    }

    public function percentage(float $percent): self
    {
        return $this->multiply($percent / 100);
    }

    public function isZero(): bool
    {
        return $this->cents === 0;
    }

    public function isGreaterThan(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->cents > $other->cents;
    }

    public function format(): string
    {
        return number_format($this->cents / 100, 2, ',', '.');
    }

    public function formatted(): string
    {
        return 'R$ '.$this->format();
    }

    public function equals(self $other): bool
    {
        return $this->cents === $other->cents && $this->currency === $other->currency;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException("Cannot operate on different currencies: {$this->currency} and {$other->currency}.");
        }
    }
}
