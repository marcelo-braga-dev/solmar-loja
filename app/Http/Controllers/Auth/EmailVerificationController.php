<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class EmailVerificationController extends Controller
{
    public function notice(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->intended('/conta');
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
        ]);
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect()->intended('/conta')->with('success', 'E-mail verificado com sucesso!');
    }

    public function resend(Request $request): RedirectResponse
    {
        $request->user()?->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
