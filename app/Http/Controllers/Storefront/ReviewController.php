<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Catalog\Models\Product;
use App\Domains\Support\Models\Question;
use App\Domains\Support\Models\Review;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class ReviewController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'title'   => ['nullable', 'string', 'max:100'],
            'comment' => ['required', 'string', 'min:20', 'max:2000'],
        ]);

        Review::create([
            ...$validated,
            'product_id'    => $product->id,
            'user_id'       => Auth::id(),
            'reviewer_name' => Auth::user()?->name,
            'status'        => 'pending',
        ]);

        return back()->with('success', 'Avaliação enviada! Será publicada após moderação.');
    }

    public function storeQuestion(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        Question::create([
            'product_id' => $product->id,
            'user_id'    => Auth::id(),
            'asker_name' => Auth::user()?->name,
            'question'   => $validated['question'],
            'status'     => 'pending',
        ]);

        return back()->with('success', 'Pergunta enviada! Responderemos em breve.');
    }

    public function productReviews(Product $product): JsonResponse
    {
        $reviews = Review::where('product_id', $product->id)
            ->approved()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Review $r) => [
                'id'                => $r->id,
                'rating'            => $r->rating,
                'title'             => $r->title,
                'comment'           => $r->comment,
                'author'            => $r->authorName(),
                'verified_purchase' => $r->verified_purchase,
                'created_at'        => $r->created_at->diffForHumans(),
            ]);

        $avg = Review::where('product_id', $product->id)->approved()->avg('rating');

        return response()->json([
            'reviews'    => $reviews,
            'avg_rating' => round((float) $avg, 1),
            'total'      => Review::where('product_id', $product->id)->approved()->count(),
        ]);
    }
}
