<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->data['type'] ?? 'info',
                'title'      => $n->data['title'] ?? '',
                'message'    => $n->data['message'] ?? '',
                'action_url' => $n->data['action_url'] ?? null,
                'read'       => $n->read_at !== null,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->where('id', $id)->first()?->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
