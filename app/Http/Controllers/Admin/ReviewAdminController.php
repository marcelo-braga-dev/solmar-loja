<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Support\Models\Answer;
use App\Domains\Support\Models\Question;
use App\Domains\Support\Models\Review;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ReviewAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $reviews = Review::with(['product:id,name,slug', 'user:id,name'])
            ->when(
                $request->string('status')->isNotEmpty(),
                fn ($q) => $q->where('status', $request->string('status')),
                fn ($q) => $q->where('status', 'pending'),
            )
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->whereHas(
                'product',
                fn ($q2) => $q2->where('name', 'like', '%' . $request->string('q') . '%'),
            ))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $questions = Question::with(['product:id,name,slug', 'user:id,name', 'answers'])
            ->when(
                $request->string('q_status')->isNotEmpty(),
                fn ($q) => $q->where('status', $request->string('q_status')),
                fn ($q) => $q->where('status', 'pending'),
            )
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Reviews/Index', [
            'reviews'   => $reviews,
            'questions' => $questions,
            'filters'   => $request->only(['status', 'q', 'q_status']),
            'stats'     => [
                'pending_reviews'   => Review::where('status', 'pending')->count(),
                'pending_questions' => Question::where('status', 'pending')->count(),
            ],
        ]);
    }

    public function approve(Review $review): RedirectResponse
    {
        $review->update(['status' => 'approved']);

        return back()->with('success', 'Avaliação aprovada.');
    }

    public function reject(Review $review): RedirectResponse
    {
        $review->update(['status' => 'rejected']);

        return back()->with('success', 'Avaliação rejeitada.');
    }

    public function answerQuestion(Request $request, Question $question): RedirectResponse
    {
        $request->validate([
            'answer' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        Answer::create([
            'question_id' => $question->id,
            'user_id'     => $request->user()->id,
            'answer'      => $request->string('answer')->value(),
            'is_official' => true,
        ]);

        $question->update(['status' => 'answered']);

        return back()->with('success', 'Resposta publicada.');
    }
}
